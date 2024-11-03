import express from 'express'
import { Transaction } from '../../../models/transaction.js'
import { User } from '../../../models/user.js'
import { filterSchema, updateSchema } from '../../../schemas/transactionSchema.js'
import { makeATeaPot, makeAlreadyReportedError, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { getConnection } from '../../../config/database.js'
import { Sequelize, Op } from 'sequelize'
import { sendApprovedTSTPurchaseEmail, sendApprovedTSTSellEmail } from '../../../utils/mails/transactions.js'
import { Retention } from '../../../models/retention.js'
import { General } from '../../../models/general.js'
import { addHour, addDay } from '@formkit/tempo'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            status: {
                [Op.not]: Transaction.STATUS.SYSTEM_RETURNED
            }
        }
        const whereCheck = {
            status: Transaction.STATUS.ACTIVE,
            type: Transaction.TYPE.INCOMING
        }
        if (output.status) {
            where.status = output.status
        }
        if (output.userId) {
            // where.userId = output.userId
            where[Op.or] = [{ userId: output.userId }, { toUserId: output.userId }]
            whereCheck.userId = output.userId
        }
        if (output.startAt && output.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: addDay(output.startAt, -1),
                    [Op.lte]: addDay(output.endAt, 1)
                }
            }
        }
        const check = await Transaction.findAll({
            where: whereCheck
        })
        // mark all transactions for 36 hours past
        check.forEach(async (item) => {
            const future = addHour(item.createdAt, 36)
            const now = new Date()
            if (now > future) {
                item.status = Transaction.STATUS.DECLINED
                // TODO: make this a collective update
                await item.save()
            }
            return item
        })
        const transactions = await Transaction.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where,
            order: output.orderBy,
            include: [
                {
                    model: User.scope('mini'),
                    as: 'user'
                },
                {
                    model: User,
                    as: 'to',
                    attributes: ['id', 'email']
                }
            ]
        })
        if (output.userId) {
            transactions.forEach(i => i.setDataValue('cuId', output.userId))
        } else {
            transactions.forEach(i => i.setDataValue('cuId', -1))
        }
        return res.send(transactions)
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

router.get('/:id', async function(req, res, next) {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user'
                }
            ]
        })
        if (!transaction) {
            return next(
                makeNotFoundError('Transaction')
            )
        }
        return res.send(transaction)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.put('/:id', async function(req, res, next) {
    let connection = null
    let t = null
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        connection = await getConnection()
        t = await connection.transaction()
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        })
        if (!transaction) {
            return next(
                makeNotFoundError('Transaction')
            )
        }
        if (
            transaction.status > Transaction.STATUS.ACTIVE &&
            transaction.status < Transaction.STATUS.DECLINED) {
            return next(
                makeAlreadyReportedError('Transaction already reviewd and accpeted or denied')
            )
        }
        if (output.status === Transaction.STATUS.ACCEPTED) {
            await User.update({ balance: Sequelize.literal(`balance ${transaction.type === Transaction.TYPE.INCOMING ? '+' : '-'} ${transaction.quantity}`) },
                {
                    where: {
                        id: transaction.userId
                    },
                    transaction: t
                })
            if (transaction.type === Transaction.TYPE.OUTCOMING) {
                await Retention.create({
                    type: Retention.TYPE.sell,
                    quantity: parseFloat(transaction.quantity) * -1,
                    rate: transaction.rate,
                    total: transaction.quantity,
                    transactionId: transaction.id
                }, { transaction: t })
                const general = await General.findByPk(1, { transaction: t })
                general.totalSellAccepted = parseFloat(general.totalSellAccepted) + parseFloat(transaction.quantity)
                general.totalCountSell = parseInt(general.totalCountSell) + 1
                const divide = general.totalCountSell === 1 ? 1 : 2
                general.avarageSell = (parseFloat(general.avarageSell) + parseFloat(transaction.rate)) / divide
                await general.save({ transaction: t })
            }
            if (transaction.type === Transaction.TYPE.INCOMING) {
                const general = await General.findByPk(1, { transaction: t })
                general.totalBuyAccepted = parseFloat(general.totalBuyAccepted) + parseFloat(transaction.quantity)
                general.totalCountBuy = parseInt(general.totalCountBuy) + 1
                const divide = general.totalCountBuy === 1 ? 1 : 2
                general.avarageBuy = (parseFloat(general.avarageBuy) + parseFloat(transaction.rate)) / divide
                await general.save({ transaction: t })
            }
        }
        output.reviewerId = req.user.id
        await transaction.update(output, { transaction: t })
        // This email should be sent after approve and commit
        // TODO: make this an after update hook for better stability
        if (output.status === Transaction.STATUS.ACCEPTED && transaction.type === Transaction.TYPE.INCOMING) {
            await sendApprovedTSTPurchaseEmail(transaction.user, transaction)
        } else if (output.status === Transaction.STATUS.ACCEPTED && transaction.type === Transaction.TYPE.OUTCOMING) {
            await sendApprovedTSTSellEmail(transaction.user, transaction)
        }
        await t.commit()
        return res.send(transaction)
    } catch (error) {
        await t.rollback()
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
