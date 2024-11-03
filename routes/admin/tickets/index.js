import express from 'express'
import { Ticket } from '../../../models/ticket.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../../../utils/httpErrors.js'
import { filterSchema, updateSchema } from '../../../schemas/ticketSchema.js'
import vine, { errors } from '@vinejs/vine'
import { User } from '../../../models/user.js'
import { Op } from 'sequelize'
import { addDay } from '@formkit/tempo'

const router = express.Router()

router.get('/', async function(req, res, next) {
    let filters = null
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
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
    const where = {}
    if (filters.status) {
        where.status = filters.status
    }
    if (filters.startAt && filters.endAt) {
        where.createdAt = {
            [Op.and]: {
                [Op.gte]: addDay(filters.startAt, -1),
                [Op.lte]: addDay(filters.endAt, 1)
            }
        }
    }
    const tickets = await Ticket.findAll({
        limit: filters.limit >= 0 ? filters.limit : 50,
        offset: filters.offset,
        where,
        order: filters.orderBy,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['membershipId', 'name', 'email']
            }
        ]
    })
    return res.send(tickets)
})

router.get('/:id', async function(req, res, next) {
    const ticket = await Ticket.findOne({
        where: {
            id: req.params.id
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['membershipId', 'name', 'email']
            }
        ]
    })
    if (!ticket) {
        return next(
            new HttpError(
                httpErrors.NOT_FOUND.error_code,
                'NOT FOUND',
                {
                    ...httpErrors.NOT_FOUND,
                    type: 'NOT FOUND',
                    details: null
                })
        )
    }
    return res.send(ticket)
})

router.put('/:id', async function(req, res, next) {
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
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
    const ticket = await Ticket.findOne({
        where: {
            id: req.params.id
        }
    })
    if (!ticket) {
        return next(
            new HttpError(
                httpErrors.NOT_FOUND.error_code,
                'NOT FOUND',
                {
                    ...httpErrors.NOT_FOUND,
                    type: 'NOT FOUND',
                    details: null
                })
        )
    }
    ticket.status = output.status
    await ticket.save()
    return res.send(ticket)
})

export default router
