import express from 'express'
import { Rate } from '../../../models/rates.js'
import vine, { errors } from '@vinejs/vine'
import { filterSchema, adminUpdateSchema } from '../../../schemas/rateSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeValidationError } from '../../../utils/httpErrors.js'
import { Setting } from '../../../models/setting.js'
// import { addDay, monthStart, format, addMonth, addYear } from '@formkit/tempo'

const router = express.Router()
router.get('/', async function (req, res, next) {
    try {
        const rates = await Rate.scope('mini').findAll({
            limit: 1,
            order: [['createdAt', 'DESC']]
        })
        const coe = await Setting.findOne({
            where: {
                key: 'rates'
            }
        })
        coe.setDataValue('price', rates[0].price)
        coe.setDataValue('priceBuy', rates[0].priceBuy)
        coe.setDataValue('priceSell', rates[0].priceSell)
        return res.send(coe)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

router.put('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: adminUpdateSchema,
            data: req.body
        })
        const coe = await Setting.findOne({
            where: {
                key: 'rates'
            }
        })
        const rates = await Rate.scope('mini').findAll({
            limit: 1,
            order: [['createdAt', 'DESC']]
        })
        if (output.type === 'buy') {
            coe.rateBuy = output.rate
        } else if (output.type === 'sell') {
            coe.rateSell = output.rate
        }
        await coe.save()
        const price = parseFloat(rates[0].price)
        rates[0].priceBuy = price + (price / 100) * parseFloat(coe.rateBuy)
        rates[0].priceSell = price + (price / 100) * parseFloat(coe.rateSell)
        await rates[0].save()
        coe.setDataValue('price', rates[0].price)
        coe.setDataValue('priceBuy', rates[0].priceBuy)
        coe.setDataValue('priceSell', rates[0].priceSell)
        return res.send(coe)
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

router.get('/byDate', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {}
        const rates = await Rate.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            order: ['createdAt'],
            where
        })
        return res.send(rates)
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
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: error.messages
                })
        )
    }
})

router.get('/today', async function (req, res, next) {
    const rates = await Rate.findAll({
        order: [['createdAt', 'DESC']]
    })
    return res.send(rates[0])
})

export default router
