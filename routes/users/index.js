import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { contactSChema, updateSchema, verifySchema } from '../../schemas/userSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { getConnection } from '../../config/database.js'
import documentsRouter from './documents/index.js'
import accountsRouter from './accounts/index.js'
import checkPayment from '../../middlewares/checkPayment.js'
import vine, { errors } from '@vinejs/vine'
import { Product } from '../../models/product.js'
import { sendContactEmail } from '../../utils/mails/auth.js'
import { Ticket } from '../../models/ticket.js'
import { Category } from '../../models/category.js'
import { Order } from '../../models/order.js'
import { OrderDetail } from '../../models/orderDetails.js'

const router = express.Router()

router.use(isAuth)
router.use(checkPayment)
router.put('/verify', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: verifySchema,
            data: req.body
        })
        const user = await User.findByPk(req.user.id)
        if (!user) {
            return next(
                makeNotFoundError('User')
            )
        }
        // if (user.isVerified === true) {
        //     return res.status(200).send(user)
        // }
        output.isVerified = User.STATUS_VERIFIED.WAITING
        await user.update(output)
        const result = await User.findByPk(user.id)
        return res.send(result)
    } catch (error) {
        console.log(error)
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

router.put('/', async function(req, res, next) {
    // vine.convertEmptyStringsToNull = true
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
    }

    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.findByPk(req.user.id, { transaction })
        if (!user) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Not Found ID',
                        details: null
                    })
            )
        }
        await user.update(output, { transaction })
        transaction.commit()
        const result = await User.findByPk(user.id)
        return res.send(result)
    } catch (error) {
        transaction.rollback()
        console.log(error)
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Something happend from devs :c',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Something happend from devs :c',
                    details: error
                })
        )
    }
})

router.get('/wishlist', async function(req, res, next) {
    const user = await User.findByPk(req.user.id, {
        include: [
            {
                model: Product,
                as: 'wishlist',
                through: {
                    attributes: []
                },
                include: [
                    {
                        model: Category,
                        as: 'category'
                    }
                ]
            }
        ]
    })

    let orders = await Order.scope('list').findAll({
        where: {
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

    orders = orders.filter((e) => {
        return e.details[0].product !== null
    })
    for (const p of user.wishlist) {
        p.setDataValue('wishlist', true)
        p.setDataValue('interest', false)
        for (const order of orders) {
            if (order.details[0].product.id === p.id) {
                p.setDataValue('interest', true)
                break
            }
        }
    }
    // const products = user.wishlist.map((p) => {
    //     p.setDataValue('wishlist', true)
    //     return p
    // })
    return res.send(user.wishlist)
})

router.post('/contact', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: contactSChema,
            data: req.body
        })
        output.name = req.user.name
        output.userId = req.user.id
        const ticket = await Ticket.create(output)
        await sendContactEmail(req.user, output.subject)
        return res.send(ticket)
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

router.use('/data/documents', documentsRouter)
router.use('/data/accounts', accountsRouter)

export default router
