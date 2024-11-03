import { Country } from '../../models/country.js'
import { transformEncodedStringArray } from '../../schemas/validation.js'
import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { makeValidationError, makeATeaPot } from '../../utils/httpErrors.js'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        let filters = {
            order: [['name']]
        }
        if (output.orderBy && output.orderBy[0][0] === 'phonecode') {
            filters = {
                attributes: ['phonecode'],
                group: ['phonecode'],
                order: output.orderBy
            }
        }
        const countries = await Country.findAll(filters)
        return res.send(countries)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        makeATeaPot(error)
    }
})

export const filterSchema = vine.object({
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional()
})

export default router
