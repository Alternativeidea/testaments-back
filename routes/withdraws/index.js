import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { Withdraw } from '../../models/withdraw.js'
import { createSchema, filterSchema } from '../../schemas/withdrawSchema.js'
import vine, { errors } from '@vinejs/vine'
import { Account } from '../../models/account.js'
import { User } from '../../models/user.js'
import { HttpError } from 'http-errors-enhanced'
import { getUserMemBonuses, getUserTSTBonuses } from '../bonuses/calcs/index.js'
import { Code } from '../../models/code.js'
import ShortUniqueId from 'short-unique-id'
import { sendCodeWithdrawEmail } from '../../utils/mails/transactions.js'

const router = express.Router()
router.use(isAuth)

router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.user.id,
            status: [
                Withdraw.STATUS.ACTIVE,
                Withdraw.STATUS.DONE,
                Withdraw.STATUS.CANCELLED
            ]
        }
        if (output.status) {
            where.status = output.status
        }
        const withdraws = await Withdraw.findAll({
            where,
            order: output.orderBy,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'lastName']
                }
            ]
        })
        return res.send(withdraws)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/:id', async function (req, res, next) {
    try {
        const withdraw = await Withdraw.findByPk(req.params.id)
        if (!withdraw) {
            return next(
                makeNotFoundError('withdraw')
            )
        }
        return res.send(withdraw)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export const sendVerificationSchema = vine.object({
    code: vine.string()
})

router.post('/confirm/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: sendVerificationSchema,
            data: req.body
        })
        const code = await Code.findOne({
            where: {
                code: output.code,
                email: req.user.email,
                type: Code.TYPES.WITHDRAW_REQUEST
            }
        })
        if (!code) {
            return next(
                makeNotFoundError('Code')
            )
        }
        const withdraw = await Withdraw.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        })
        if (!withdraw) {
            return next(
                makeNotFoundError('Withdraw')
            )
        }
        withdraw.status = Withdraw.STATUS.ACTIVE
        await withdraw.save()
        return res.send(withdraw)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(makeATeaPot(error))
    }
})

router.post('/', async function (req, res, next) {
    const body = req.body
    let output = null

    const user = await User.findByPk(req.user.id)

    let filtered = []
    try {
        // This one consults the Memberships transactions
        const results = await getUserMemBonuses(user.id)
        filtered = results.filter((t) => t.relativeLevel > 0)
        // This one consults the TST transactions
        const tstResults = await getUserTSTBonuses(user.id)
        const tmpFilterd = tstResults.filter((t) => t.relativeLevel > 0)
        // Filter just by the user referrals
        filtered = filtered.concat(tmpFilterd)

        // return res.send(filtered)
        let total = 0
        for (const c of filtered) {
            total = total + Number(c.commission)
        }

        // TODO: review this one in here
        let withdraws = await Withdraw.findAll({
            where: {
                userId: user.id,
                status: [Withdraw.STATUS.ACTIVE]
            }
        })

        for (const w of withdraws) {
            total = total + Number(w.quantity)
        }

        withdraws = await Withdraw.findAll({
            where: {
                userId: user.id,
                status: [Withdraw.STATUS.DONE]
            }
        })

        for (const w of withdraws) {
            total = total - Number(w.quantity)
        }

        output = await vine.validate({
            schema: createSchema,
            data: body
        })

        if (total < output.quantity) {
            return next(new HttpError(
                httpErrors.CAN_NOT_COMPLETE_ORDER.error_code,
                'Na računu manjka denar',
                {
                    ...httpErrors.CAN_NOT_COMPLETE_ORDER,
                    type: 'Na računu manjka denar',
                    details: null
                }))
        }

        const account = await Account.findByPk(output.accountId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'id']
            }
        })
        if (!account) {
            return next(
                makeNotFoundError('Account')
            )
        }
        const withdraw = await Withdraw.create({
            ...account.dataValues,
            ...output,
            fee: 5,
            status: Withdraw.STATUS.WAITING
        })
        const uid = new ShortUniqueId({ length: 10 })
        const code = uid.rnd()
        const date = new Date()
        date.setMinutes(date.getMinutes() + 60)
        const result = await Code.create({
            code,
            email: req.user.email,
            type: Code.TYPES.WITHDRAW_REQUEST,
            timeToLive: 60,
            expiresAt: date
        })
        await sendCodeWithdrawEmail(req.user, withdraw, result.code)
        return res.send({ withdraw, result })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(makeATeaPot(error))
    }
})

export default router
