import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { makeATeaPot } from '../../utils/httpErrors.js'
import dataRouter from './data.js'
import { getUserTSTBonuses, getUserMemBonuses } from './calcs/index.js'
const router = express.Router()
router.use(isAuth)

/****
* GET USER BONUSES OF TST
* grouped in the next style
*  sums, counts and traffics
* FRONT export const getBonuses = () => apiInstance.get('/bonuses')
****/
router.get('/', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
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

router.use('/data', dataRouter)

/****
* GET USER BONUSES OF MEMBERSHIPS
* grouped in the next style
*  sums, counts and traffics
* FRONT
* export const getMembershipBonuses = () => apiInstance.get('/bonuses/memberships')
****/
router.get('/memberships', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
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

/**
 * FRONT
 *  export const getMembershipBonusesById = (id: number) => apiInstance.get(`/bonuses/memberships/${id}`)
 */
router.get('/memberships/:userId', async function (req, res, next) {
    const user = await User.findByPk(req.params.userId)
    try {
        // This one consults the TST transactions
        const results = await getUserMemBonuses(user.id)

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
        results.forEach((e) => {
            if (e.relativeLevel > 1) {
                counts.indirect += 1
                traffic.indirect += e.total
                sums.indirect += Number.parseFloat(e.commission)
            } else {
                if (e.relativeLevel === 1) {
                    counts.direct += 1
                    traffic.direct += e.total
                }
                sums.direct += Number.parseFloat(e.commission)
            }
        })
        return res.send({ sums, counts, traffic })
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

/**
 * FRONT:
 * export const getBonusesById = (id: number) => apiInstance.get(`/bonuses/${id}`)
 */
router.get('/:userId', async function (req, res, next) {
    try {
        const user = await User.findByPk(req.params.userId)
        // This one consults the TST transactions
        const results = await getUserTSTBonuses(user.id)

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
        results.forEach((e) => {
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

export default router
