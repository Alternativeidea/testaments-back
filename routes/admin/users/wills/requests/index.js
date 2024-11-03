import { Will } from '../../../../../models/will.js'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../../../../utils/httpErrors.js'
import { HttpError } from 'http-errors-enhanced'
import express from 'express'
import { filterSchema } from '../../../../../schemas/willSchema.js'
import vine, { errors } from '@vinejs/vine'
import { Request } from '../../../../../models/request.js'
import { getConnection } from '../../../../../config/database.js'
import { createAppointmentSchema, updateStatusSchema } from '../../../../../schemas/requestSchema.js'
import { sendAppointmentEmail, sendDeletedWillEmail, sendEditedWillEmail, sendNewWillEmail } from '../../../../../utils/mails/wills.js'
import { User } from '../../../../../models/user.js'
import { Category } from '../../../../../models/category.js'
import { Heir } from '../../../../../models/heir.js'

const router = express.Router({ mergeParams: true })

/**
 * This method allows the admin user to get an
 * user requests for Wills
 * @request /:id as the userId and /:willId as willId
 * @response
 */
router.patch('/:requestId', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: updateStatusSchema,
            data: req.body
        })
        const requesting = await Request.findOne({
            where: {
                userId: req.params.id,
                id: req.params.requestId
            },
            include: [
                {
                    model: Will.scope('mini'),
                    as: 'will'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        }, { transaction })
        if (!requesting) {
            return next(
                makeNotFoundError('Request')
            )
        }
        if (requesting.status === Request.STATUS.IN_PROCESS) {
            let newHistoryItem = {}
            let status = Will.STATUS.ACTIVE
            let requestingStatus = Request.STATUS.ACCEPT
            if (output.status === Request.STATUS.ACCEPT) {
                newHistoryItem = { action: 'Update Accept', date: new Date(), admin: req.user.id }
            } else {
                newHistoryItem = { action: 'Update Cancel', date: new Date(), admin: req.user.id }
                status = Will.STATUS.ON_HOLD
                requestingStatus = Request.STATUS.CANCELLED
            }
            const will = await Will.findByPk(requesting.will.id)
            will.set({
                status
            }, { transaction })
            requesting.set({
                status: requestingStatus,
                history: [...requesting.history, newHistoryItem]
            }, { transaction })
            await will.save({ transaction })
            await requesting.save({ transaction })
            await transaction.commit()
            if (output.status === Request.STATUS.ACCEPT) {
                if (requesting.action === Request.ACTIONS.ADD) {
                    await sendNewWillEmail(requesting.user)
                } else if (requesting.action === Request.ACTIONS.EDIT) {
                    await sendEditedWillEmail(requesting.user)
                } else if (requesting.action === Request.ACTIONS.DELETE) {
                    await sendDeletedWillEmail(requesting.user)
                }
            }
            return res.send(requesting)
        }
        return next(
            new HttpError(
                httpErrors.ALREADY_REPORTED.error_code,
                httpErrors.ALREADY_REPORTED.message,
                {
                    ...httpErrors.ALREADY_REPORTED,
                    type: 'This Request Has Already Been Closed ',
                    details: null
                })
        )
    } catch (error) {
        await transaction.rollback()
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

router.put('/:requestId', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: createAppointmentSchema,
            data: req.body
        })
        const request = await Request.findOne({
            where: {
                userId: req.params.id,
                id: req.params.requestId
            },
            include: [
                {
                    model: Will.scope('mini'),
                    as: 'will'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                }
            ]
        }, { transaction })
        if (!request) {
            return next(
                makeNotFoundError(`Request ${req.params.requestId}`)
            )
        }
        output.status = Request.STATUS.ON_DATE
        request.set(output, { transaction })
        await sendAppointmentEmail(req.user, request)
        await request.save({ transaction })
        await transaction.commit()
        return res.send(request)
    } catch (error) {
        await transaction.rollback()
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
/**
 * This method allows the admin user to get an
 * user requests for Wills
 * @request /:id as the userId and /:willId as willId
 * @response
 */
router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.params.id
        }
        if (output.status) {
            where.status = output.status
        }
        const wills = await Request.findAll({
            where,
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            order: [['id', 'DESC']],
            include: [
                {
                    model: Will,
                    as: 'will',
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'name']
                        },
                        {
                            model: Heir.scope('mini'),
                            as: 'heirs'
                        }
                    ]
                }
            ]
        })
        wills.forEach(element => {
            element.setDataValue('updatedAt', new Date())

            element.will.heirs.forEach((h) => {
                h.setDataValue('share', h.HeirWill.share)
                h.setDataValue('constrains', h.HeirWill.constrains)
                h.setDataValue('HeirWill')
            })
        })
        return res.send(wills)
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
                'Verification',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }
})

export default router
