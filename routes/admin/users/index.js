import express from 'express'
import { User } from '../../../models/user.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { getConnection } from '../../../config/database.js'
import { adminFilterSchema, createAdminSchema, patchSchema, updateSchema } from '../../../schemas/userSchema.js'
import vine, { errors } from '@vinejs/vine'
import willsRouter from './wills/index.js'
import { Log } from '../../../models/log.js'
import transactionsRouter from './transactions/index.js'
import documentsRouter from './documents/index.js'
import bonusesRouter from './bonuses/index.js'
import heirsRouter from './heirs/index.js'
import withdrawsRouter from './withdraws/index.js'
import { sendDeceasedEmail } from '../../../utils/mails/wills.js'
import { json2csv } from 'json-2-csv'
import disk from '../../../config/drive.js'
import { format } from '@formkit/tempo'
import { sendStatusEmail } from '../../../utils/mails/auth.js'
import { Country } from '../../../models/country.js'

const router = express.Router()

router.post('/', async function(req, res, next) {
    const body = req.body
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: createAdminSchema,
            data: body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }
    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.create(
            output,
            {
                transaction
            }
        )
        await transaction.commit()
        const result = await User.findByPk(user.id)
        return res.send(result)
    } catch (err) {
        await transaction.rollback()
        if (err.name === 'SequelizeUniqueConstraintError') {
            if (err.errors[0].path === 'email') {
                return next(
                    new HttpError(
                        httpErrors.UNIQUE_CONSTRAINT.error_code,
                        'UNIQUE This Email has been already taken',
                        {
                            ...httpErrors.UNIQUE_CONSTRAINT,
                            type: 'UNIQUE This Email has been already taken',
                            details: err
                        })
                )
            }
            return next(
                new HttpError(
                    httpErrors.UNIQUE_CONSTRAINT.error_code,
                    'Unique constraint',
                    {
                        ...httpErrors.UNIQUE_CONSTRAINT,
                        type: 'Unique constraint',
                        details: err
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Something happend from devs :c',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Something happend from devs :c',
                    details: err
                })
        )
    }
})

router.get('/', async function(req, res, next) {
    let filters = null
    const where = {
        roleId: [1]
    }
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: adminFilterSchema,
            data: req.query
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }

    if (filters.status) {
        where.status = filters.status
    }
    if (filters.membershipId) {
        where.membershipId = filters.membershipId
    }

    if (filters.csv) {
        const users = await User.findAll({
            attributes: [
                'id', 'name', 'lastName', 'email', 'areaCode', 'phone',
                'referralLink', 'city', 'address', 'zipcode', 'birthdate', 'balance',
                'gender', 'isAmbassador', 'isVerified', 'membershipId', 'createdAt'
            ],
            limit: filters.limit >= 0 ? filters.limit : 100,
            offset: filters.offset,
            order: filters.orderBy,
            where
        })
        const t = new Date()

        const key = `report_STIKI_${format(t, 'YYYY-MM-DD')}.csv`
        const nodeData = users.map((node) => {
            return {
                id: node.id,
                name: node.name,
                lastName: node.lastName,
                email: node.email,
                code: node.code,
                phone: node.phone,
                referralLink: node.referralLink,
                city: node.city,
                address: node.address,
                zipcode: node.zipcode,
                birthdate: node.birthdate,
                gender: node.gender,
                isAmbassador: node.isAmbassador ? 'Yes' : 'No',
                isVerified: node.membershipId === 2 ? 'Premium' : 'Free',
                balance: Number(node.balance).toLocaleString('sl-SI', {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4
                }) + ' TST',
                createdAt: format(node.createdAt, 'full', 'sl')
            }
        })
        const csv = json2csv(nodeData, {
            keys: [
                { field: 'id', title: 'Id' },
                { field: 'name', title: 'Name' },
                { field: 'lastName', title: 'Surename' },
                { field: 'email', title: 'Email' },
                { field: 'code', title: 'Code' },
                { field: 'phone', title: 'Phone' },
                { field: 'referralLink', title: 'Link' },
                { field: 'city', title: 'City' },
                { field: 'address', title: 'Address' },
                { field: 'zipcode', title: 'Zipcode' },
                { field: 'birthdate', title: 'Birthdate' },
                { field: 'balance', title: 'TST stanje' },
                { field: 'gender', title: 'Gender' },
                { field: 'isAmbassador', title: 'Svetovalec' },
                { field: 'createdAt', title: 'Datum vpisa' },
                { field: 'isVerified', title: 'Vrsta stika' }
            ],
            emptyFieldValue: '/',
            expandNestedObjects: true
        })

        await disk.put(key, csv)
        const url = await disk.getSignedUrl(key)
        return res.send({ url })
    }

    const users = await User.findAll({
        limit: filters.limit >= 0 ? filters.limit : 100,
        offset: filters.offset,
        order: filters.orderBy,
        where
    })

    return res.send(users)
})

router.get('/:id', async function(req, res, next) {
    const id = req.params.id
    const user = await User.findByPk(id, {
        include: [
            {
                model: Country,
                as: 'country'
            }
        ]
    })

    if (!user) {
        return next(
            makeNotFoundError('User')
        )
    }
    return res.send(user)
})

router.put('/:id', async function(req, res, next) {
    const id = req.params.id
    let output = null
    try {
        vine.convertEmptyStringsToNull = true
        output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
    } catch (error) {
        console.log(error)
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }
    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.findByPk(id, { transaction })
        if (!user) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    httpErrors.NOT_FOUND.message,
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'Not Found ID',
                        details: null
                    })
            )
        }
        await user.update(output, { transaction })
        transaction.commit()
        const result = await User.findByPk(user.id)
        return res.send(result)
    } catch (error) {
        transaction.rollback()
        console.log(error)
        return next(
            makeATeaPot(error)
        )
    }
})

router.patch('/:id', async function(req, res, next) {
    const id = req.params.id
    let output = null
    try {
        output = await vine.validate({
            schema: patchSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                makeValidationError(error)
            )
        }
    }

    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.findByPk(id, { transaction })
        if (!user) {
            return next(
                makeNotFoundError('User')
            )
        }
        let action = Log.ACTIONS.SUSPEND
        if (output.status === User.STATUS.ACTIVE) {
            action = Log.ACTIONS.REACTIVATE
        } else if (output.status === User.STATUS.DECEASED) {
            action = Log.ACTIONS.DECEASED
            output.message = 'Pokojni'
            // TODO: here send all the heirs emails
            const heirs = await user.getHeirs({
                attributes: ['name', 'email']
            }, { transaction })
            await sendDeceasedEmail(heirs)
        }

        if (output.status === User.STATUS.SUSPENDED || User.STATUS.DELETED || User.STATUS.ACTIVE) {
            await sendStatusEmail(user, output.status)
        }
        user.status = output.status
        await user.save({ transaction })
        const log = await Log.create({
            message: output.message,
            action,
            userId: user.id,
            adminId: req.user.id
        }, { transaction })
        await transaction.commit()
        return res.send(log)
    } catch (error) {
        transaction.rollback()
        console.log(error)
        return next(
            makeATeaPot(error)
        )
    }
})

router.delete('/:id', async function(req, res, next) {
    const id = req.params.id
    const user = await User.findOne({
        where: {
            status: User.STATUS.DELETED,
            id
        }
    })
    if (user) {
        return res.send({ deleted: true })
    }
    const d = await User.findByPk(id)
    // TODO: make this log available?
    await Log.create({
        message: 'Izbrisani',
        action: Log.ACTIONS.DELETE,
        userId: d.id,
        adminId: req.user.id
    })
    d.status = User.STATUS.DELETED
    await d.save()
    return res.send({ deleted: true })
})

router.get('/:id/logs', async function(req, res, next) {
    const user = await User.findByPk(req.params.id, {
        order: [['logs', 'createdAt', 'DESC']],
        include: [
            {
                model: Log,
                as: 'logs'
            }
        ]
    })
    if (!user) {
        return next(
            makeNotFoundError('User')
        )
    }
    return res.send(user.logs)
})

router.use('/:id/heirs', heirsRouter)
router.use('/:id/wills', willsRouter)
router.use('/:id/documents', documentsRouter)
router.use('/:id/transactions', transactionsRouter)
router.use('/:id/bonuses', bonusesRouter)
router.use('/:id/withdraws', withdrawsRouter)

export default router
