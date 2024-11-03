import express from 'express'
import { makeATeaPot } from '../../../../utils/httpErrors.js'
import vine from '@vinejs/vine'
import { filterSchema } from '../../../../schemas/withdrawSchema.js'
import { Withdraw } from '../../../../models/withdraw.js'
const router = express.Router({
    mergeParams: true
})

/**
 * Get the user heirs
 */
router.get('/', async function(req, res, next) {
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
            order: output.orderBy
        })
        return res.send(withdraws)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export default router
