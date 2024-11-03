import express from 'express'
import { filterSchema, createSchema, updateSchema, patchSchema } from '../../../schemas/postSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Post } from '../../../models/post.js'
import vine, { errors } from '@vinejs/vine'
import { Category } from '../../../models/category.js'

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
        if (output.status) {
            where.status = output.status
        }
        const posts = await Post.findAll({
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
            i.setDataValue('publishedAt', formatDate(i.publishedAt))
            i.setDataValue('categoryName', i.category.name)
            return i
        })
        return res.send(results)
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
        const post = await Post.findByPk(req.params.id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        if (!post) {
            return next(
                makeNotFoundError('Post')
            )
        }
        return res.send(post)
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
        output.userId = req.user.id
        const post = await Post.create(output)
        const result = await Post.findByPk(post.id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        return res.send(result)
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
        const post = await Post.findByPk(id)

        if (!post) {
            return next(
                makeNotFoundError('Post')
            )
        }
        await post.update(output)
        const result = await Post.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        return res.send(result)
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
        const post = await Post.findByPk(id)

        if (!post) {
            return next(
                makeNotFoundError('Post')
            )
        }
        await post.update(output)
        const result = await Post.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        return res.send(result)
    } catch (err) {
        return next(
            makeATeaPot(err)
        )
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        const post = await Post.findByPk(req.params.id)
        if (!post) {
            return res.send({ deleted: true })
        }
        await post.destroy()
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
