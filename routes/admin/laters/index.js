import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { filterLatersSchema } from '../../../schemas/userSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { User } from '../../../models/user.js'
import { Op } from 'sequelize'
import { addDay, addYear } from '@formkit/tempo'

const router = express.Router()
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterLatersSchema,
            data: req.query
        })
        const where = {
            roleId: 1
        }
        // make this one filter payLater
        if (output.payLater) {
            where.payLater = { [Op.not]: null }
        }
        if (output.status) {
            where.membershipId = output.status
        }
        if (output.payLater && output.startAt && output.endAt) {
            where.payLater = {
                [Op.and]: {
                    [Op.gte]: addDay(output.startAt, -1),
                    [Op.lte]: addDay(output.endAt)
                }
            }
        }
        // So endpoint can return pay laters as already payed ones
        const users = await User.findAll({
            attributes: ['id', 'name', 'lastName', 'email', 'membershipId', 'payLater', 'updatedAt', 'memPurchasedAt', 'nextRenewal'],
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            order: output.orderBy,
            where
        })
        return res.send(users)
    } catch (error) {
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

router.get('/:id', async function (req, res, next) {
    try {
        const user = await User.findOne({
            where: {
                id: req.params.id,
                payLater: { [Op.not]: null }
            }
        })
        if (!user) {
            return next(
                makeNotFoundError('user')
            )
        }
        return res.send(user)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const user = await User.findOne({
            where: {
                id: req.params.id,
                payLater: { [Op.not]: null }
            }
        })
        if (!user) {
            return next(
                makeNotFoundError('user')
            )
        }
        user.membershipId = 2
        user.memPurchasedAt = new Date()
        user.nextRenewal = addYear(new Date(), 1)
        await user.save()
        return res.send(user)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

export default router
