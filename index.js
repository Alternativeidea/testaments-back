import express, { json } from 'express'
import serverless from 'serverless-http'
import session from 'express-session'
import passport from 'passport'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from './utils/httpErrors.js'
import router from './routes/auth.js'
// import seedRouter from './routes/seed.js'
import categoriesRouter from './routes/categories/index.js'
import usersRouter from './routes/users/index.js'
import adminRouter from './routes/admin/index.js'
import productsRouter from './routes/products/index.js'
import ordersRouter from './routes/orders/index.js'
import membershipsRouter from './routes/memberships/index.js'
import userMembershipsRouter from './routes/users/memberships/index.js'
import paymentIntentRouter from './routes/users/memberships/payment-intent/index.js'
import stripeRouter from './routes/stripe/index.js'
import testamentsRouter from './routes/testaments/index.js'
import transactionsRouter from './routes/transactions/index.js'
import willsRouter from './routes/wills/index.js'
import newsRouter from './routes/news/index.js'
import ratesRouter from './routes/rates/index.js'
import heirsRouter from './routes/heirs/index.js'
import countriesRouter from './routes/countries/index.js'
import messagesRouter from './routes/messages/index.js'
import bannersRouter from './routes/banners/index.js'
import faqsRouter from './routes/faqs/index.js'
import ambassadorsRouter from './routes/ambassadors/index.js'
import treeRouter from './routes/tree/index.js'
import bonusesRouter from './routes/bonuses/index.js'
import accountsRouter from './routes/accounts/index.js'
import withdrawsRouter from './routes/withdraws/index.js'
import { getConnection } from './config/database.js'
import cors from 'cors'

const app = express()
app.use(cors())
app.use((req, res, next) => {
    if (req.originalUrl.includes('/stripe')) {
        next()
    } else {
        express.json()(req, res, next)
    }
})
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

const prefix = ''
app.use(`${prefix}/auth`, router)
// app.use(`${prefix}/services`, servicesRouter)
app.use(`${prefix}/categories`, categoriesRouter)
// app.use(`${prefix}/newsletters`, newslettersRouter)
app.use(`${prefix}/users`, usersRouter)
app.use(`${prefix}/testaments`, testamentsRouter)
app.use(`${prefix}/memberships`, membershipsRouter)
app.use(`${prefix}/transactions`, transactionsRouter)
app.use(`${prefix}/admin`, adminRouter)
// app.use(`${prefix}/seed`, seedRouter)
app.use(`${prefix}/products`, productsRouter)
app.use(`${prefix}/orders`, ordersRouter)
app.use(`${prefix}/wills`, willsRouter)
app.use(`${prefix}/users/memberships`, userMembershipsRouter)
app.use(`${prefix}/users/memberships/payment-intent`, paymentIntentRouter)
app.use(`${prefix}/stripe`, stripeRouter)
app.use(`${prefix}/news`, newsRouter)
app.use(`${prefix}/rates`, ratesRouter)
app.use(`${prefix}/heirs`, heirsRouter)
app.use(`${prefix}/messages`, messagesRouter)
app.use(`${prefix}/banners`, bannersRouter)
app.use(`${prefix}/countries`, countriesRouter)
app.use(`${prefix}/faqs`, faqsRouter)
app.use(`${prefix}/ambassadors`, ambassadorsRouter)
app.use(`${prefix}/tree`, treeRouter)
app.use(`${prefix}/bonuses`, bonusesRouter)
app.use(`${prefix}/accounts`, accountsRouter)
app.use(`${prefix}/withdraws`, withdrawsRouter)

app.get('/failure-login', (req, res, next) => {
    const response = {
        mensaje: 'Login failure'
    }
    response.sessions = req.session
    response.message = req.session.messages
    next(
        new HttpError(
            httpErrors.BAD_REQUEST.error_code,
            'Password or Username not found',
            {
                ...httpErrors.BAD_REQUEST,
                type: 'Login Error',
                code_: 400
            })
    )
})

const errorHandler = (error, req, res, next) => {
    console.log(error)
    // res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? err : {};
    return res
        .status(error.statusCode ?? 500)
        .json({ ...error, code: error.statusCode, message: error.message })
}

app.use(errorHandler)
await getConnection()

export const handler = serverless(app)
