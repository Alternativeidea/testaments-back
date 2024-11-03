/* eslint-disable no-case-declarations */
import express from 'express'
import { User } from '../../models/user.js'
import { Membership } from '../../models/membership.js'
import Stripe from 'stripe'
import { addYear, format } from '@formkit/tempo'
import { issuePremiumInvoice } from '../../services/minimax.js'

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const router = express.Router()

// Test Minimax connection by faking issuing an invoice
router.get('/', async (req, res) => {
    try {
        const testUserId = 272
        const issuedInvoice = await issuePremiumInvoice(testUserId)
        console.log('Issued Invoice:', issuedInvoice)
        res.send(issuedInvoice)
    } catch (error) {
        console.error('Failed Minimax:', error.message)
        res.status(500).send(error.message)
    }
})

const handlePaymentIntentSucceeded = async (paymentIntent) => {
    // Get the customer id from the payment intent
    const customerId = paymentIntent.customer
    // Find the user with the stripeCustomerId
    const user = await User.findOne({
        where: {
            stripeCustomerId: customerId
        }
    })
    // If the user is not found then log the error and return
    if (!user) {
        console.log(`User with stripeCustomerId ${customerId} not found.`)
        return
    }
    // Get the membership object with name Premium from the database
    const premium = await Membership.findOne({
        where: {
            name: 'Premium'
        }
    })
    // Update the user membership to Premium
    user.membershipId = premium.id
    const date = new Date()
    const newYear = addYear(date, 1)
    user.memPurchasedAt = format(date, 'YYYY-MM-DD')
    user.nextRenewal = format(newYear, 'YYYY-MM-DD')

    // Save user membership changes before sending the email
    await user.save()

    // Issue an invoice in Minimax
    try {
        const issuedInvoice = await issuePremiumInvoice(user.id)
        if (issuedInvoice) {
            // Successful invoice issuance
            console.log('Issued Invoice:', issuedInvoice)
            // Add any further logic here (e.g., notify user, update database, etc.)
        } else {
            console.warn('Invoice issuance completed but no invoice data returned.')
        }
    } catch (error) {
        if (error.response) {
            // If the error is from the server-side (API response issue)
            console.error('Minimax API responded with an error:', error.response.data)
        } else if (error.request) {
            // If the request was made but no response was received
            console.error('No response received from Minimax:', error.request)
        } else {
            // Other errors (e.g., coding issues, network problems, etc.)
            console.error('An error occurred during the invoice issuance process:', error.message)
        }
    }

    // Send the premium notice email to the user
    // await sendPremiumNotice(user)
    return true
}

/* Webhook to listen Stripe events */
router.post('/', express.raw({ type: 'application/json' }), async function (req, res, next) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    console.log(process.env.STRIPE_WEBHOOK_SECRET)
    let event = req.body

    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = req.headers['stripe-signature']
        try {
            event = stripe.webhooks.constructEvent(
                event,
                signature,
                endpointSecret
            )
        } catch (err) {
            console.log('Webhook signature verification failed.', err)
            console.log('Webhook signature verification failed.', err.message)
            return res.status(400).send(err)
        }
    }

    // Handle the event
    switch (event.type) {
    case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`)
        // Then define and call a method to handle the successful payment intent.
        await handlePaymentIntentSucceeded(paymentIntent)
        break
    default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`)
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send()
})

export default router
