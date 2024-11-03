import express from 'express'
import { filterSchema, createSchema, updateSchema, patchSchema } from '../../../schemas/faqSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Faq } from '../../../models/faq.js'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
        }
        if (output.section) {
            where.section = output.section
        }
        const faq = await Faq.findAll({
            where
        })
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

router.get('/:id', async function(req, res, next) {
    try {
        const faq = await Faq.findByPk(req.params.id)
        if (!faq) {
            return next(
                makeNotFoundError('faq')
            )
        }
        return res.send(faq)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.post('/', async function(req, res, next) {
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }

    try {
        const faq = await Faq.create(output)
        return res.send(faq)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.put('/:id', async function(req, res, next) {
    const id = req.params.id
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }
    try {
        const faq = await Faq.findByPk(id)

        if (!faq) {
            return next(
                makeNotFoundError('faq')
            )
        }
        await faq.update(output)
        return res.send(faq)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.patch('/:id', async function(req, res, next) {
    const id = req.params.id
    let output = null
    try {
        output = await vine.validate({
            schema: patchSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }
    try {
        const faq = await Faq.findByPk(id)

        if (!faq) {
            return next(
                makeNotFoundError('faq')
            )
        }
        await faq.update(output)
        return res.send(faq)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        const faq = await Faq.findByPk(req.params.id)
        if (!faq) {
            return res.send({ deleted: true })
        }
        await faq.destroy()
        return res.send({ deleted: true })
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

export default router
