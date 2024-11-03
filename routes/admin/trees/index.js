import express from 'express'
import vine, { errors } from '@vinejs/vine'
import { updateSchema } from '../../../schemas/bannerSchema.js'
import { makeATeaPot, makeNotFoundError, makeValidationError } from '../../../utils/httpErrors.js'
import { Banner } from '../../../models/banner.js'
import { getConnection } from '../../../config/database.js'
import { User } from '../../../models/user.js'

const router = express.Router()
router.get('/:id', async function (req, res, next) {
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'hierarchy']
    })
    try {
        const connection = await getConnection()
        const [results] = await connection.query(`
            SELECT m.id, m.hierarchy, m.name, m.createdAt, m.status
            FROM Users m
            WHERE 
                (hierarchy LIKE concat('${user.hierarchy}.%')
                OR hierarchy = '${user.hierarchy}')
                AND m.status <> 0`)
        // (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1)
        const sums = {
            directs: 0,
            indirects: 0
        }
        const result = await results.map((e) => {
            let relativeLevel = 0
            let relativeArray = []
            if (e.id !== user.id) {
                relativeArray = e.hierarchy.replace(`${user.hierarchy}.`, '').split('.')
                relativeLevel = relativeArray.length
            }
            if (relativeLevel !== 0) {
                relativeLevel === 1 ? sums.directs += 1 : sums.indirects += 1
            }
            return {
                ...e,
                relativeLevel,
                relativeArray
            }
        })
        return res.send({ tree: result, sums })
        // console.log(results)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/:id', async function (req, res, next) {
    try {
        const banner = await Banner.findByPk(req.params.id)
        if (!banner) {
            return next(
                makeNotFoundError('banner')
            )
        }
        return res.send(banner)
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

router.put('/:id', async function (req, res, next) {
    try {
        const output = await vine.validate({
            schema: updateSchema,
            data: req.body
        })
        const banner = await Banner.findByPk(req.params.id)
        if (!banner) {
            return next(
                makeNotFoundError('banner')
            )
        }
        await banner.update(output)
        return res.send(banner)
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

export default router
