import express from 'express'
import { transformEncodedStringArray } from '../../../schemas/validation.js'
import { makeATeaPot, makeValidationError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { BonusesRate } from '../../../models/bonusesRate.js'
import { NotFoundError } from 'http-errors-enhanced'
import { Op } from 'sequelize'
import { addDay } from '@formkit/tempo'
const router = express.Router()

const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable(),
    type: vine.enum(['all', 'premium', 'tst']).parse((v) => v ?? 'all'),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional()
})

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {}

        if (output.type === 'tst') {
            where.type = 'tst'
        }
        if (output.type === 'premium') {
            where.type = 'premium'
        }
        if (output.startAt && output.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: addDay(output.startAt, -1),
                    [Op.lte]: addDay(output.endAt)
                }
            }
        }
        const rates = await BonusesRate.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            where,
            offset: output.offset,
            order: output.orderBy
        })
        return res.send(rates)
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

router.get('/current', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const rates = await BonusesRate.findAll({
            where: {
                isCurrent: true
            },
            order: [['createdAt', 'DESC']]
        })
        if (rates.length === 0) {
            return next(NotFoundError('bonusesRate'))
        }
        return res.send(rates)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

export const createSchema = vine.object({
    direct: vine.number(),
    indirect: vine.number(),
    type: vine.enum(['tst', 'premium'])
})

router.post('/', async function(req, res, next) {
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }
    try {
        const current = await BonusesRate.findOne({
            where: {
                isCurrent: true,
                type: output.type
            }
        })
        current.isCurrent = false
        await current.save()

        output.isCurrent = true
        output.direct = output.direct / 100
        output.indirect = output.indirect / 100
        const rate = await BonusesRate.create(output)
        return res.send(rate)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

export default router
