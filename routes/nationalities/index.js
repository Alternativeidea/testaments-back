import { nationalities } from '../../utils/countries.js'
import express from 'express'

const router = express.Router()

// router.use(isAuth)
router.get('/', async function (req, res, next) {
    return res.send(nationalities)
})

export default router
