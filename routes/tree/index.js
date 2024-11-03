import express from 'express'
import isAuth from '../../middlewares/isAuth.js'
import { User } from '../../models/user.js'
import { makeATeaPot } from '../../utils/httpErrors.js'
import { getConnection } from '../../config/database.js'

const router = express.Router()
router.use(isAuth)

router.get('/recursive', async function (req, res, next) {
    const user = await User.findByPk(req.user.id)
    try {
        const connection = await getConnection()
        const [results] = await connection.query(`
            WITH RECURSIVE os (id, name, uplineId, level, relativeLevel) AS (
            SELECT     id,
                       name,
                       uplineId,
                       level,
                       0 AS relativeLevel
            FROM       Users
            WHERE      id = ${user.id}
            UNION ALL
            SELECT     m.id,
                       m.name,
                       m.uplineId,
                       m.level,
                       os.relativeLevel + 1
            FROM       Users m
            INNER JOIN os
                    ON m.uplineId = os.id
           )
          SELECT * FROM os`)
        return res.send(results)
        // console.log(results)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/', async function (req, res, next) {
    const user = await User.findByPk(req.user.id, {
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
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'hierarchy', 'createdAt']
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

        let fullArray = []
        await results.map((e) => {
            let relativeLevel = 0
            let relativeArray = []
            if (e.id !== user.id) {
                relativeArray = e.hierarchy.replace(`${user.hierarchy}.`, '').split('.')
                relativeLevel = relativeArray.length
            }
            if (relativeLevel === 1) {
                if (fullArray.length < relativeArray.length) {
                    fullArray = e.hierarchy.replace(`${user.hierarchy}.`, '').split('.')
                }
            }
            return {
                ...e,
                relativeLevel,
                relativeArray
            }
        })

        return res.send({
            createdAt: user.createdAt,
            relativeArray: fullArray
        })
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

router.get('/tree-profile/:id', async function (req, res, next) {
    const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'hierarchy']
    })
    try {
        const connection = await getConnection()
        const [results] = await connection.query(`
            SELECT m.id, m.hierarchy, m.name
            FROM Users m
            WHERE 
                hierarchy LIKE concat('${user.hierarchy}.%')
                OR hierarchy = '${user.hierarchy}'`)

        const sums = {
            directs: 0,
            indirects: 0
        }
        let sponsor = 'none'
        let sponsorId = null
        const sponsorArray = user.hierarchy.split('.')
        console.log('sponsors array ', sponsorArray.length)
        if (sponsorArray.length >= 2) {
            const sponsorTemp = await User.findByPk(
                Number.parseInt(
                    sponsorArray[sponsorArray.length - 2]
                )
                , { attributes: ['id', 'name', 'lastName'] })
            sponsor = sponsorTemp.name + ' ' + sponsorTemp.lastName
            sponsorId = sponsorTemp.id
        }

        await results.map((e) => {
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
        return res.send({ sums, sponsor, sponsorId })
        // console.log(results)
    } catch (error) {
        return next(makeATeaPot(error))
    }
})

export default router
