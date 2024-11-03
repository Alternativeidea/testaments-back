import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { Rate } from '../../models/rates.js'
import vine, { errors } from '@vinejs/vine'
import { filterSchema, graphSchema } from '../../schemas/rateSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot } from '../../utils/httpErrors.js'
import { Sequelize, Op } from 'sequelize'
import { addDay, monthStart, format, addMonth, addYear } from '@formkit/tempo'

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: graphSchema,
            data: req.query
        })
        const where = {}
        if (output.period === 'week') {
            const tempoToday = new Date()
            const tempoWeekBefore = addDay(new Date(), -7)
            // const dayToday = format(tempoToday, 'D')
            // const dayTodayLabel = format(tempoToday, 'dddd')
            // const dayWeekBefore = format(tempoWeekBefore, 'D')
            const labelsWeek = []
            const l = {}
            for (let i = 0; i < 8; i++) {
                const tempDate = addDay(new Date(), -i)
                const label = format({ date: tempDate, format: 'dddd', locale: 'sl' })
                const labelDay = format(tempDate, 'D')
                labelsWeek.push({
                    [labelDay]: {
                        tempDate,
                        labelDay,
                        label
                    }
                })
                l[labelDay] = {
                    tempDate,
                    labelDay,
                    label
                }
            }

            // Get the rates for the whole week
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: tempoWeekBefore,
                    [Op.lte]: tempoToday
                }
            }
            let attributes = [
                [Sequelize.fn('AVG', Sequelize.col('priceBuy')), 'cena'],
                [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'createdOn']
            ]
            if (output.price === 'sell') {
                attributes = [
                    [Sequelize.fn('AVG', Sequelize.col('priceSell')), 'cena'],
                    [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'createdOn']
                ]
            }
            const rates = await Rate.findAll({
                attributes,
                where,
                order: [['createdOn']],
                group: 'createdOn'
            })
            // order: [[Sequelize.literal('"createdOn"')]],
            // return res.send(rates)
            for (let index = 0; index < rates.length; index++) {
                rates[index].setDataValue('time', l[String(rates[index].dataValues.createdOn)].label)
                rates[index].setDataValue('createdOn')
            }
            return res.send(rates)
            // tempoToday,
            // tempoWeekBefore,
            // dayToday,
            // dayWeekBefore,
            // dayTodayLabel,
            // l,
            // labelsWeek
        }
        if (output.period === 'month') {
            const tempoToday = new Date()
            const monthStartDay = monthStart(tempoToday)
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: monthStartDay,
                    [Op.lte]: tempoToday
                }
            }

            let attributes = [
                [Sequelize.fn('AVG', Sequelize.col('priceBuy')), 'cena'],
                [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'time']
            ]
            if (output.price === 'sell') {
                attributes = [
                    [Sequelize.fn('AVG', Sequelize.col('priceSell')), 'cena'],
                    [Sequelize.fn('DAY', Sequelize.col('createdAt')), 'time']
                ]
            }

            const rates = await Rate.findAll({
                attributes,
                where,
                order: [['time']],
                group: 'time'
            })
            for (let index = 0; index < rates.length; index++) {
                rates[index].setDataValue('time', 'dan ' + rates[index].dataValues.time)
                // rates[index].setDataValue('createdOn')
            }
            return res.send(rates)
        }
        if (output.period === 'today') {
            const tempoToday = new Date()
            const tempoYesterday = addDay(new Date(), -1)
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: tempoYesterday,
                    [Op.lte]: tempoToday
                }
            }
            let attributes = [
                [Sequelize.fn('AVG', Sequelize.col('priceBuy')), 'cena'],
                [Sequelize.fn('HOUR', Sequelize.col('createdAt')), 'createdOn']
            ]
            if (output.price === 'sell') {
                attributes = [
                    [Sequelize.fn('AVG', Sequelize.col('priceSell')), 'cena'],
                    [Sequelize.fn('HOUR', Sequelize.col('createdAt')), 'createdOn']
                ]
            }
            const rates = await Rate.findAll({
                attributes,
                where,
                order: [['createdOn']],
                group: 'createdOn'
            })
            for (let index = 0; index < rates.length; index++) {
                rates[index].setDataValue('time', rates[index].dataValues.createdOn + ':00')
                rates[index].setDataValue('createdOn')
            }
            return res.send(rates)
        }
        if (output.period === 'six' || output.period === 'year') {
            const tempoToday = new Date()
            let minusMonths = -6
            if (output.period === 'year') {
                minusMonths = -12
            }
            const months = [
                'Januar',
                'Februar',
                'Marec',
                'April',
                'Maj',
                'Junij',
                'Julij',
                'Avgust',
                'September',
                'Oktober',
                'November',
                'December'
            ]
            const tempoYesterday = addMonth(new Date(), minusMonths)
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: tempoYesterday,
                    [Op.lte]: tempoToday
                }
            }

            let attributes = [
                [Sequelize.fn('AVG', Sequelize.col('priceBuy')), 'cena'],
                [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'time']
            ]
            if (output.price === 'sell') {
                attributes = [
                    [Sequelize.fn('AVG', Sequelize.col('priceSell')), 'cena'],
                    [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'time']
                ]
            }

            const rates = await Rate.findAll({
                attributes,
                where,
                order: [['time']],
                group: 'time'
            })
            const firstPart = []
            const secondPart = []
            for (let i = 0; i < rates.length; i++) {
                if (rates[i].dataValues.time < 10) {
                    // first part of year
                    firstPart.push(rates[i])
                } else {
                    secondPart.push(rates[i])
                }
            }
            // rates.sort((a, b) => {
            //     return a.dataValues.time - b.dataValues.time
            // })
            firstPart.sort((a, b) => {
                return b.dataValues.time - a.dataValues.time
            })
            secondPart.sort((a, b) => {
                return b.dataValues.time - a.dataValues.time
            })

            const full = firstPart.concat(secondPart)
            for (const item of full) {
                item.setDataValue('time', months[(item.dataValues.time - 1)]) //= months[item.dataValues.item]
            }
            return res.send(full.reverse())
        }
        if (output.period === 'five') {
            const tempoToday = new Date()
            const tempoYesterday = addYear(new Date(), -5)
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: tempoYesterday,
                    [Op.lte]: tempoToday
                }
            }

            let attributes = [
                [Sequelize.fn('AVG', Sequelize.col('priceBuy')), 'cena'],
                [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'time']
            ]
            if (output.price === 'sell') {
                attributes = [
                    [Sequelize.fn('AVG', Sequelize.col('priceSell')), 'cena'],
                    [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'time']
                ]
            }

            const rates = await Rate.findAll({
                attributes,
                where,
                order: [['time']],
                group: 'time'
            })
            return res.send(rates)
        }
        if (output.start) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: output.start,
                    [Op.lte]: output.end
                }
            }
        }
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
        if (output.start) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: output.start,
                    [Op.lte]: output.end
                }
            }
        }
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
        order: [['createdAt', 'DESC']],
        limit: 1,
        attributes: ['id', 'priceGram24k', 'priceBuy', 'priceSell']
    })
    return res.send(rates[0])
})

export default router
