import express from 'express'
import userRouter from './users/index.js'
import productRouter from './products/index.js'
import orderRouter from './orders/index.js'
import isAuth from '../../middlewares/isAuth.js'
import isAdmin from '../../middlewares/isAdmin.js'
import postRouter from './posts/index.js'
import transactionRouter from './transactions/index.js'
import ambassadorRouter from './ambassadors/index.js'
import newsletterRouter from './newsletters/index.js'
import ticketRouter from './tickets/index.js'
import messagesRouter from './messages/index.js'
import bannersRouter from './banners/index.js'
import testamentsRouter from './testaments/index.js'
import ratesRouter from './rates/index.js'
import latersRouter from './laters/index.js'
import faqsRouter from './faqs/index.js'
import requestsRouter from './requests/index.js'
import willsRouter from './wills/index.js'
import withdrawsRouter from './withdraws/index.js'
import bonusesRouter from './bonuses/index.js'
import bonusesRatesRouter from './bonusesRates/index.js'
import treesRouter from './trees/index.js'

const router = express.Router()
router.use(isAuth)
router.use(isAdmin)

router.use('/users', userRouter)
router.use('/products', productRouter)
router.use('/orders', orderRouter)
router.use('/posts', postRouter)
router.use('/transactions', transactionRouter)
router.use('/ambassadors', ambassadorRouter)
router.use('/newsletters', newsletterRouter)
router.use('/tickets', ticketRouter)
router.use('/messages', messagesRouter)
router.use('/banners', bannersRouter)
router.use('/testaments', testamentsRouter)
router.use('/rates', ratesRouter)
router.use('/laters', latersRouter)
router.use('/faqs', faqsRouter)
router.use('/requests', requestsRouter)
router.use('/wills', willsRouter)
router.use('/withdraws', withdrawsRouter)
router.use('/bonuses', bonusesRouter)
router.use('/bonuses-rates', bonusesRatesRouter)
router.use('/trees', treesRouter)

export default router
