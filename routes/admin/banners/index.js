import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { filterSchema, updateSchema } from '../../../schemas/bannerSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Banner } from '../../../models/banner.js'

const router = express.Router()
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            section: Banner.SECTION.DASHBOARD
        }
        if (output.section) {
            where.section = output.section
        }
        const messages = await Banner.findAll({
            where
        })
        return res.send(messages)
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
        const banner = await Banner.findByPk(req.params.id)
        if (!banner) {
            return next(
                makeNotFoundError('banner')
            )
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

router.put('/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const banner = await Banner.findByPk(req.params.id)
        if (!banner) {
            return next(
                makeNotFoundError('banner')
            )
        }
        await banner.update(output)
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
