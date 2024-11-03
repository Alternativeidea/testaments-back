import { Category } from '../../models/category.js'
import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { myRule, transformEncodedIntegerArray } from '../../schemas/validation.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../utils/httpErrors.js'

const router = express.Router()

const filters = vine.object({
    type: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})

router.get('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: filters,
            data: req.query
        })
        const where = {}
        if (output.type) {
            where.type = output.type
        }
        const categories = await Category.findAll({
            where
        })
        return res.send(categories)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
    }
})

export default router
