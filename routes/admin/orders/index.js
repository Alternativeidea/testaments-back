import express from 'express'
import { User } from '../../../models/user.js'
import { Order } from '../../../models/order.js'
import { filterSchema, updateSchema } from '../../../schemas/orderSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { OrderDetail } from '../../../models/orderDetails.js'
import { Product } from '../../../models/product.js'
// import { sendTransactional } from '../../../utils/transactionalAccepted.js'
import vine, { errors } from '@vinejs/vine'
import { Category } from '../../../models/category.js'
import { addDay } from '@formkit/tempo'
import { Op } from 'sequelize'
import { orderInterestFnishEmail } from '../../../utils/mails/orders.js'

const router = express.Router()

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const filters = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {}
        if (filters.status) {
            where.status = filters.status
        }
        if (filters.startAt && filters.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: addDay(filters.startAt, -1),
                    [Op.lte]: addDay(filters.endAt, 1)
                }
            }
        }
        let orders = await Order.findAll({
            limit: filters.limit >= 0 ? filters.limit : 50,
            offset: filters.offset,
            where,
            include: [
                {
                    model: User.scope('mini'),
                    as: 'user',
                    where: {
                        roleId: 1
                    }
                },
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
            ],
            order: filters.orderBy
        })
        orders = orders.filter((e) => {
            return e.details[0].product !== null
        })
        return res.send(orders)
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
    const order = await Order.findByPk(req.params.id, {
        include: [
            {
                model: User.scope('mini'),
                as: 'user'
            },
            {
                model: OrderDetail,
                as: 'details',
                include: [
                    {
                        model: Product,
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
                httpErrors.NOT_FOUND.message,
                {
                    ...httpErrors.NOT_FOUND,
                    type: 'Error unexpected',
                    details: null
                })
        )
    }
    return res.send(order)
})

router.put('/:id', async function(req, res, next) {
    let output = null
    try {
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
        return next(
            makeATeaPot(error)
        )
    }
    const order = await Order.findByPk(req.params.id, {
        include: [
            {
                model: User.scope('mini'),
                as: 'user'
            },
            {
                model: OrderDetail,
                as: 'details',
                include: [
                    {
                        model: Product,
                        as: 'product'
                    }
                ]
            }
        ]
    })

    if (!order) {
        return next(
            makeNotFoundError('Order')
        )
    }
    // console.log(order.user.name)
    // console.log(order.details[0].product.name)
    // return res.send(order)
    order.set({
        status: output.status
    })
    await order.save()
    await orderInterestFnishEmail(order.user, order.details[0].product.name)
    return res.send(order)
})

export default router
