import express from 'express'
import { Post } from '../../models/post.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeValidationError } from '../../utils/httpErrors.js'
import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from '../../schemas/validation.js'
import { Category } from '../../models/category.js'
import isAuth from '../../middlewares/isAuth.js'
import vine, { errors } from '@vinejs/vine'

const vineSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    byCategory: vine.boolean().parse(v => v ?? false),
    isFeatured: vine.boolean().parse(v => v ?? false),
    search: vine.string().optional().nullable(),
    categories: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional()
})

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    let filters = null
    vine.convertEmptyStringsToNull = true
    try {
        filters = await vine.validate({
            schema: vineSchema,
            data: req.query
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        makeATeaPot(error)
    }
    // const filters = filterSchema.validate(req.query).value
    const where = {
        status: Post.STATUS.ACTIVE
    }
    const whereCategory = {
        type: Category.TYPES.PRODUCT
    }
    if (filters.categories) {
        where.categoryId = filters.categories
    }
    if (filters.categories && filters.byCategory) {
        whereCategory.id = filters.categories
    }
    where.isFeatured = filters.isFeatured
    let posts = []
    if (filters.byCategory) {
        posts = await Category.scope('list').findAll({
            limit: filters.limit >= 0 ? filters.limit : 50,
            offset: filters.offset,
            where: whereCategory,
            include: [{
                model: Post,
                as: 'posts',
                where: {
                    status: Post.STATUS.ACTIVE
                },
                required: false
            }],
            order: filters.orderBy
        })
    } else {
        posts = await Post.scope('list').findAll({
            limit: filters.limit >= 0 ? filters.limit : 50,
            offset: filters.offset,
            where,
            subQuery: false,
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ],
            order: filters.orderBy
        })
    }

    return res.send(posts)
})

router.get('/:id', async function (req, res, next) {
    const id = req.params.id

    const post = await Post.findByPk(id, {
        where: {
            status: Post.STATUS.ACTIVE
        },
        include: {
            model: Category,
            as: 'category'
        }
    })
    if (!post) {
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

    return res.send(post)
})

export default router
