import express from 'express'
import { User } from '../../../models/user.js'
import { httpErrors } from '../../../utils/httpErrors.js'
import { HttpError } from 'http-errors-enhanced'
import vine, { errors } from '@vinejs/vine'
import { Account } from '../../../models/account.js'

export const createSchema = vine.object({
    number: vine.string(),
    description: vine.string(),
    isDefault: vine.boolean().parse((v) => v ?? true)
})

const router = express.Router()
router.get('/', async function(req, res, next) {
    const user = await User.findByPk(req.user.id)
    const accounts = await user.getAccounts()
    return res.send(accounts)
})

router.post('/', async function(req, res, next) {
    let output = null
    try {
        output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.user.id
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

    // Check if the document its already created
    const check = await Account.findOne({
        where: {
            number: output.number,
            userId: req.user.id
        }
    })

    if (check) {
        return next(
            new HttpError(
                httpErrors.ALREADY_REPORTED.error_code,
                httpErrors.ALREADY_REPORTED.message,
                {
                    ...httpErrors.ALREADY_REPORTED,
                    type: 'ALREADY_REPORTED',
                    details: null
                })
        )
    }
    const account = await Account.create(output)
    return res.send(account)
})

export default router
