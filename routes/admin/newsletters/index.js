import express from 'express'
import { Newsletter } from '../../../models/newsletter.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../../utils/httpErrors.js'
import { adminFilterSchema } from '../../../schemas/userSchema.js'
import vine, { errors } from '@vinejs/vine'

const router = express.Router()

router.get('/', async function(req, res, next) {
    let filters = null
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: adminFilterSchema,
            data: req.query
        })
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
    const users = await Newsletter.findAll({
        limit: filters.limit >= 0 ? filters.limit : 50,
        offset: filters.offset
    })
    return res.send(users)
})

router.delete('/:id', async function(req, res, next) {
    const id = req.params.id
    const newsletter = await Newsletter.findOne({
        where: {
            id
        }
    })
    if (!newsletter) {
        return res.status(204).send({})
    }
    await newsletter.destroy()
    return res.status(204).send({})
})

export default router
