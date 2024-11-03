import express from 'express'
import { Document } from '../../../models/document.js'
import { makeATeaPot, makeValidationError } from '../../../utils/httpErrors.js'
import { filterSchema } from '../../../schemas/documentSchema.js'
import vine, { errors } from '@vinejs/vine'

const router = express.Router()
router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const documents = await Document.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where: {
                userId: req.user.id
            }
        })
        return res.send(documents)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        makeATeaPot(error)
    }
})

export default router
