import express from 'express'
import Stripe from 'stripe'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../../../utils/httpErrors.js'
import isAuth from '../../../../middlewares/isAuth.js'
import { Membership } from '../../../../models/membership.js'

const router = express.Router()
router.use(isAuth)

/* Create the payment intent and return the client secret */
router.post('/', async function (req, res, next) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    // Get the membership object with name Premium from the database
    const membership = await Membership.findOne({
        where: {
            name: 'Premium'
        }
    })

    // Check if the user has a premium membership
    if (req.user.membershipId === membership.id) {
        return next(
            new HttpError(
                httpErrors.BAD_REQUEST.error_code,
                httpErrors.BAD_REQUEST.message,
                {
                    ...httpErrors.BAD_REQUEST,
                    type: 'Error unexpected',
                    details: 'User already has a premium membership'
                }
            )
        )
    }

    // Check if the user is already a Stripe customer
    if (!req.user.stripeCustomerId) {
        // If not then create a new Stripe customer and save the customer id to the user
        const customer = await stripe.customers.create({
            email: req.user.email
        })
        req.user.stripeCustomerId = customer.id
        await req.user.save()
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: membership.price * 100,
        currency: membership.currency.toLowerCase(),
        customer: req.user.stripeCustomerId
    })

    // Return the payment intent as a json object
    return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        membershipId: membership.id
    })
})

export default router
