import express from 'express'
import { filterSchema } from '../../../schemas/willSchema.js'
import { makeATeaPot, makeValidationError, makeNotFoundError, makeAlreadyReportedError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Category } from '../../../models/category.js'
import { Will } from '../../../models/will.js'
import { Request } from '../../../models/request.js'
import { Heir } from '../../../models/heir.js'
import { getConnection } from '../../../config/database.js'
import { User } from '../../../models/user.js'
import { updateStatusSchema, createAppointmentSchema } from '../../../schemas/requestSchema.js'
import { sendDeletedWillEmail, sendEditedWillEmail, sendNewWillEmail, sendAppointmentEmail } from '../../../utils/mails/wills.js'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'url'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {}
        if (output.status) {
            where.status = output.status
        }
        const wills = await Request.findAll({
            where,
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            order: [['id', 'DESC']],
            include: [
                {
                    model: Will,
                    as: 'will',
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'name']
                        },
                        {
                            model: Heir.scope('mini'),
                            as: 'heirs'
                        }
                    ]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email']
                }
            ]
        })
        for (const element of wills) {
            element.setDataValue('updatedAt', new Date())
            const heirs = await Heir.findAll({
                where: {
                    userId: element.userId
                }
            })
            element.setDataValue('heirs', heirs)
        }
        wills.forEach(element => {
            element.will.heirs.forEach((h) => {
                h.setDataValue('share', h.HeirWill.share)
                h.setDataValue('constrains', h.HeirWill.constrains)
                h.setDataValue('HeirWill')
            })
        })
        return res.send(wills)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(
            makeATeaPot(error)
        )
    }
})

/**
 * This method allows the admin user to get an
 * user requests for Wills
 * @request /:id as the userId and /:willId as willId
 * @response
 */
router.patch('/:id', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: updateStatusSchema,
            data: req.body
        })
        const requesting = await Request.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: Will.scope('mini'),
                    as: 'will'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        }, { transaction })
        if (!requesting) {
            return next(
                makeNotFoundError('Request')
            )
        }
        if (requesting.status === Request.STATUS.IN_PROCESS) {
            let newHistoryItem = {}
            let status = Will.STATUS.ACTIVE
            let requestingStatus = Request.STATUS.ACCEPT
            if (output.status === Request.STATUS.ACCEPT) {
                newHistoryItem = { action: 'Update Accept', date: new Date(), admin: req.user.id }
            } else {
                newHistoryItem = { action: 'Update Cancel', date: new Date(), admin: req.user.id }
                status = Will.STATUS.ON_HOLD
                requestingStatus = Request.STATUS.CANCELLED
            }
            const will = await Will.findByPk(requesting.will.id)
            will.set({
                status
            }, { transaction })
            requesting.set({
                status: requestingStatus,
                history: [...requesting.history, newHistoryItem]
            }, { transaction })
            await will.save({ transaction })
            await requesting.save({ transaction })
            await transaction.commit()
            if (output.status === Request.STATUS.ACCEPT) {
                if (requesting.action === Request.ACTIONS.ADD) {
                    await sendNewWillEmail(requesting.user)
                } else if (requesting.action === Request.ACTIONS.EDIT) {
                    await sendEditedWillEmail(requesting.user)
                } else if (requesting.action === Request.ACTIONS.DELETE) {
                    await sendDeletedWillEmail(requesting.user)
                }
            }
            return res.send(requesting)
        }
        return next(
            makeAlreadyReportedError('Already Reported')
        )
    } catch (error) {
        await transaction.rollback()
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(
            makeATeaPot(error)
        )
    }
})

router.put('/:id', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: createAppointmentSchema,
            data: req.body
        })
        const request = await Request.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: Will.scope('mini'),
                    as: 'will'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        }, { transaction })
        if (!request) {
            return next(
                makeNotFoundError(`Request ${req.params.id}`)
            )
        }
        output.status = Request.STATUS.ON_DATE
        request.set(output, { transaction })
        await sendAppointmentEmail(request.user, request)
        await request.save({ transaction })
        await transaction.commit()
        return res.send(request)
    } catch (error) {
        await transaction.rollback()
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(
            makeATeaPot(error)
        )
    }
})

router.get('/pdf/:id', async function(req, res) {
    // const __filename = fileURLToPath(import.meta.url)
    return res.send({ message: 'hello' })
    // const __dirname = path.dirname(__filename)
    // const __dirname = ''

    // const html = `<html>
    //     <p>Hola nnds</p>
    // </html>`
    // const options = {
    //     format: 'A4',
    //     filePath: path.join(__dirname, '/tmp', 'lotr.pdf'),
    //     landscape: false,
    //     resolution: {
    //         height: 1920,
    //         width: 1080
    //     }
    // }

    // await html2pdf.createPDF(html, options)

    // console.log('PDF Generated...')
    // return res.download(path.join(__dirname, '/tmp', 'lotr.pdf'))

    // const result = await generatePdf()
    // return res.download(result)
    // return res.download(path.join('/tmp', 'out.pdf'))
    // const doc = new PDFDocument()

    // const __filename = fileURLToPath(import.meta.url)

    // const __dirname = path.dirname(__filename)
    // console.log(__dirname)

    // const r = doc.pipe(fs.createWriteStream(path.join('/tmp', 'out.pdf')))

    // doc.text('product.name')
    // doc.text('product.name')
    // doc.text('product.name')
    // doc.text('product.name')
    // doc.text('product.name')
    // doc.text('product.name')
    // doc.text('product.price +  €')
    // doc.end()

    // r.on('finish', function() {
    //     // the response is a "forced" download of a file I had to save on the disk
    //     // res.writeHead(200, {
    //     //     'Content-Type': 'application/pdf',
    //     //     'Access-Control-Allow-Origin': '*',
    //     //     'Content-Disposition': 'attachment; filename=out.pdf'
    //     // })
    //     res.download(path.join('/tmp', 'out.pdf'))
    // })
})

const generatePdf = async () => {
    return new Promise((resolve, reject) => {
        // const doc = new PDFDocument()
        // doc.text('How Are You')
        // doc.end()
        // const buffers = []
        // doc.on('data', buffers.push.bind(buffers))
        // doc.on('end', () => {
        //     const pdfData = Buffer.concat(buffers)
        //     resolve(pdfData)
        // })
        const doc = new PDFDocument()

        const __filename = fileURLToPath(import.meta.url)

        const __dirname = path.dirname(__filename)
        console.log(__dirname)

        const r = doc.pipe(fs.createWriteStream(path.join('/tmp', 'out.pdf')))

        doc.text('product.name')
        doc.text('product.name')
        doc.text('product.name')
        doc.text('product.name')
        doc.text('product.name')
        doc.text('product.name')
        doc.text('product.price +  €')
        doc.end()
        r.on('finish', function() {
            // the response is a "forced" download of a file I had to save on the disk
            // res.writeHead(200, {
            //     'Content-Type': 'application/pdf',
            //     'Access-Control-Allow-Origin': '*',
            //     'Content-Disposition': 'attachment; filename=out.pdf'
            // })
            // res.download(path.join('/tmp', 'out.pdf'))
            resolve(true)
        })
    })
}

export default router
