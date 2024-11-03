import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'
import { filterSchema } from '../../schemas/bannerSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { Banner } from '../../models/banner.js'

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const banners = await Banner.findAll({
            where: {
                section: output.section,
                active: true
            }
        })
        return res.send(banners)
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
        const banner = await Banner.findOne({
            where: {
                section: req.params.id
            }
        })
        if (!banner) {
            return next(makeNotFoundError('Banner'))
        }
        return res.send(banner)
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

export default router
