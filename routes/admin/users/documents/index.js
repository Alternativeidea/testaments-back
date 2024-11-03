import express from 'express'
import { makeATeaPot, makeValidationError } from '../../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Document } from '../../../../models/document.js'
import { createSchema, filterSchema } from '../../../../schemas/documentSchema.js'
import { addDay } from '@formkit/tempo'
import { Op } from 'sequelize'
import { User } from '../../../../models/user.js'
import { sendAddDocumentEmail, sendDeleteDocumentEmail } from '../../../../utils/mails/documents.js'
const router = express.Router({
    mergeParams: true
})

/**
 * Get the user documents
 */
router.get('/', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.params.id
        }
        if (output.startAt && output.endAt) {
            where.processingDate = {
                [Op.and]: {
                    [Op.gte]: addDay(output.startAt, -1),
                    [Op.lte]: addDay(output.endAt, 1)
                }
            }
        }
        const documents = await Document.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where,
            order: output.orderBy
        })
        return res.send(documents)
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
 * Create a document on the users profile
 */
router.post('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.params.id
        const type = output.url.split('.')
        output.type = type[type.length - 1]
        const document = await Document.create(output)
        const user = await User.findByPk(req.params.id)
        await sendAddDocumentEmail(user, document)
        return res.send(document)
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
 * Remove an Users Document
 */
router.delete('/:documentId', async function(req, res, next) {
    try {
        const document = await Document.findOne({
            where: {
                userId: req.params.id,
                id: req.params.documentId
            }
        })
        if (!document) {
            return res.send({ delete: true })
        }
        const user = await User.findByPk(req.params.id)
        await document.destroy()
        await sendDeleteDocumentEmail(user, document)
        return res.send({ delete: true })
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

export default router
