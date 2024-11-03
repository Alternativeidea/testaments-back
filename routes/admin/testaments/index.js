import express from 'express'
import { Transaction } from '../../../models/transaction.js'
import { filterTSTSchema } from '../../../schemas/transactionSchema.js'
import { makeATeaPot, makeValidationError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Sequelize, Op } from 'sequelize'
import { General } from '../../../models/general.js'
import { Retention } from '../../../models/retention.js'
import { addDay } from '@formkit/tempo'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterTSTSchema,
            data: req.query
        })

        const result = {}
        const where = {}
        if (output.startAt && output.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: addDay(output.startAt, -1),
                    [Op.lte]: addDay(output.endAt, 1)
                }
            }
        }
        where.type = Transaction.TYPE.INCOMING
        where.status = [Transaction.STATUS.ACCEPTED, Transaction.STATUS.ACTIVE]
        const buys = await Transaction.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSum'],
                [Sequelize.fn('AVG', Sequelize.col('rate')), 'average']
            ],
            where,
            group: 'status'
        })
        if (buys.length === 0) {
            result.totalBuy = 0
            result.averageBuy = 0
            result.totalCountBuy = 0
            result.totalBuyAccepted = 0
        } else {
            if (buys.length === 1) {
                result.totalBuy = parseFloat(buys[0].getDataValue('totalSum'))
                result.averageBuy = parseFloat(buys[0].getDataValue('average'))
                result.totalCountBuy = buys[0].getDataValue('count')
                result.totalBuyAccepted = buys[0].status === Transaction.STATUS.ACCEPTED ? buys[0].getDataValue('count') : 0
            } else {
                result.totalBuy = parseFloat(buys[0].getDataValue('totalSum')) + parseFloat(buys[1].getDataValue('totalSum'))
                result.averageBuy = (parseFloat(buys[0].getDataValue('average')) + parseFloat(buys[1].getDataValue('average'))) / 2
                result.totalCountBuy = buys[0].getDataValue('count') + buys[1].getDataValue('count')
                result.totalBuyAccepted = buys[0].status === Transaction.STATUS.ACCEPTED ? buys[0].getDataValue('count') : buys[1].getDataValue('count')
            }
        }

        // Sells
        where.type = Transaction.TYPE.OUTCOMING
        where.status = [Transaction.STATUS.ACCEPTED, Transaction.STATUS.ACTIVE]
        const sells = await Transaction.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSum'],
                [Sequelize.fn('AVG', Sequelize.col('rate')), 'average']
            ],
            where,
            group: 'status'
        })

        if (sells.length === 0) {
            result.totalSell = 0
            result.averageSell = 0
            result.totalCountSell = 0
            result.totalSellAccepted = 0
        } else {
            if (sells.length === 1) {
                result.totalSell = parseFloat(sells[0].getDataValue('totalSum'))
                result.averageSell = parseFloat(sells[0].getDataValue('average'))
                result.totalCountSell = sells[0].getDataValue('count')
                result.totalSellAccepted = sells[0].status === Transaction.STATUS.ACCEPTED ? sells[0].getDataValue('count') : 0
            } else {
                result.totalSell = parseFloat(sells[0].getDataValue('totalSum')) + parseFloat(sells[1].getDataValue('totalSum'))
                result.averageSell = (parseFloat(sells[0].getDataValue('average')) + parseFloat(sells[1].getDataValue('average'))) / 2
                result.totalCountSell = sells[0].getDataValue('count') + sells[1].getDataValue('count')
                result.totalSellAccepted = sells[0].status === Transaction.STATUS.ACCEPTED ? sells[0].getDataValue('count') : sells[1].getDataValue('count')
            }
        }

        // Shared
        where.type = Transaction.TYPE.TRANSFER
        where.status = [Transaction.STATUS.USER_PENDING, Transaction.STATUS.USER_RECIVED]
        const shared = await Transaction.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSum'],
                [Sequelize.fn('AVG', Sequelize.col('rate')), 'average']
            ],
            where,
            group: 'status'
        })
        const fees = await Retention.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalFee']
            ]
        })

        if (shared.length === 0) {
            result.totalShared = 0
            result.averageShared = 0
            result.totalCountShared = 0
            result.totalSharedAccepted = 0
            result.feeCosts = 0
        } else {
            if (shared.length === 1) {
                result.totalShared = parseFloat(shared[0].getDataValue('totalSum'))
                result.averageShared = parseFloat(shared[0].getDataValue('average'))
                result.totalCountShared = shared[0].getDataValue('count')
                result.totalSharedAccepted = shared[0].status === Transaction.STATUS.USER_RECIVED ? shared[0].getDataValue('count') : 0
                result.feeCosts = fees.length > 0 ? parseFloat(fees[0].getDataValue('totalFee')) * -1 : 0
            } else {
                result.totalShared = parseFloat(shared[0].getDataValue('totalSum')) + parseFloat(shared[1].getDataValue('totalSum'))
                result.averageShared = (parseFloat(shared[0].getDataValue('average')) + parseFloat(shared[1].getDataValue('average')))
                result.totalCountShared = shared[0].getDataValue('count') + shared[1].getDataValue('count')
                result.totalSharedAccepted = shared[0].status === Transaction.STATUS.USER_RECIVED ? shared[0].getDataValue('count') : shared[1].getDataValue('count')
                result.feeCosts = fees.length > 0 ? parseFloat(fees[0].getDataValue('totalFee')) * -1 : 0
            }
        }

        return res.send({ id: 1, ...result })

        // const generals = await General.findByPk(1)
        // const r = {
        //     id: 1,
        //     total: parseFloat(generals.total),
        //     totalSell: parseFloat(generals.totalSell),
        //     averageSell: parseFloat(generals.averageSell),
        //     totalCountSell: parseFloat(generals.totalCountSell),
        //     totalSellAccepted: parseFloat(generals.totalSellAccepted),
        //     totalBuy: parseFloat(generals.totalBuy),
        //     averageBuy: parseFloat(generals.averageBuy),
        //     totalCountBuy: parseFloat(generals.totalCountBuy),
        //     totalBuyAccepted: parseFloat(generals.totalBuyAccepted),
        //     totalShared: parseFloat(generals.totalShared),
        //     totalSharedAccepted: parseFloat(generals.totalSharedAccepted),
        //     averageShared: parseFloat(generals.averageShared),
        //     totalCountShared: parseFloat(generals.totalCountShared),
        //     feeCosts: 0
        // }
        // return res.send(r)
    } catch (error) {
        console.log(error)
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

export default router
