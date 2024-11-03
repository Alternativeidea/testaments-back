import express from 'express'
import { Membership } from '../../models/membership.js'
import vine, { errors } from '@vinejs/vine'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../utils/httpErrors.js'
// import isAuth from '../../middlewares/isAuth.js';

const router = express.Router()
// router.use(isAuth)

/* GET membership listing all of them */
router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const memberships = await Membership.scope('list').findAll({
            where: {
                status: 1
            }
        })
        return res.send(memberships)
    } catch (error) {
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: error
                })
        )
    }
})

/* GET specific membership */
router.get('/:id', async function(req, res, next) {
    try {
        const membership = await Membership.findByPk(req.params.id)
        if (!membership) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Error unexpected',
                        details: null
                    })
            )
        }
        return res.send(membership)
    } catch (error) {
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: error
                }
            )
        )
    }
})

export default router
