import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'
import { filterSchema } from '../../schemas/messageSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { Message } from '../../models/message.js'

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const messages = await Message.findAll({
            where: {
                section: output.section
            }
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
        const message = await Message.findOne({
            where: {
                section: req.params.id
            }
        })
        if (!message) {
            return next(
                makeNotFoundError('Message')
            )
        }
        return res.send(message)
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
