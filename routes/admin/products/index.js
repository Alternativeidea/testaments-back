import express from 'express'
import { Product } from '../../../models/product.js'
import { createSchema, filterSchema, updateSchema } from '../../../schemas/productSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Category } from '../../../models/category.js'
import vine, { errors } from '@vinejs/vine'
import { characteristics as cf } from '../../../utils/products.js'

const router = express.Router()

router.post('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        const product = await Product.create(output)
        const result = await Product.findByPk(product.id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        return res.send(result)
    } catch (error) {
        console.log(error)
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
        return next(
            makeATeaPot(error)
        )
    }
})

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            status: Product.STATUS.ACTIVE
        }
        if (output.status) {
            where.status = output.status
        }
        const posts = await Product.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where,
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ],
            order: output.orderBy
        })
        const results = posts.map((i) => {
            i.setDataValue('createdAt', formatDate(i.createdAt))
            i.setDataValue('categoryName', i.category.name)
            return i
        })

        return res.send(results)
    } catch (error) {
        console.log(error)
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
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: error
                })
        )
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        if (!product) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Error unexpected',
                        details: null
                    })
            )
        }
        return res.send(product)
    } catch (err) {
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: err
                })
        )
    }
})

router.put('/:id', async function(req, res, next) {
    const id = req.params.id
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const product = await Product.findByPk(id)
        if (!product) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Error',
                        details: null
                    })
            )
        }
        await product.update(output)
        return res.send(product)
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
        return next(
            makeATeaPot(error)
        )
    }
})

export const patchSchema = vine.object({
    isFeatured: vine.boolean()
})

router.patch('/:id', async function(req, res, next) {
    const id = req.params.id
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: patchSchema,
            data: req.body
        })
        const product = await Product.findByPk(id)
        if (!product) {
            return next(
                makeNotFoundError('Product')
            )
        }
        await product.update(output)
        return res.send(product)
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

router.delete('/:id', async function(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id)
        if (!product) {
            return res.s.send({ deleted: true })
        }
        await product.destroy()
        return res.send({ deleted: true })
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

export function formatDate(date) {
    if (typeof date === 'string') {
        if (date.includes('T')) {
            date = new Date(date)
        } else {
            date = new Date(date + 'T00:00:00Z')
        }
    }

    const months = [
        'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
        'jul', 'avg', 'sep', 'okt', 'nov', 'dec'
    ]

    const day = date.getUTCDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day}. ${month} ${year}`
}

export default router
