import { Category } from '../../../../models/category.js'
import { Will } from '../../../../models/will.js'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../../../utils/httpErrors.js'
import { HttpError } from 'http-errors-enhanced'
import express from 'express'
import { filterSchema, createSchema, updateSchema } from '../../../../schemas/willSchema.js'
import vine, { errors } from '@vinejs/vine'
import { Heir } from '../../../../models/heir.js'
import { User } from '../../../../models/user.js'
import { getConnection } from '../../../../config/database.js'
import requestRouter from './requests/index.js'
import { Document } from '../../../../models/document.js'
import { HeirWill } from '../../../../models/will_heirs.js'
import { sendNewWillEmail } from '../../../../utils/mails/wills.js'

const router = express.Router({ mergeParams: true })

router.post('/', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.params.id
        const user = await User.findByPk(output.userId, {
            attributes: ['id', 'name', 'email']
        })
        output.status = Will.STATUS.ACTIVE
        const will = await Will.create(output, { transaction })
        let sum = 0
        for (let index = 0; index < output.heirs.length; index++) {
            sum += output.heirs[index].share
            output.heirs[index].willId = will.id
            const heir = await Heir.findOne({
                where: {
                    id: output.heirs[index].id,
                    userId: req.params.id
                }
            }, { transaction })
            if (!heir) {
                await transaction.rollback()
                return next(
                    makeNotFoundError('heir')
                )
            }
            await HeirWill.create({
                willId: will.id,
                heirId: heir.id,
                share: output.heirs[index].share,
                constrains: output.heirs[index].constrains
            }, { transaction })
        }
        if (sum !== 100) {
            await transaction.rollback()
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Validation - Shares on heirs must be 100%',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: null
                    })
            )
        }
        const type = output.url.split('.')
        await Document.create({
            name: `Oporoke ${will.id}`,
            url: output.url,
            userId: req.params.id,
            willId: will.id,
            type: type[type.length - 1],
            processingDate: output.date
        }, { transaction })
        await sendNewWillEmail(user)
        await transaction.commit()
        const result = await Will.findByPk(will.id, {
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs',
                    through: { attributes: ['share', 'constrains'] }
                },
                {
                    model: Document,
                    as: 'document'
                }
            ]
        })
        return res.send(result)
    } catch (error) {
        console.log(error)
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

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.params.id,
            status: [Will.STATUS.ACTIVE, Will.STATUS.ON_HOLD]
        }
        if (output.status) {
            where.status = output.status
        }
        if (output.categories) {
            where.categoryId = output.categories
        }
        const wills = await Will.findAll({
            where,
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs'
                },
                {
                    model: Document,
                    attributes: ['id', 'url'],
                    as: 'document'
                }
            ]
        })

        wills.forEach(element => {
            element.heirs.forEach((h) => {
                h.setDataValue('share', h.HeirWill.share)
                h.setDataValue('constrains', h.HeirWill.constrains)
                h.setDataValue('HeirWill')
            })
        })
        return res.send(wills)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            makeATeaPot(error)
        )
    }
})

router.use('/requests', requestRouter)
/**
 * This method allows the admin user to get an
 * specific user will
 * @request /:id as the userId and /:willId as willId
 * @response
 */
router.get('/:willId', async function(req, res, next) {
    try {
        const will = await Will.findOne({
            where: {
                id: req.params.willId,
                userId: req.params.id
            },
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: Heir,
                    as: 'heirs'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        })
        if (!will) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Error unexpected',
                        details: null
                    })
            )
        }
        return res.send(will)
    } catch (err) {
        console.log(err)
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: { ...err }
                })
        )
    }
})

/**
 * This method allows the admin user to update an
 * specific user will status
 * @request /:id as the userId and /:willId as willId
 * @response
 */
router.put('/:willId', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const will = await Will.findByPk(req.params.willId, {
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs',
                    through: { attributes: ['share', 'constrains'] }
                },
                {
                    model: Document,
                    as: 'document'
                }
            ]
        })

        let sum = 0
        await will.setHeirs([])
        for (let index = 0; index < output.heirs.length; index++) {
            sum += output.heirs[index].share
            output.heirs[index].willId = will.id
            const heir = await Heir.findOne({
                where: {
                    id: output.heirs[index].id,
                    userId: req.params.id
                }
            }, { transaction })
            if (!heir) {
                await transaction.rollback()
                return next(
                    makeNotFoundError('heir')
                )
            }
            await HeirWill.create({
                willId: will.id,
                heirId: heir.id,
                share: output.heirs[index].share,
                constrains: output.heirs[index].constrains
            }, { transaction })
        }
        if (sum !== 100) {
            await transaction.rollback()
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Validation - Shares on heirs must be 100%',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: null
                    })
            )
        }
        const type = output.url.split('.')
        will.set({
            categoryId: output.categoryId,
            description: output.description,
            constrains: output.constrains,
            status: Will.STATUS.ACTIVE
        }, { transaction })
        await will.save({ transaction })
        will.document.set({
            url: output.url,
            willId: will.id,
            type: type[type.length - 1],
            processingDate: new Date()
        }, { transaction })
        await will.document.save({ transaction })
        await transaction.commit()
        const result = await Will.findByPk(will.id, {
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs',
                    through: { attributes: ['share', 'constrains'] }
                },
                {
                    model: Document,
                    as: 'document'
                }
            ]
        })
        return res.send(result)
    } catch (error) {
        console.log(error)
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

router.delete('/:willId', async function(req, res, next) {
    const connection = await getConnection()
    let transaction = null
    try {
        const will = await Will.findOne({
            where: {
                id: req.params.willId,
                userId: req.params.id
            },
            include: [
                {
                    model: Heir,
                    as: 'heirs'
                }
            ]
        })
        if (!will) {
            return res.send({ deleted: true })
        }
        transaction = await connection.transaction()
        const requests = await Request.findAll({
            where: {
                willId: will.id
            }
        })
        for (const element of requests) {
            await element.destroy({ transaction })
        }
        await will.destroy({ transaction })
        await transaction.commit()
        return res.send({ deleted: true })
    } catch (err) {
        await transaction.rollback()
        console.log(err)
        return next(
            makeATeaPot(err)
        )
    }
})
// router.use('/:id/heirs', heirsRouter)

export default router
