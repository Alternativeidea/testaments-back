import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { makeATeaPot } from '../../utils/httpErrors.js'
import { addYear } from '@formkit/tempo'
import { sendPremiumNotice } from '../../utils/mails/transactions.js'

const router = express.Router()
router.use(isAuth)

router.post('/', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        user.isAmbassador = true
        user.agreeAmbassador = new Date()
        await user.save()
    } catch (error) {
        return next(makeATeaPot(error))
    }

    return res.send(user)
})

router.post('/:id', async function (req, res, next) {
    const user = await User.findByPk(req.params.id)
    try {
        user.isAmbassador = !user.isAmbassador
        await user.save()
    } catch (error) {
        return next(makeATeaPot(error))
    }

    return res.send(user)
})

router.put('/:id', async function (req, res, next) {
    const user = await User.findByPk(req.params.id)
    try {
        user.payLater = new Date()
        user.memPurchasedAt = new Date()
        user.nextRenewal = addYear(new Date(), 1)
        user.membershipId = 2
        await sendPremiumNotice(user, '')
        await user.save()
    } catch (error) {
        return next(makeATeaPot(error))
    }

    return res.send(user)
})

export default router
