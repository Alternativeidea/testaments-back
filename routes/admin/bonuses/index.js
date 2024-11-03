import express from 'express'
import isAuth from '../../../middlewares/isAuth.js'
import { User } from '../../../models/user.js'
import { makeATeaPot, makeValidationError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { getUserMemBonuses, getUserTSTBonuses } from '../../bonuses/calcs/index.js'

const router = express.Router()
router.use(isAuth)

export const filterSchema = vine.object({
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})

router.get('/generals', async function (req, res, next) {
    const filters = await vine.validate({
        schema: filterSchema,
        data: req.query
    })

    const users = await User.findAll({
        where: {
            isAmbassador: true
        }
    })
    try {
        const maped = await Promise.all(
            users.map(async (u) => {
                // This one consults the memberships
                const results = await getUserMemBonuses(u.id)
                // This one consults the TST transactions
                const resultsTST = await getUserTSTBonuses(u.id)
                // return res.send(resultsTST)
                const sums = {
                    directM: 0,
                    indirectM: 0,
                    directTST: 0,
                    indirectTST: 0,
                    total: 0,
                    totalTST: 0,
                    totalM: 0
                }
                const counts = {
                    directM: 0,
                    indirectM: 0,
                    directTST: 0,
                    indirectTST: 0
                }
                // return res.send(results)
                results.forEach((e) => {
                    sums.total += Number(e.total)
                    sums.totalM += Number(e.total)
                    if (e.relativeLevel > 1) {
                        counts.indirectM += 1
                        sums.indirectM += Number.parseFloat(e.commission)
                    } else {
                        if (e.relativeLevel === 1) {
                            counts.directM += 1
                        }
                        sums.directM += Number.parseFloat(e.commission)
                    }
                })
                resultsTST.forEach((e) => {
                    sums.total += Number(e.total)
                    sums.totalTST += Number(e.total)
                    if (e.relativeLevel > 1) {
                        counts.indirectTST += 1
                        sums.indirectTST += Number.parseFloat(e.commission)
                    } else {
                        if (e.relativeLevel === 1) {
                            counts.directTST += 1
                        }
                        sums.directTST += Number.parseFloat(e.commission)
                    }
                })
                return { sums, counts }
            })
        )

        const all = maped.reduce((acc, item) => {
            return {
                directM: acc.directM + item.sums.directM,
                indirectM: acc.indirectM + item.sums.indirectM,
                directTST: acc.directTST + item.sums.directTST,
                indirectTST: acc.indirectTST + item.sums.indirectTST,
                directCountM: acc.directCountM + item.counts.directM,
                indirectCountM: acc.indirectCountM + item.counts.indirectM,
                directCountTST: acc.directCountTST + item.counts.directTST,
                indirectCountTST: acc.indirectCountTST + item.counts.indirectTST,
                total: acc.total + item.sums.total,
                totalM: acc.totalM + item.sums.totalM,
                totalTST: acc.totalTST + item.sums.totalTST
            }
        }, {
            directM: 0,
            indirectM: 0,
            directTST: 0,
            indirectTST: 0,
            directCountM: 0,
            indirectCountM: 0,
            directCountTST: 0,
            indirectCountTST: 0,
            total: 0,
            totalM: 0,
            totalTST: 0
        })
        // console.log(results)
        return res.send(all)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

const filterDataBonus = vine.object({
    type: vine.enum(['all', 'memberships', 'tst']).parse((v) => v ?? 'all'),
    level: vine.enum(['all', 'directs', 'indirects']).parse((v) => v ?? 'all'),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})

router.get('/data', async function (req, res, next) {
    try {
        const filters = await vine.validate({
            schema: filterDataBonus,
            data: req.query
        })

        const users = await User.findAll({
            where: {
                isAmbassador: true
            }
        })
        const all = await Promise.all(
            users.map(async (user) => {
                let filtered = []
                // This one consults the Memberships transactions
                if (filters.type === 'all' || filters.type === 'memberships') {
                    const results = await getUserMemBonuses(user.id, 'm.id')
                    filtered = results.filter((t) => t.relativeLevel > 0)
                }
                // This one consults the TST transactions
                if (filters.type === 'all' || filters.type === 'tst') {
                    const tstResults = await getUserTSTBonuses(user.id, 'm.id')
                    const tmpFilterd = tstResults.filter((t) => t.relativeLevel > 0)
                    filtered = filtered.concat(tmpFilterd)
                }

                if (filters.level === 'directs') {
                    filtered = filtered.filter((t) => t.relativeLevel === 1)
                }
                if (filters.level === 'indirects') {
                    filtered = filtered.filter((t) => t.relativeLevel > 1)
                }

                return filtered
            })
        )

        let allResult = []
        all.forEach((e) => {
            if (e.length > 0) { allResult = allResult.concat(e) }
        })

        return res.send(allResult)
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
