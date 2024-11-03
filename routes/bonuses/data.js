import express from 'express'
import { User } from '../../models/user.js'
import { makeATeaPot, makeValidationError } from '../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { filterDataBonus } from '../../schemas/bonusSchema.js'
import { Withdraw } from '../../models/withdraw.js'
import { getUserMemBonuses, getUserTSTBonuses } from './calcs/index.js'

const router = express.Router({
    mergeParams: true
})

router.get('/tst', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        const results = await getUserTSTBonuses(user.id)
        const filtered = results.filter((t) => t.relativeLevel > 0)
        return res.send(filtered)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/balance', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        let filtered = []
        const results = await getUserMemBonuses(user.id)
        const tstResults = await getUserTSTBonuses(user.id)

        filtered = results.filter((t) => t.relativeLevel > 0)
        const tmpFilterd = tstResults.filter((t) => t.relativeLevel > 0)
        filtered = filtered.concat(tmpFilterd)

        let total = 0
        for (const c of filtered) {
            total = total + Number(c.commission)
        }
        // Get just the withdraws already done
        const withdraws = await Withdraw.findAll({
            where: {
                userId: user.id,
                status: [Withdraw.STATUS.DONE]
            }
        })

        for (const w of withdraws) {
            total = total - Number(w.quantity)
        }
        return res.send({ balance: total })
        // console.log(results)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/memberships', async function (req, res, next) {
    let filters = null
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: filterDataBonus,
            data: req.query
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }

    const user = await User.findByPk(req.user.id)
    let filtered = []
    try {
        // This one consults the TST transactions
        if (filters.type === 'all' || filters.type === 'tst') {
            const tstResults = await getUserTSTBonuses(user.id)
            // const tmpFilterd = tstResults.filter((t) => t.relativeLevel > 0)
            filtered = tstResults.filter((t) => t.relativeLevel > 0)
        }
        // This one consults the Memberships
        if (filters.type === 'all' || filters.type === 'memberships') {
            const results = await getUserMemBonuses(user.id)
            const temp = results.filter((t) => t.relativeLevel > 0)
            filtered = filtered.concat(temp)
        }

        if (filters.level === 'direct') {
            return res.send(filtered.filter((t) => t.relativeLevel === 1))
        }
        if (filters.level === 'indirects') {
            return res.send(filtered.filter((t) => t.relativeLevel > 1))
        }

        return res.send(filtered)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/memberships/:userId', async function (req, res, next) {
    let filters = null
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: filterDataBonus,
            data: req.query
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }

    const user = await User.findByPk(req.user.id)
    let filtered = []
    try {
        console.log(req.params.userId)
        // This one consults the TST transactions
        if (filters.type === 'all' || filters.type === 'tst') {
            const tstResults = await getUserTSTBonuses(req.user.id)
            // const tmpFilterd = tstResults.filter((t) => t.relativeLevel > 0)
            filtered = tstResults.filter((t) => t.uId === Number(req.params.userId))
        }
        // This one consults the Memberships
        if (filters.type === 'all' || filters.type === 'memberships') {
            const results = await getUserMemBonuses(user.id)
            const temp = results.filter((t) => t.uId === Number(req.params.userId))
            filtered = filtered.concat(temp)
        }
        return res.send(filtered)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export default router
