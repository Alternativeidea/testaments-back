import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { makeATeaPot, makeValidationError } from '../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { createSchema, updateSchema } from '../../schemas/accountSchema.js'
import { Account } from '../../models/account.js'

const router = express.Router()
router.use(isAuth)

router.get('/', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        return res.send(await user.getAccounts())
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/:id', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        const account = await user.getAccounts({ where: { id: req.params.id } })
        return res.send(account[0])
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.post('/', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        const account = await Account.create({ ...output, userId: user.id })
        return res.send(account)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(makeATeaPot(error))
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const account = await Account.findByPk(req.params.id)
        account.set(output)
        await account.save()
        return res.send(account)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(makeATeaPot(error))
    }
})

router.delete('/:id', async function (req, res, next) {
    try {
        const account = await Account.findByPk(req.params.id)
        await account.destroy()
        return res.send(account)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export default router
