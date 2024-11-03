import express from 'express'
import { makeATeaPot, makeNotFoundError, makeValidationError, httpErrors } from '../../../../utils/httpErrors.js'
import vine, { errors } from '@vinejs/vine'
import { Document } from '../../../../models/document.js'
import { HeirWill } from '../../../../models/will_heirs.js'
import { Will } from '../../../../models/will.js'
import { createSchema, updateSchema } from '../../../../schemas/heirSchema.js'
import { Heir } from '../../../../models/heir.js'
import { User } from '../../../../models/user.js'
import { HttpError } from 'http-errors-enhanced'
const router = express.Router({
    mergeParams: true
})

/**
 * Get the user heirs
 */
router.get('/', async function(req, res, next) {
    const id = req.params.id
    const user = await User.findByPk(id, {
        include: [
            {
                model: Heir,
                as: 'heirs',
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
            }
        ]
    })

    if (!user) {
        return next(
            makeNotFoundError('User')
        )
    }
    return res.send(user.heirs)
})

router.get('/:heirId', async function(req, res, next) {
    const heir = await Heir.findByPk(req.params.heirId)

    if (!heir) {
        return next(
            makeNotFoundError('heir')
        )
    }
    return res.send(heir)
})

/**
 * Create a document on the users profile
 */
router.post('/', async function(req, res, next) {
    try {
        vine.convertEmptyStringsToNull = true
        const output = await vine.validate({
            schema: createSchema,
            data: req.body
        })
        output.userId = req.params.id
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

router.put('/:heirId', async function(req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const heir = await Heir.findOne({
            where: {
                id: req.params.heirId,
                userId: req.params.id
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

router.delete('/:heirId', async function(req, res, next) {
    try {
        const heir = await Heir.findOne({
            where: {
                id: req.params.heirId,
                userId: req.params.id
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
