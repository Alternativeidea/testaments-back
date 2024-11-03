import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot } from '../../utils/httpErrors.js'
import express from 'express'
import { Transaction } from '../../models/transaction.js'
import { User } from '../../models/user.js'
import { getConnection } from '../../config/database.js'
import { Retention } from '../../models/retention.js'
import { sendTSTSellEmail, sendTSTToUserApprovedEmail, sendTSTToUserEmail, sendTSTToUserRecivedEmail } from '../../utils/mails/transactions.js'
import { Code } from '../../models/code.js'
import jwt from 'jsonwebtoken'
import { Rate } from '../../models/rates.js'
import { General } from '../../models/general.js'
import NP from 'number-precision'
import { Sequelize } from 'sequelize'

const router = express.Router()

router.use(isAuth)
router.get('/', async function (req, res, next) {
    const testaments = await Transaction.findAll({
        where: {
            userId: req.user.id
        }
    })
    return res.send(testaments)
})

/**
 * This methos allows the loged user to send
 * testaments to another user
 * @request
 * @response
 */
router.post('/send', async function (req, res, next) {
    const feePerRate = 1
    const feePerRateReverse = 0

    const connection = await getConnection()
    const t = await connection.transaction()
    let output = null
    try {
        output = await vine.validate({
            schema: sendVerificationSchema,
            data: req.body
        })
    } catch (error) {
        console.log(error)
        await t.rollback()
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
    }
    let decoded = null
    let closeTransaction = false
    try {
        const code = await Code.findOne({
            where: {
                code: output.code,
                email: req.user.email,
                type: Code.TYPES.SEND_TO_USER
            }
        })

        if (!code) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Code not found',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: httpErrors.NOT_FOUND.message
                    })
            )
        }
        decoded = jwt.verify(output.code, process.env.SECRET_MAILS)
        const now = new Date()
        const expiresAt = Date.parse(code.expiresAt)
        if (now > expiresAt) {
            closeTransaction = true
        }
    } catch (error) {
        console.log(error)
        if (error instanceof jwt.TokenExpiredError) {
            closeTransaction = true
        }
    }

    try {
        const transaction = await Transaction.findByPk(decoded.id, {
            include: [
                {
                    model: User,
                    as: 'to',
                    attributes: ['id', 'name', 'email']
                }
            ]
        })
        if (transaction.status !== Transaction.STATUS.USER_PENDING) {
            return next(
                new HttpError(
                    httpErrors.ALREADY_REPORTED.error_code,
                    'This transaction has already been accepted or denied',
                    {
                        ...httpErrors.ALREADY_REPORTED,
                        type: 'Validation Error',
                        details: null
                    })
            )
        }
        // TODO: here must cancell the transaction
        if (closeTransaction) {
            await Transaction.update({ status: Transaction.STATUS.SYSTEM_RETURNED }, {
                where: {
                    id: decoded.id
                }
            }, { transaction: t })
            await t.commit()
            return next(
                new HttpError(
                    httpErrors.CODE_EXPIRED.error_code,
                    'This transaction verification code has expired',
                    {
                        ...httpErrors.CODE_EXPIRED,
                        type: 'Expired Error',
                        details: null
                    })
            )
        }
        const user = await User.findByPk(decoded.userId, { transaction: t })
        const check = await User.findByPk(decoded.toUserId, { transaction: t })
        // DATA to commit
        const quantity = Number.parseFloat(decoded.quantity)
        const transactionTotal = NP.times(quantity, feePerRate)
        // const feeRetention = Number.parseFloat(decoded.quantity) * 0.01
        const feeRetention = NP.times(quantity, feePerRateReverse)
        // DATA to commit
        const fee = await Retention.create({
            transactionId: transaction.id,
            quantity: feeRetention,
            rate: transaction.rate,
            total: (transaction.rate * feeRetention)
        }, { transaction: t })
        // Update the transaction to save only the sent amount
        transaction.set({
            total: (transaction.rate * transaction.quantity),
            status: Transaction.STATUS.USER_RECIVED
        })
        user.set({ balance: NP.minus(Number.parseFloat(user.balance), transactionTotal) })
        check.set({ balance: NP.plus(Number.parseFloat(check.balance), quantity) })
        await user.save({ transaction: t })
        await check.save({ transaction: t })
        await transaction.save({ transaction: t })
        const general = await General.findByPk(1, { transaction: t })
        general.totalSharedAccepted = parseFloat(general.totalSharedAccepted) + (output.quantity)
        general.totalCountShared = parseInt(general.totalCountShared) + 1
        const divide = general.totalCountShared === 1 ? 1 : 2
        general.avarageShared = (parseFloat(general.avarageShared) + parseFloat(transaction.rate)) / divide
        await general.save({ transaction: t })
        await t.commit()
        await sendTSTToUserApprovedEmail(user, transaction)
        await sendTSTToUserRecivedEmail(user, transaction)
        // TODO: send email to receving user also
        return res.send({ transaction, fee })
    } catch (error) {
        await t.rollback()
        return next(
            makeATeaPot(error)
        )
    }
})

/**
 * This methos allows the loged user to create the
 * code verification to send TST to another user
 * @request
 * @response
 */
router.post('/start-sending-tst', async function (req, res, next) {
    const connection = await getConnection()
    const t = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: sendSchema,
            data: req.body
        })
        const check = await User.findOne({
            where: {
                email: output.email
                // status: User.STATUS.ACTIVE
            }
        }, { transaction: t })

        const user = await User.findByPk(req.user.id, { transaction: t })

        const pending = await Transaction.findAll({
            where: {
                userId: user.id,
                status: [Transaction.STATUS.USER_PENDING]
            }
        }, { transaction: t })

        let sum = 0.0
        pending.forEach(async (item) => {
            const itemDate = item.createdAt
            const copiedDate = new Date()
            copiedDate.setTime(itemDate.getTime() + (1 * 60 * 60 * 1000))
            const now = new Date()
            if (now > copiedDate) {
                item.status = Transaction.STATUS.SYSTEM_RETURNED
                // TODO: make this a collective update
                await item.save({ transaction: t })
            } else {
                sum = sum + parseFloat(item.quantity)
            }
            return item
        })
        // ? balance * 0.99 so the system can have its 0.01
        if ((user.balance * 0.99) - (output.quantity + sum) < 0) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    'Verification - User does not have the required amount to send',
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Verification - User does not have the required amount to send',
                        details: [
                            { balance: user.balance * 1.01 },
                            { balance: user.balance - user.balance * 1.01 },
                            { quantity: output.quantity + sum }
                        ]
                    })
            )
        }
        if (!check) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    'Nekaj je šlo narobe. Prejemnik za pošiljanje testamentov (TST) ne obstaja ali ni aktiven.',
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Nekaj je šlo narobe. Prejemnik za pošiljanje testamentov (TST) ne obstaja ali ni aktiven.',
                        details: null
                    })
            )
        }
        if (check.id === req.user.id) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification - User can not sent to itself',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: 'Verification - User can not sent to itself',
                        details: null
                    })
            )
        }

        // DATA to commit
        const rate = await Rate.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1
        }, { transaction: t })
        const price = Number.parseFloat(rate[0].priceSell)
        const transaction = await Transaction.create({
            quantity: output.quantity,
            userId: req.user.id,
            toUserId: check.id,
            rate: price,
            status: Transaction.STATUS.USER_PENDING,
            type: Transaction.TYPE.TRANSFER,
            total: (output.quantity * price) * -1
        }, { transaction: t })
        // make the reference for the transaction
        const d = new Date()
        transaction.reference = `SI00${(d.getFullYear() + '').substring(2)}02${(req.user.id + '').padStart(1, '0')}${(transaction.id + '').padStart(2, '0')}`
        await transaction.save({ transaction: t })
        const code = jwt.sign(transaction.toJSON(), process.env.SECRET_MAILS)
        const date = new Date()
        date.setMinutes(date.getMinutes() + 60)
        const result = await Code.create({
            code,
            email: req.user.email,
            type: Code.TYPES.SEND_TO_USER,
            timeToLive: 60,
            expiresAt: date
        })
        if (process.env.ENVIRONMENT !== 'DEV') {
            result.setDataValue('code', null)
        }
        await sendTSTToUserEmail(req.user, code)
        // await sendTSTTankyou(req.user)
        const general = await General.findByPk(1, { transaction: t })
        general.total = parseFloat(general.total) + (output.quantity)
        general.totalShared = parseFloat(general.totalShared) + (output.quantity)
        await general.save({ transaction: t })
        await t.commit()
        return res.send({ transaction, result })
    } catch (error) {
        console.log(error)
        await t.rollback()
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

/**
 * This methos allows the loged user to sell
 * testaments to the system
 * @request
 * @response
 */
router.post('/sell', async function (req, res, next) {
    const connection = await getConnection()
    const t = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: sellSchema,
            data: req.body
        })

        const user = await User.findByPk(req.user.id, { transaction: t })
        const sells = await Transaction.sum('quantity', {
            where: {
                userId: req.user.id,
                status: Transaction.STATUS.ACTIVE,
                type: Transaction.TYPE.OUTCOMING
            }
        })
        let checkBalance = user.balance
        if (sells) {
            checkBalance = user.balance - Number(sells)
        }
        // ? balance * 0.99 so the system can have its 0.01
        if (checkBalance - output.quantity < 0) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    'Nimate dovolj razpoložljivega TST za vračilo. Prosimo, preverite svoje čakajoče transakcije vračila.',
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Nimate dovolj razpoložljivega TST za vračilo. Prosimo, preverite svoje čakajoče transakcije vračila.',
                        details: null
                    })
            )
        }
        // DATA to commit
        const rate = await Rate.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1
        }, { transaction: t })
        // TODO: this one will be different
        const price = Number.parseFloat(rate[0].priceBuy)
        const transaction = await Transaction.create({
            quantity: output.quantity,
            userId: req.user.id,
            rate: price,
            total: (output.quantity * price) * -1,
            type: Transaction.TYPE.OUTCOMING
        }, { transaction: t })
        const d = new Date()
        transaction.reference = `SI00${(d.getFullYear() + '').substring(2)}02${(req.user.id + '').padStart(1, '0')}${(transaction.id + '').padStart(2, '0')}`
        await transaction.save({ transaction: t })
        const general = await General.findByPk(1, { transaction: t })
        general.total = parseFloat(general.total) + (output.quantity)
        general.totalSell = parseFloat(general.totalSell) + (output.quantity)
        await general.save({ transaction: t })
        await t.commit()
        await sendTSTSellEmail(req.user, transaction)
        return res.send(transaction)
    } catch (error) {
        console.log(error)
        await t.rollback()
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
    }
})

/**
 * Schema Validations for endpoints
 * using Vinejs
 */
export const sendSchema = vine.object({
    quantity: vine.number().positive(),
    email: vine.string().email()
})

export const sellSchema = vine.object({
    quantity: vine.number().positive()
})

export const sendVerificationSchema = vine.object({
    code: vine.string()
})

export default router
