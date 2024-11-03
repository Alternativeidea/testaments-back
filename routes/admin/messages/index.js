import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { filterSchema, updateSchema } from '../../../schemas/messageSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Message } from '../../../models/message.js'

const router = express.Router()
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
        const message = await Message.findByPk(req.params.id)
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

router.put('/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const message = await Message.findByPk(req.params.id)
        if (!message) {
            return next(
                makeNotFoundError('Message')
            )
        }
        await message.update(output)
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
