import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'
import { makeATeaPot, makeAlreadyReportedError, makeValidationError } from '../../utils/httpErrors.js'
import express from 'express'
import { Transaction } from '../../models/transaction.js'
import { sendTSTPurchaseEmail } from '../../utils/mails/transactions.js'
import { getConnection } from '../../config/database.js'
import { Rate } from '../../models/rates.js'
import { filterSchema } from '../../schemas/transactionSchema.js'
import { General } from '../../models/general.js'
import { addDay, addHour, format } from '@formkit/tempo'
import { User } from '../../models/user.js'
import { Op } from 'sequelize'

const router = express.Router()

router.use(isAuth)
/**
 * This methos allows the loged user to retrieve its
 * testaments transactions
 * @request
 * @response
 */
router.get('/', async function (req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        // mark all active transactions for 36 hours past
        const check = await Transaction.findAll({
            where: {
                userId: req.user.id,
                status: Transaction.STATUS.ACTIVE,
                type: Transaction.TYPE.INCOMING
            }
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
        const where = {}

        if (output.startAt && output.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: format(output.startAt, 'YYYY-MM-DD'),
                    [Op.lte]: format(addDay(output.endAt, 1), 'YYYY-MM-DD')
                }
            }
        }

        const transactions = await Transaction.findAll({
            limit: output.limit >= 0 ? output.limit : 100,
            offset: output.offset,
            where: {
                ...where,
                [Op.or]: [{ userId: req.user.id }, { toUserId: req.user.id }],
                status: {
                    [Op.not]: [Transaction.STATUS.SYSTEM_RETURNED, Transaction.STATUS.DECLINED]
                }
            },
            include: [
                {
                    model: User,
                    as: 'to',
                    attributes: ['id', 'email']
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ],
            order: output.orderBy
        })
        transactions.forEach(i => i.setDataValue('cuId', req.user.id))
        return res.send(transactions)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        makeATeaPot(error)
    }
})

/**
 * This methos allows the loged user to send the form
 * to purhcase TST, needs admin review
 * @request
 * @response
 */
router.post('/', async function (req, res, next) {
    const connection = await getConnection()
    const t = await connection.transaction()

    try {
        const output = await vine.validate({
            schema: purchaseSchema,
            data: req.body
        })
        output.userId = req.user.id

        const check = await Transaction.findAll({
            where: {
                userId: req.user.id,
                status: Transaction.STATUS.ACTIVE,
                type: Transaction.TYPE.INCOMING
            }
        }, { transaction: t })

        // mark all transactions for 36 hours past
        let sum = 0
        check.forEach(async (item) => {
            const future = addHour(item.createdAt, 36)
            const now = new Date()
            if (now > future) {
                console.log(sum)
                item.status = Transaction.STATUS.DECLINED
                // TODO: make this a collective update
                await item.save()
            } else {
                sum++
            }
            return item
        })
        if (sum > 0) {
            return next(
                makeAlreadyReportedError('Vaše zadnje naročilo je še vedno v obdelavi. Obdelava lahko poteka do 24 ur')
            )
        }
        const rate = await Rate.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1
        }, { transaction: t })
        output.rate = Number.parseFloat(rate[0].priceSell)
        output.total = Number.parseFloat(output.rate) * Number.parseFloat(output.quantity)
        const transaction = await Transaction.create(output, { transaction: t })
        const d = new Date()
        transaction.reference = `SI00${(d.getFullYear() + '').substring(2)}02${(req.user.id + '').padStart(1, '0')}${(transaction.id + '').padStart(2, '0')}`
        await transaction.save({ transaction: t })
        await sendTSTPurchaseEmail(req.user, transaction)
        // Update general overall data
        const general = await General.findByPk(1, { transaction: t })
        general.total = parseFloat(general.total) + output.quantity
        general.totalBuy = parseFloat(general.totalBuy) + output.quantity
        await general.save({ transaction: t })
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

/**
 * Schema Validations for endpoints
 * using Vinejs
 */
export const purchaseSchema = vine.object({
    quantity: vine.number().positive()
})

export default router
