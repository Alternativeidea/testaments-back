import express from 'express'
import { makeATeaPot, makeValidationError } from '../../../../utils/httpErrors.js'
import { User } from '../../../../models/user.js'
import { getUserMemBonuses, getUserTSTBonuses } from '../../../bonuses/calcs/index.js'
import { Withdraw } from '../../../../models/withdraw.js'
import { filterDataBonus } from '../../../../schemas/bonusSchema.js'
import vine, { errors } from '@vinejs/vine'
const router = express.Router({
    mergeParams: true
})
router.get('/', async function (req, res, next) {
    const user = await User.findByPk(req.params.id)
    try {
        // const bonuses = await getUserTSTBonuses(user.id, 'm.id')
        const bonuses = await getUserTSTBonuses(user.id)
        const sums = {
            direct: 0,
            indirect: 0
        }
        const counts = {
            direct: 0,
            indirect: 0
        }
        const traffic = {
            direct: 0,
            indirect: 0
        }
        // return res.send(results)
        bonuses.forEach((e) => {
            if (e.relativeLevel > 1) {
                traffic.indirect += Number(e.total)
                counts.indirect += 1
                sums.indirect += Number.parseFloat(e.commission)
            } else {
                if (e.relativeLevel === 1) {
                    traffic.direct += Number(e.total)
                    counts.direct += 1
                }
                sums.direct += Number.parseFloat(e.commission)
            }
        })
        return res.send({ sums, counts, traffic })
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/balance', async function (req, res, next) {
    const user = await User.findByPk(req.params.id)
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
    const user = await User.findByPk(req.params.id)
    try {
        const bonuses = await getUserMemBonuses(user.id)
        const sums = {
            direct: 0,
            indirect: 0
        }
        const counts = {
            direct: 0,
            indirect: 0
        }
        const traffic = {
            direct: 0,
            indirect: 0
        }
        bonuses.forEach((e) => {
            if (e.relativeLevel > 1) {
                traffic.indirect += e.total
                counts.indirect += 1
                sums.indirect += Number.parseFloat(e.commission)
            } else {
                if (e.relativeLevel === 1) {
                    traffic.direct += e.total
                    counts.direct += 1
                }
                sums.direct += Number.parseFloat(e.commission)
            }
        })
        return res.send({ sums, counts, traffic })
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/data/memberships', async function (req, res, next) {
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

    const user = await User.findByPk(req.params.id)

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

export default router
