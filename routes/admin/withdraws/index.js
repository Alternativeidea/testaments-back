import express from 'express'
import isAuth from '../../../middlewares/isAuth.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Withdraw } from '../../../models/withdraw.js'
import { filterSchema, updateSchema } from '../../../schemas/withdrawSchema.js'
import vine, { errors } from '@vinejs/vine'
import { User } from '../../../models/user.js'
import { addDay, format, monthEnd, monthStart } from '@formkit/tempo'
import { Op } from 'sequelize'
import { sendApprovedWithdrawEmail, sendDeniedWithdrawEmail } from '../../../utils/mails/transactions.js'
import { json2csv } from 'json-2-csv'
import disk from '../../../config/drive.js'
const router = express.Router()
router.use(isAuth)

router.get('/', async function (req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const filters = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {}
        if (filters.status) {
            where.status = filters.status
        }
        if (filters.startAt && filters.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: format(filters.startAt, 'YYYY-MM-DD'),
                    [Op.lte]: format(addDay(filters.endAt, 1), 'YYYY-MM-DD')
                }
            }
        }

        const withdraws = await Withdraw.findAll({
            offset: filters.offset,
            limit: filters.limit,
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'lastName']
                }
            ],
            order: filters.orderBy
        })

        if (filters.csv) {
            const t = new Date()
            const key = `report_IZPLACILA_${format(t, 'YYYY-MM-DD')}.csv`
            const nodeData = withdraws.map((n) => {
                return {
                    id: n.id,
                    status: n.status === Withdraw.STATUS.DONE
                        ? 'Končano'
                        : n.status === Withdraw.STATUS.CANCELLED
                            ? 'Zavrjeno'
                            : 'V obdelavi',
                    quantity: Number(n.quantity).toLocaleString('sl-SI', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) + ' EUR',
                    userId: n.userId,
                    fee: Number(n.fee).toLocaleString('sl-SI', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) + ' EUR',
                    name: n.name,
                    reason: n.reason,
                    createdAt: format(n.createdAt, 'full', 'sl'),
                    updatedAt: format(n.updatedAt, 'full', 'sl')
                }
            })
            const csv = json2csv(nodeData, {
                keys: [
                    { field: 'id', title: 'Transakcije ID' },
                    { field: 'name', title: 'Name' },
                    { field: 'userId', title: 'User Id' },
                    { field: 'createdAt', title: 'Created at' },
                    { field: 'quantity', title: 'Total' },
                    { field: 'fee', title: 'Fee' },
                    { field: 'status', title: 'Status' },
                    { field: 'updatedAt', title: 'Datum dogodka' },
                    { field: 'reason', title: 'Reason' }
                ],
                emptyFieldValue: '/',
                expandNestedObjects: true
            })

            await disk.put(key, csv)
            const url = await disk.getSignedUrl(key)
            return res.send({ url })
        }

        return res.send(withdraws)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(makeValidationError(error))
        }
        return next(makeATeaPot(error))
    }
})

router.get('/:id', async function (req, res, next) {
    try {
        const withdraw = await Withdraw.findByPk(req.params.id)
        if (!withdraw) {
            return next(
                makeNotFoundError('withdraw')
            )
        }
        return res.send(withdraw)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })

        const withdraw = await Withdraw.findByPk(req.params.id)
        if (!withdraw) {
            return next(
                makeNotFoundError('withdraw')
            )
        }

        withdraw.set({
            status: output.status,
            reason: output.reason ?? null
        })
        const user = await User.findByPk(withdraw.userId)
        if (output.status === Withdraw.STATUS.DONE) {
            await sendApprovedWithdrawEmail(user, withdraw)
        } else if (output.status === Withdraw.STATUS.CANCELLED) {
            await sendDeniedWithdrawEmail(user, withdraw)
        }
        await withdraw.save()
        return res.send(withdraw)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
        return next(makeATeaPot(error))
    }
})

router.get('/data/generals', async function (req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const filters = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            status: [
                Withdraw.STATUS.ACTIVE,
                Withdraw.STATUS.DONE,
                Withdraw.STATUS.CANCELLED
            ]
        }
        if (filters.status) {
            // where.status = filters.status
        }
        if (filters.startAt && filters.endAt) {
            where.createdAt = {
                [Op.and]: {
                    [Op.gte]: addDay(filters.startAt, -1),
                    [Op.lte]: addDay(filters.endAt, 1)
                }
            }
        }

        const results = {
            count: await Withdraw.count({ where: { ...where, status: 2 } }),
            quantity: await Withdraw.sum('quantity', { where: { ...where, status: 2 } }),
            fees: await Withdraw.sum('fee', { where: { ...where, status: 2 } })
        }
        return res.send(results)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/data/monthly', async function (req, res, next) {
    try {
        const endAt = monthEnd(new Date())
        const startAt = monthStart(new Date())

        const where = {}
        where.status = 1
        where.createdAt = {
            [Op.and]: {
                [Op.gte]: addDay(startAt, -1),
                [Op.lte]: addDay(endAt).setHours(-6)
            }
        }
        const results = {
            count: await Withdraw.count({ where }),
            quantity: await Withdraw.sum('quantity', { where }),
            fees: await Withdraw.sum('fee', { where })
        }
        where.status = [2, 3]
        const payedOut = {
            count: await Withdraw.count({ where }),
            quantity: await Withdraw.sum('quantity', { where }),
            fees: await Withdraw.sum('fee', { where })
        }

        const final = {
            count: payedOut.count,
            quantity: results.quantity ?? 0 - payedOut.quantity ?? 0
        }

        return res.send(final)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export default router
