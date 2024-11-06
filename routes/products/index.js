import express from 'express'
import { Product } from '../../models/product.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../utils/httpErrors.js'
import { encodedIntegerArray } from '../../schemas/validation.js'
import Joi from 'joi'
import { Category } from '../../models/category.js'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { Order } from '../../models/order.js'
import { OrderDetail } from '../../models/orderDetails.js'
import { Sequelize, Op } from 'sequelize'

const filterSchema = Joi.object({
    offset: Joi.number().min(0).optional().default(0),
    limit: Joi.number().min(-1).optional().default(50),
    isFeatured: Joi.boolean().default(false),
    byCategory: Joi.boolean().default(false),
    search: Joi.string().optional(),
    categories: encodedIntegerArray.optional()
})

const router = express.Router()
router.use(isAuth)
router.get('/', async function (req, res, next) {
    const filters = filterSchema.validate(req.query).value
    const where = {
        status: Product.STATUS.ACTIVE
    }
    const whereCategory = {
        type: Category.TYPES.PRODUCT
    }
    if (filters.categories) {
        where.categoryId = filters.categories
    }
    if (filters.isFeatured) {
        where.isFeatured = true
    }
    if (filters.search) {
        where.name = {
            [Op.like]: `%${filters.search}%`
        }
    }
    if (filters.categories && filters.byCategory) {
        whereCategory.id = filters.categories
    }
    let products = []

    let wishlist = await User.findByPk(req.user.id, {
        include: [
            {
                model: Product.scope('mini'),
                as: 'wishlist',
                through: {
                    attributes: []
                }
            }
        ]
    })
    // return res.send(wishlist)
    // This one is just dangerous
    let orders = await Order.scope('list').findAll({
        where: {
            userId: req.user.id,
            status: Order.STATUS.PENDING
        },
        include: [
            {
                model: OrderDetail,
                as: 'details',
                include: [
                    {
                        model: Product,
                        as: 'product',
                        include: [
                            {
                                model: Category,
                                as: 'category'
                            }
                        ]
                    }
                ]
            }
        ]
    })
    orders = orders.filter((e) => {
        return e.details[0].product !== null
    })
    // return res.send(orders)
    wishlist = wishlist.wishlist
    if (filters.byCategory) {
        console.log('im in here')
        products = await Category.scope('list').findAll({
            limit: filters.limit >= 0 ? filters.limit : 50,
            offset: filters.offset,
            where: whereCategory,
            include: [{
                model: Product.scope('public'),
                as: 'products',
                where: {
                    status: Product.STATUS.ACTIVE
                },
                required: false
            }]
        })
        for (const cat of products) {
            for (const p of cat.products) {
                p.setDataValue('wishlist', false)
                p.setDataValue('interest', false)
                for (const order of orders) {
                    if (order.details[0].product.id === p.id) {
                        p.setDataValue('interest', true)
                    }
                }
                for (const w of wishlist) {
                    if (p.id === w.id) {
                        p.setDataValue('wishlist', true)
                        break
                    }
                }
            }
        }
    } else {
        console.log('or in here')
        products = await Product.scope('public').findAll({
            limit: filters.limit >= 0 ? filters.limit : 50,
            offset: filters.offset,
            where,
            subQuery: false,
            include: [
                {
                    model: Category,
                    as: 'category'
                }
            ]
        })
        for (const p of products) {
            p.setDataValue('wishlist', false)
            p.setDataValue('interest', false)
            for (const order of orders) {
                if (order.details[0].product.id === p.id) {
                    p.setDataValue('interest', true)
                }
            }
            for (const w of wishlist) {
                if (p.id === w.id) {
                    p.setDataValue('wishlist', true)
                    continue
                }
            }
        }
    }
    return res.send(products)
})

router.get('/:id', async function (req, res, next) {
    const id = req.params.id

    const product = await Product.scope('public').findByPk(id, {
        where: {
            status: Product.STATUS.ACTIVE
        },
        include: {
            model: Category,
            as: 'category'
        }
    })
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

    return res.send(product)
})

router.post('/:id/wishlist', async function (req, res, next) {
    const id = req.params.id

    const product = await Product.scope('public').findByPk(id, {
        where: {
            status: Product.STATUS.ACTIVE
        },
        include: {
            model: Category,
            as: 'category'
        }
    })
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

    const user = await User.findByPk(req.user.id, {
        include: [
            {
                model: Product,
                as: 'wishlist',
                where: {
                    id
                }
            }
        ]
    })
    let added = product.id
    if (user) {
        await product.removeUser(user.id)
        added = -1
    } else {
        await product.addUser(req.user.id)
    }
    return res.send({ result: added })

    // return res.send(product)
})

export default router
