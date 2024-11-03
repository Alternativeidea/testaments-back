import express from 'express'
import { makeATeaPot, makeValidationError, makeNotFoundError, httpErrors } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Category } from '../../../models/category.js'
import { Will } from '../../../models/will.js'
import { Heir } from '../../../models/heir.js'
import { getConnection } from '../../../config/database.js'
import { User } from '../../../models/user.js'
import { updateSchema } from '../../../schemas/willSchema.js'
import { HeirWill } from '../../../models/will_heirs.js'
import { Document } from '../../../models/document.js'
import { HttpError } from 'http-errors-enhanced'
import { Request } from '../../../models/request.js'

const router = express.Router()

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
                    id: output.heirs[index].id
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
        if (will.document) {
            will.document.set({
                url: output.url,
                willId: will.id,
                type: type[type.length - 1],
                processingDate: new Date()
            }, { transaction })
            await will.document.save({ transaction })
        } else {
            await Document.create({
                name: `Oporoke ${will.id}`,
                url: output.url,
                willId: will.id,
                userId: will.userId,
                type: type[type.length - 1],
                processingDate: new Date()
            }, { transaction })
        }
        const request = await Request.findOne({
            where: {
                willId: will.id,
                status: Request.STATUS.ON_DATE
            }
        }, { transaction })
        if (request) {
            request.set({
                status: Request.STATUS.ACCEPT
            }, { transaction })
            await request.save({ transaction })
        }
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
                id: req.params.willId
            }
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

export default router
