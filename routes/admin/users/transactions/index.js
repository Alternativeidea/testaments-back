import express from 'express'
import { httpErrors, makeATeaPot, makeValidationError } from '../../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { getConnection } from '../../../../config/database.js'
import { Transaction } from '../../../../models/transaction.js'
import { Rate } from '../../../../models/rates.js'
import { notEmptyString } from '../../../../schemas/validation.js'
import { User } from '../../../../models/user.js'
import { Sequelize } from 'sequelize'
import { HttpError } from 'http-errors-enhanced'
import { sendApprovedTSTPurchaseEmail, sendApprovedTSTSellEmail } from '../../../../utils/mails/transactions.js'

const router = express.Router({
    mergeParams: true
})
/**
 * Add Testaments TST to an User
 * Manually
 */
router.post('/add', async function(req, res, next) {
    const connection = await getConnection()
    const t = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: quantitySchema,
            data: req.body
        })

        const rate = await Rate.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1,
            transaction: t
        })

        let priceBuy = Number.parseFloat(rate[0].priceSell)
        if (output.rate) {
            priceBuy = output.rate
        }

        const transaction = await Transaction.create({
            quantity: output.quantity,
            type: Transaction.TYPE.MANUALLY_ADD,
            paymentMethod: output.paymentMethod,
            notes: output.notes,
            status: Transaction.STATUS.ACCEPTED,
            rate: priceBuy,
            userId: req.params.id,
            reviewerId: req.user.id,
            total: (priceBuy * output.quantity),
            createdAt: output.createdAt ?? new Date(),
            updatedAt: output.createdAt ?? new Date()
        }, { transaction: t })
        // Make the reference
        const d = new Date()
        transaction.reference = `SI00${(d.getFullYear() + '').substring(2)}02${(req.params.id + '').padStart(1, '0')}${(transaction.id + '').padStart(2, '0')}`
        await transaction.save({ transaction: t })
        // Update User Balance
        await User.update({ balance: Sequelize.literal(`balance + ${transaction.quantity}`) },
            {
                where: {
                    id: transaction.userId
                },
                transaction: t
            })
        const user = await User.findByPk(transaction.userId)
        await t.commit()
        await sendApprovedTSTPurchaseEmail(user, transaction)
        return res.send(transaction)
    } catch (error) {
        console.log(error)
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
 * Remove Testaments TST from an User
 * Manually
 */
router.post('/remove', async function(req, res, next) {
    const connection = await getConnection()
    const t = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: quantitySchema,
            data: req.body
        })
        const user = await User.findByPk(req.params.id)

        if ((user.balance - output.quantity) < 0) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    'Verification - User does not have the required amount to send',
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Verification - User does not have the required amount to send',
                        details: null
                    })
            )
        }

        const rate = await Rate.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1,
            transaction: t
        })

        let priceSell = Number.parseFloat(rate[0].priceBuy)
        if (output.rate) {
            priceSell = output.rate
        }

        const transaction = await Transaction.create({
            quantity: output.quantity,
            type: Transaction.TYPE.MANUALLY_RETURN,
            paymentMethod: output.paymentMethod,
            notes: output.notes,
            status: Transaction.STATUS.ACCEPTED,
            rate: priceSell,
            userId: req.params.id,
            reviewerId: req.user.id,
            total: (priceSell * output.quantity) * -1
        }, { transaction: t })
        // Make the reference
        const d = new Date()
        transaction.reference = `SI00${(d.getFullYear() + '').substring(2)}02${(req.params.id + '').padStart(1, '0')}${(transaction.id + '').padStart(2, '0')}`
        await transaction.save({ transaction: t })
        // Update User Balance
        await User.update({ balance: Sequelize.literal(`balance - ${transaction.quantity}`) },
            {
                where: {
                    id: transaction.userId
                },
                transaction: t
            })
        await sendApprovedTSTSellEmail(user, transaction)
        await t.commit()
        return res.send(transaction)
    } catch (error) {
        console.log(error)
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
export const quantitySchema = vine.object({
    quantity: vine.number().positive(),
    paymentMethod: vine.string().use(notEmptyString()),
    rate: vine.number().positive().optional().nullable(),
    notes: vine.string().optional().nullable(),
    createdAt: vine.date().optional().nullable()
})

export default router
