import express from 'express'
import { createSchema } from '../../../schemas/heirSchema.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Will } from '../../../models/will.js'
import { Heir } from '../../../models/heir.js'

const router = express.Router({ mergeParams: true })

router.post('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        const will = await Will.findByPk(req.params.id, {
            include: [
                {
                    model: Heir,
                    as: 'heirs'
                }
            ]
        })
        if (!will) {
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
        const shares = will.heirs.reduce((accumulator, item) => {
            return accumulator + parseFloat(item.share)
        }, 0)
        if ((shares + output.share) > 100) {
            return next(
                new HttpError(
                    httpErrors.NOT_ENOUGH_SHARES.error_code,
                    httpErrors.NOT_ENOUGH_SHARES.message,
                    {
                        ...httpErrors.NOT_ENOUGH_SHARES,
                        type: 'Not enough shares on the will',
                        details: null
                    })
            )
        }
        output.willId = will.id
        const heir = await Heir.create(output)
        return res.send(heir)
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
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: { ...error }
                })
        )
    }
})

router.delete('/:heirId', async function(req, res, next) {
    try {
        const will = await Will.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        })
        if (!will) {
            return next(
                new HttpError(
                    httpErrors.FORBIDDEN.error_code,
                    httpErrors.FORBIDDEN.message,
                    {
                        ...httpErrors.FORBIDDEN,
                        type: 'Error unexpected',
                        details: null
                    })
            )
        }
        const heir = await Heir.findOne({
            where: {
                id: req.params.heirId,
                willId: will.id
            }
        })
        if (heir) {
            await heir.destroy()
        }
        return res.status(204).send({})
    } catch (err) {
        console.log(err)
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                httpErrors.SOMETHING_HAPPEND.message,
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Error unexpected',
                    details: err
                })
        )
    }
})

export default router
