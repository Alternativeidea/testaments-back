import express from 'express'
import { createSchema, filterSchema, updateSchema } from '../../schemas/heirSchema.js'
import { makeATeaPot, makeValidationError, makeNotFoundError, httpErrors } from '../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Will } from '../../models/will.js'
import { Heir } from '../../models/heir.js'
import isAuth from '../../middlewares/isAuth.js'
import { HeirWill } from '../../models/will_heirs.js'
import { HttpError } from 'http-errors-enhanced'

const router = express.Router({ mergeParams: true })
router.use(isAuth)
router.post('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.user.id
        const heir = await Heir.create(output)
        return res.send(heir)
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

router.get('/', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: filterSchema,
            data: req.query
        })
        const heirs = await Heir.findAll({
            limit: output.limit >= 0 ? output.limit : 50,
            offset: output.offset,
            where: {
                userId: req.user.id
            },
            include: [
                {
                    model: Will,
                    as: 'wills',
                    attributes: ['id'],
                    through: {
                        attributes: []
                    }
                }
            ]
        })
        return res.send(heirs)
    } catch (err) {
        console.log(err)
        return next(
            makeATeaPot(err)
        )
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const heir = await Heir.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        })
        if (!heir) {
            return next(
                makeNotFoundError('heir')
            )
        }
        return res.send(heir)
    } catch (err) {
        console.log(err)
        return next(
            makeATeaPot(err)
        )
    }
})

router.put('/:id', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const heir = await Heir.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        })
        if (!heir) {
            return next(
                makeNotFoundError('heir')
            )
        }
        heir.set(output)
        await heir.save()
        return res.send(heir)
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

router.delete('/:id', async function(req, res, next) {
    try {
        const heir = await Heir.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        })
        if (!heir) {
            return next(
                makeNotFoundError('Heir')
            )
        }
        const heirWills = await HeirWill.findAll({
            attributes: ['willId'],
            include: [
                {
                    model: Will,
                    as: 'wills',
                    attributes: ['status', 'description']
                }
            ],
            where: {
                heirId: req.params.id
            }
        })
        if (heirWills !== null && heirWills.length > 0) {
            // return res.send(heirWills)
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'This Heir can not be deleted',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: 'This Heir can not be deleted',
                        details: heirWills
                    })
            )
        }
        await heir.destroy()
        return res.send({ delete: true })
    } catch (err) {
        console.log(err)
        return next(
            makeATeaPot(err)
        )
    }
})

export default router
