import express from 'express'
import vine, { errors } from '@vinejs/vine'
import isAuth from '../../../middlewares/isAuth.js'
import { makeATeaPot } from '../../../utils/httpErrors.js'
import { User } from '../../../models/user.js'

const router = express.Router()
router.use(isAuth)

/* GET current membership of this user */
router.get('/', async function (req, res, next) {
    try {
        const userMembership = await req.user.getMembership()
        return res.send(userMembership)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

/* PUT update the membership of the specific user */
router.put('/pay-later', async function (req, res, next) {
    try {
        const user = await User.findByPk(req.user.id)
        user.payLater = new Date()
        await user.save()
        return res.send({ payLater: true })
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

export default router
