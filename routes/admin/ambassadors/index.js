import express from 'express'
import { User } from '../../../models/user.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot, makeNotFoundError } from '../../../utils/httpErrors.js'
import { getConnection } from '../../../config/database.js'
import { adminFilterSchema, createAdminSchema, updateSchema } from '../../../schemas/userSchema.js'
import vine, { errors } from '@vinejs/vine'
import { Role } from '../../../models/role.js'
import ShortUniqueId from 'short-unique-id'
import { getUserMemBonuses, getUserTSTBonuses } from '../../bonuses/calcs/index.js'
import { format } from '@formkit/tempo'
import { json2csv } from 'json-2-csv'
import disk from '../../../config/drive.js'

const router = express.Router()

router.get('/', async function(req, res, next) {
    let filters = null
    try {
        vine.convertEmptyStringsToNull = true
        filters = await vine.validate({
            schema: adminFilterSchema,
            data: req.query
        })
        // return res.send(filters)
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
    if (filters.count) {
        return res.send({
            count: await User.count({
                where: {
                    isAmbassador: true
                }
            })
        })
    }
    // TODO: get all who has agreed?
    const users = await User.findAll({
        attributes: ['id', 'name', 'lastName', 'createdAt', 'email', 'hierarchy', 'isAmbassador', 'agreeAmbassador'],
        limit: filters.limit >= 0 ? filters.limit : 50,
        offset: filters.offset,
        where: {
            isAmbassador: true
        }
    })

    // get trees
    const connection = await getConnection()
    const results = await Promise.all(users.map(async (u) => {
        const [result] = await connection.query(`
            SELECT m.id, m.hierarchy, m.name, m.createdAt, m.status
            FROM Users m
            WHERE 
                (hierarchy LIKE concat('${u.hierarchy}.%')
                OR hierarchy = '${u.hierarchy}')
                AND m.status <> 0`)

        const referredCounts = {
            directs: 0,
            indirects: 0
        }
        result.map((e) => {
            let relativeLevel = 0
            let relativeArray = []
            if (e.id !== u.id) {
                relativeArray = e.hierarchy.replace(`${u.hierarchy}.`, '').split('.')
                relativeLevel = relativeArray.length
            }
            if (relativeLevel !== 0) {
                relativeLevel === 1 ? referredCounts.directs += 1 : referredCounts.indirects += 1
            }
            return e
        })

        const commissions = await getUserTSTBonuses(u.id)
        let c = await commissions.reduce((acc, item) => {
            if (item.relativeLevel >= 1) {
                acc.generated += Number(item.total)
                acc.commissions += Number(item.commission)
            }
            return acc
        }, { generated: 0, commissions: 0 })

        const comissionsMem = await getUserMemBonuses(u.id)

        c = await comissionsMem.reduce((acc, item) => {
            if (item.relativeLevel >= 1) {
                acc.generated += Number(item.total)
                acc.commissions += Number(item.commission)
            }
            return acc
        }, { generated: c.generated, commissions: c.commissions })

        return {
            ...u.dataValues,
            ...referredCounts,
            ...c
        }
        // ...c
    })
    )

    if (filters.csv) {
        const t = new Date()
        const key = `report_SVETOVALEC_${format(t, 'YYYY-MM-DD')}.csv`
        // const nodeData = users.map((node) => node.get({ plain: true }))
        const csv = json2csv(results, {
            keys: [
                { field: 'id', title: 'ID' },
                { field: 'name', title: 'Name' },
                { field: 'lastName', title: 'Surename' },
                { field: 'email', title: 'Email' },
                { field: 'directs', title: 'Directs' },
                { field: 'indirects', title: 'Indirects' },
                { field: 'generated', title: 'Generated' },
                { field: 'commissions', title: 'Commissions' },
                { field: 'agreeAmbassador', title: 'Datum pogodbe' }
            ],
            emptyFieldValue: '/',
            expandNestedObjects: true
        })

        await disk.put(key, csv)
        const url = await disk.getSignedUrl(key)
        return res.send({ url })
    }

    return res.send(results)
})

router.get('/:id', async function(req, res, next) {
    const id = req.params.id
    const role = await Role.findOne({ where: { name: 'ambassador' } })
    const user = await User.findOne({
        where: {
            id,
            roleId: role.id
        }
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
        // return res.send(output)
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

    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.findByPk(id, { transaction })
        if (!user) {
            return next(
                makeNotFoundError('User')
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
    const role = await Role.findOne({ where: { name: 'ambassador' } })
    const user = await User.findOne({
        where: {
            id
        }
    })

    if (!user) {
        return next(
            makeNotFoundError('User')
        )
    }
    if (user.roleId === role.id) {
        return next(
            new HttpError(
                httpErrors.ALREADY_REPORTED.error_code,
                httpErrors.ALREADY_REPORTED.message,
                {
                    ...httpErrors.ALREADY_REPORTED,
                    type: 'This User is already an ambassador',
                    details: null
                })
        )
    }
    let referralLink = user.referralLink
    if (user.referralLink == null) {
        const uid = new ShortUniqueId({ length: 10 })
        referralLink = uid.rnd()
    }
    user.setDataValue('roleId', role.id)
    user.setDataValue('referralLink', referralLink)
    try {
        await user.update({
            roleId: role.id,
            referralLink
        })
    } catch (error) {
        console.log(error)
        return res.send(user)
    }
    return res.send(user)
})

router.post('/:id', async function(req, res, next) {
    const user = await User.findByPk(req.params.id)
    try {
        user.isAmbassador = !user.isAmbassador
        await user.save()
    } catch (error) {
        return next(makeATeaPot(error))
    }

    return res.send(user)
})

router.delete('/:id', async function(req, res, next) {
    const id = req.params.id
    const role = await Role.findOne({ where: { name: 'ambassador' } })
    const user = await User.findOne({
        where: {
            id,
            roleId: role.id
        }
    })

    if (!user) {
        return next(
            makeNotFoundError('User ')
        )
    }
    const roleUser = await Role.findOne({ where: { name: 'user' } })
    user.roleId = roleUser.id
    user.setDataValue('roleId', roleUser.id)
    await user.save()
    return res.send(user)
})

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

export default router
