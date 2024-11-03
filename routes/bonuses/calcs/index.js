import { User } from '../../../models/user.js'
import { getConnection } from '../../../config/database.js'
import { Transaction } from '../../../models/transaction.js'
import { addYear, format } from '@formkit/tempo'
import { BonusesRate } from '../../../models/bonusesRate.js'

// TODO: missing startDate on this two
/*
 * This one consults the TST commisions from an USERID
 * GROUPED BY
 * m.id = for group results on transaction user
 * relativeLevel = for group results on relativeLevel
 */
export const getUserTSTBonuses = async (userId, groupedBy = '') => {
    const user = await User.findByPk(userId)
    const connection = await getConnection()

    const [length] = await connection.query(`
            SELECT 
                LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1 AS length
            FROM Users m 
            WHERE id = ${user.id}`)

    const datas = await BonusesRate.findAll({
        where: {
            type: 'tst'
        }
    })
    const wholeData = []
    for (const rate of datas) {
        const query = `
                    SELECT
                        t.id as tId, 
                        t.total, 
                        m.id as uId,
                        ${groupedBy === 'm.id' ? 'm.name,' : ''}
                        ${groupedBy === 'm.id' ? `'${user.name}' as upline,` : ''}
                        ${user.id} as rUserId, 
                        t.createdAt, 
                        t.updatedAt, 
                        hierarchy,
                        t.status,
                        t.type as formerType,
                        CASE
                            WHEN t.type = ${Transaction.TYPE.MANUALLY_ADD}
                            THEN 2
                            ELSE t.type
                        END AS type,
                        (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length} as relativeLevel,
                        CASE
                            WHEN (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length}  = 1 
                            THEN ${rate.direct} * t.total 
                            WHEN (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length}  > 1 
                            THEN ${rate.indirect} * t.total 
                            ELSE 0
                        END AS commission
                    FROM Users m
                    LEFT JOIN Transactions t on m.id = t.userId
                    WHERE 
                        (t.status = ${Transaction.STATUS.ACCEPTED} AND (t.type = ${Transaction.TYPE.INCOMING} OR ${Transaction.TYPE.MANUALLY_ADD})) 
                        AND 
                        (t.updatedAt >= '${user.agreeAmbassador ?? format(addYear(new Date(), 1), 'YYYY-MM-DD')}')
                        AND 
                        (t.updatedAt >= '${format(rate.createdAt, 'YYYY-MM-DD HH:mm:ss')}' ${rate.isCurrent ? '' : `AND t.updatedAt <= '${format(rate.updatedAt, 'YYYY-MM-DD HH:mm:ss')}'`} )
                        AND 
                        (hierarchy LIKE '${user.hierarchy}.%') ORDER BY t.updatedAt DESC`
        const [results] = await connection.query(query)
        wholeData.push(...results)
    }
    return wholeData
}

/*
 * This one consults the Mem commissions from an USERID
 * GROUPED BY
 * m.id = for group results on transaction user
 * relativeLevel = for group results on relativeLevel
 */
export const getUserMemBonuses = async (userId, groupedBy = '') => {
    const user = await User.findByPk(userId)
    const connection = await getConnection()

    const [length] = await connection.query(`
            SELECT 
                LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1 AS length
            FROM Users m 
            WHERE id = ${user.id}`)

    const datas = await BonusesRate.findAll({
        where: {
            type: 'premium'
        }
    })
    const wholeData = []
    for (const rate of datas) {
        const [results] = await connection.query(`
                        SELECT
                            t.id as tId, 
                            t.price as total, 
                            m.id as uId, 
                            ${groupedBy === 'm.id' ? 'm.name,' : ''}
                            ${groupedBy === 'm.id' ? `'${user.name}' as upline,` : ''}
                            ${user.id} as rUserId,
                            m.memPurchasedAt as createdAt, 
                            m.memPurchasedAt as 'updatedAt', 
                            hierarchy,
                            ${Transaction.STATUS.ACCEPTED} as status, 
                            3 as type,   
                            (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length} as relativeLevel,
                            CASE
                                WHEN (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length}  = 1 
                                    THEN ${rate.direct} * t.price 
                                WHEN (LENGTH(m.hierarchy) - LENGTH(REPLACE(m.hierarchy, '.', '')) + 1) - ${length[0].length}  > 1 
                                    THEN ${rate.indirect} * t.price 
                                ELSE 0
                            END as commission
                        FROM Users m
                        LEFT JOIN Memberships t on m.membershipId = t.id
                        WHERE 
                            m.membershipId = 2
                            AND
                            m.memPurchasedAt IS NOT NULL
                            AND
                            m.memPurchasedAt >= '${user.agreeAmbassador ?? format(addYear(new Date(), 1), 'YYYY-MM-DD')}'
                            AND
                            (memPurchasedAt >= '${format(rate.createdAt, 'YYYY-MM-DD HH:mm:ss')}' ${rate.isCurrent ? '' : `AND memPurchasedAt <= '${format(rate.updatedAt, 'YYYY-MM-DD HH:mm:ss')}'`} )
                            AND
                            (hierarchy LIKE '${user.hierarchy}.%' 
                            OR hierarchy = '${user.hierarchy}') ORDER BY m.memPurchasedAt DESC`)
        wholeData.push(...results)
    }
    // (m.nextRenewal >= '${user.agreeAmbassador}')

    return wholeData
}
