import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'
import { filterSchema } from '../../schemas/faqSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { Faq } from '../../models/faq.js'

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const faqs = await Faq.findAll({
            where: {
                section: output.section
            }
        })
        return res.send(faqs)
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
        const faq = await Faq.findAll({
            where: {
                section: req.params.id
            }
        })
        if (!faq) {
            return next(
                makeNotFoundError('FAQ')
            )
        }
        return res.send(faq)
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
