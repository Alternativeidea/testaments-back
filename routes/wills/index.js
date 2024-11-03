import { Category } from '../../models/category.js'
import { Will } from '../../models/will.js'
import { Document } from '../../models/document.js'
import isAuth from '../../middlewares/isAuth.js'
import { httpErrors, makeATeaPot, makeAlreadyReportedError, makeCodeExpireError, makeNotFoundError, makeValidationError } from '../../utils/httpErrors.js'
import { HttpError } from 'http-errors-enhanced'
import express from 'express'
import { createSchema, filterSchema } from '../../schemas/willSchema.js'
import vine, { errors } from '@vinejs/vine'
// import heirsRouter from './heirs/index.js'
import { Heir } from '../../models/heir.js'
import { User } from '../../models/user.js'
import { getConnection } from '../../config/database.js'
import { Request } from '../../models/request.js'
import { sendEditWillRequestEmail, sendNewWillRequestEmail, sendConfirmWillRequestEmail } from '../../utils/mails/wills.js'
import { HeirWill } from '../../models/will_heirs.js'
import { updateSchema } from '../../schemas/requestSchema.js'
import { Code } from '../../models/code.js'
import ShortUniqueId from 'short-unique-id'
import { addMinute, isAfter } from '@formkit/tempo'

const router = express.Router()
router.use(isAuth)
router.post('/', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.user.id
        output.status = Will.STATUS.NEW
        const will = await Will.create(output, { transaction })
        const requesting = await Request.create({
            willId: will.id,
            userId: will.userId,
            status: Request.STATUS.IN_PROCESS,
            action: Request.ACTIONS.ADD,
            history: [{ action: 'Add', date: new Date(), admin: null }]
        }, { transaction })

        let sum = 0
        for (let index = 0; index < output.heirs.length; index++) {
            sum += output.heirs[index].share
            output.heirs[index].willId = will.id
            const heir = await Heir.findOne({
                where: {
                    id: output.heirs[index].id,
                    userId: req.user.id
                }
            }, { transaction })
            if (!heir) {
                await transaction.rollback()
                return next(
                    makeNotFoundError('heir')
                )
            }
            // await will.addHeir(heir, {
            //     through: {
            //         share: output.heirs[index].share,
            //         constrains: output.heirs[index].constrains
            //     }
            // }, { transaction })
            await HeirWill.create({
                willId: will.id,
                heirId: heir.id,
                share: output.heirs[index].share,
                constrains: output.heirs[index].constrains
            }, { transaction })
        }
        if (sum !== 100) {
            await transaction.rollback()
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Validation - Shares on heirs must be 100%',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: null
                    })
            )
        }
        await transaction.commit()
        const result = await Will.findByPk(will.id, {
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: User.scope('mini'),
                    as: 'user'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs',
                    through: { attributes: ['share', 'constrains'] }
                }
            ]
        })
        await sendNewWillRequestEmail(req.user)
        result.setDataValue('request', requesting)
        return res.send(result)
    } catch (error) {
        console.log(error)
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

router.get('/', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.user.id,
            status: Will.STATUS.ACTIVE
        }
        if (output.categories) {
            where.categoryId = output.categories
        }
        const wills = await Will.findAll({
            where,
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: Heir.scope('mini'),
                    as: 'heirs'
                },
                {
                    model: Document,
                    attributes: ['id', 'url'],
                    as: 'document'
                }
            ]
        })

        wills.forEach((e) => {
            e.heirs.forEach((h) => {
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
            makeATeaPot(error)
        )
    }
})

/**
 * This methos retrieves the loged user
 * request to become a Will
 * @request
 * @response
 */
router.get('/requests', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const where = {
            userId: req.user.id
        }
        if (output.status) {
            where.status = output.status
        }
        const wills = await Request.findAll({
            where,
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
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
                makeValidationError(error)
            )
        }
        return next(
            makeATeaPot(error)
        )
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const will = await Will.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                status: Will.STATUS.ACTIVE
            },
            include: [
                {
                    model: Category.scope('mini'),
                    as: 'category'
                },
                {
                    model: Heir.scope('joined'),
                    as: 'heirs',
                    through: {
                        attributes: {
                            exclude: ['heirId', 'willId', 'createdAt', 'updatedAt']
                        }
                    }
                },
                {
                    model: Document,
                    as: 'document'
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
        return res.send(will)
    } catch (error) {
        return next(
            makeATeaPot(error)
        )
    }
})

router.put('/:id', async function(req, res, next) {
    const connection = await getConnection()
    let transaction = null
    try {
        // ? only will that are active could be request to be deleted
        const will = await Will.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                status: Will.STATUS.ACTIVE
            }
        })
        if (!will) {
            return next(
                makeNotFoundError('Will')
            )
        }

        const requesting = await Request.findOne({
            where: {
                status: Request.STATUS.IN_PROCESS,
                action: Request.ACTIONS.DELETE,
                willId: will.id
            }
        })

        if (requesting) {
            return next(
                new HttpError(
                    httpErrors.ALREADY_REPORTED.error_code,
                    httpErrors.ALREADY_REPORTED.message,
                    {
                        ...httpErrors.ALREADY_REPORTED,
                        type: 'Already Reported',
                        details: requesting
                    })
            )
        }
        transaction = await connection.transaction()
        const result = await Request.create({
            willId: will.id,
            userId: will.userId,
            status: Request.STATUS.IN_PROCESS,
            action: Request.ACTIONS.EDIT,
            history: [{ action: 'Edit', date: new Date(), admin: null }]
        }, { transaction })
        will.status = Will.STATUS.ON_HOLD
        await will.save({ transaction })
        // TODO: change this to success email
        // await sendConfirmWillRequestEmail(req.user)
        await transaction.commit()
        return res.send({ ...will.dataValues, request: result })
    } catch (error) {
        await transaction.rollback()
        console.log(error)
        return next(
            makeATeaPot(error)
        )
    }
})

router.delete('/:id', async function(req, res, next) {
    const connection = await getConnection()
    let transaction = null
    try {
        // ? only will that are active could be request to be deleted
        const will = await Will.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                status: Will.STATUS.ACTIVE
            }
        })
        if (!will) {
            return next(
                makeNotFoundError('Will')
            )
        }

        const requesting = await Request.findOne({
            where: {
                status: Request.STATUS.IN_PROCESS,
                action: Request.ACTIONS.DELETE,
                willId: will.id
            }
        })

        if (requesting) {
            return next(
                new HttpError(
                    httpErrors.ALREADY_REPORTED.error_code,
                    httpErrors.ALREADY_REPORTED.message,
                    {
                        ...httpErrors.ALREADY_REPORTED,
                        type: 'Already Reported',
                        details: requesting
                    })
            )
        }
        transaction = await connection.transaction()
        const result = await Request.create({
            willId: will.id,
            userId: will.userId,
            status: Request.STATUS.IN_PROCESS,
            action: Request.ACTIONS.DELETE,
            history: [{ action: 'Delete', date: new Date(), admin: null }]
        }, { transaction })
        will.status = Will.STATUS.ON_HOLD
        await will.save({ transaction })
        // TODO: change this to success email
        // await sendConfirmWillRequestEmail(req.user)
        await transaction.commit()
        return res.send({ ...will.dataValues, request: result })
    } catch (error) {
        await transaction.rollback()
        console.log(error)
        return next(
            makeATeaPot(error)
        )
    }
})

router.patch('/:id', async function(req, res, next) {
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const will = await Will.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [
                {
                    model: Document,
                    as: 'document'
                }
            ]
        })
        if (!will) {
            return next(
                makeNotFoundError('Will')
            )
        }
        if (output.code !== null) {
            const code = await Code.findOne({
                where: {
                    code: output.code,
                    type: output.action === 'edit' ? Code.TYPES.REQUEST_EDIT : Code.TYPES.REQUEST_DELETE
                }
            })
            if (!code) {
                return next(
                    makeNotFoundError('code')
                )
            }
            if (isAfter(new Date(), code.expiresAt)) {
                return next(makeCodeExpireError())
            }
            if (will.status === Will.STATUS.ON_HOLD || will.status === Will.STATUS.NEW) {
                return next(makeAlreadyReportedError('This Will is already on hold'))
            }
            will.status = Will.STATUS.ON_HOLD
            await will.save({ transaction })
            const requesting = await Request.create({
                willId: will.id,
                userId: will.userId,
                status: Request.STATUS.IN_PROCESS,
                action: Request.ACTIONS.EDIT,
                history: [{ action: 'Edit', date: new Date(), admin: null }]
            }, { transaction })
            if (output.action === 'edit') {
                await sendEditWillRequestEmail(req.user)
            } else {
                await sendEditWillRequestEmail(req.user)
            }
            await transaction.commit()
            return res.send({ ...will.dataValues, request: requesting })
        }
        // if (will.status === Will.STATUS.ON_HOLD || will.status === Will.STATUS.NEW) {
        //     return next(makeAlreadyReportedError('This Will is already on hold'))
        // }
        const token = await Code.create({
            email: req.user.email,
            code: new ShortUniqueId({ length: 8 }).rnd(),
            timeToLive: 30,
            expiresAt: addMinute(new Date(), 30),
            type: output.action === 'edit' ? Code.TYPES.REQUEST_EDIT : Code.TYPES.REQUEST_DELETE
        })
        await sendConfirmWillRequestEmail(req.user, output.action, will, token.code)
        return res.send({ created: true, token: process.env.ENVIRONMENT === 'DEV' ? token.code : null })
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

// TODO: Heirs should not be CRUD for users
// router.use('/:id/heirs', heirsRouter)

export default router
