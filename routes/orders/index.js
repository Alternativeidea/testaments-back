import { Order } from '../../models/order.js'
import isAuth from '../../middlewares/isAuth.js'
import { createSchema, filterSchema } from '../../schemas/orderSchema.js'
import { getConnection } from '../../config/database.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../utils/httpErrors.js'

import express from 'express'
import { Product } from '../../models/product.js'
import { User } from '../../models/user.js'
import { OrderDetail } from '../../models/orderDetails.js'
// import { sendTransactionalMail } from '../../utils/transactional.js'
import vine, { errors } from '@vinejs/vine'
import { orderInterestEmail } from '../../utils/mails/orders.js'
import { Category } from '../../models/category.js'

const router = express.Router()

router.use(isAuth)
router.post('/', async function (req, res, next) {
    const body = req.body
    let output = null
    try {
        output = await vine.validate({
            schema: createSchema,
            data: body
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
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const check = await Order.findAll({
            where: {
                userId: req.user.id
            },
            include: [
                {
                    model: OrderDetail,
                    as: 'details',
                    where: {
                        productId: output.products[0].id
                    }
                }
            ]
        })
        if (check.length > 0) {
            return res.send(check)
        }
        // calculate the total
        const products = []
        const productsFull = []
        let total = 0
        const history = [{
            event: 'Order Placed',
            date: new Date(),
            order: 0
        }]
        const order = await Order.create({
            total,
            userId: req.user.id,
            history
        }, { transaction })
        for (const element of output.products) {
            const product = await Product.findByPk(element.id)
            if (product) {
                total += (product.price * element.quantity)
                products.push(await OrderDetail.create({
                    orderId: order.id,
                    productId: product.id,
                    quantity: element.quantity,
                    unitPrice: product.price,
                    subtotal: (product.price * element.quantity)
                }, { transaction }))
                product.setDataValue('quantity', element.quantity)
                product.setDataValue('subtotal', (product.price * element.quantity))
                productsFull.push(product)
            }
            // TODO: return error on no product found
        }
        order.total =
         total
        await order.save({ transaction })
        await orderInterestEmail(req.user, productsFull[0])
        await transaction.commit()
        order.setDataValue('details', products)
        return res.send(order)
    } catch (err) {
        await transaction.rollback()
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Something happend from devs :c',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Something happend from devs :c',
                    details: err
                })
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
            userId: req.user.id
        }
        if (output.status) {
            where.status = output.status
        }
        let orders = await Order.scope('list').findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where,
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
        const products = []
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
        wishlist = wishlist.wishlist
        for (const order of orders) {
            order.details[0].product.setDataValue('wishlist', false)
            order.details[0].product.setDataValue('interest', true)
            for (const w of wishlist) {
                if (order.details[0].product.id === w.id) {
                    order.details[0].product.setDataValue('wishlist', true)
                    break
                }
            }
            products.push(order.details[0].product)
        }

        return res.send(products)
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
})

router.get('/:id', async function(req, res, next) {
    const order = await Order.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id
        },
        include: [
            {
                model: OrderDetail,
                as: 'details',
                include: [
                    {
                        model: Product.scope('mini'),
                        as: 'product'
                    }
                ]
            }
        ]
    })
    if (!order) {
        return next(
            new HttpError(
                httpErrors.NOT_FOUND.error_code,
                'NOT FOUND',
                {
                    ...httpErrors.NOT_FOUND,
                    type: 'NOT FOUND',
                    details: null
                })
        )
    }
    return res.send(order)
})

export default router
