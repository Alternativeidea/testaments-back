import { Role } from '../models/role.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../utils/httpErrors.js'

export default async (req, res, next) => {
    const id = req.params.id
    const adminRole = await Role.findOne({
        where: {
            name: 'admin'
        }
    })
    if (req.user.roleId !== null && req.user.roleId === adminRole.id) {
        return next()
    }
    if (req.user.id !== parseInt(id)) {
        return next(new HttpError(
            httpErrors.FORBIDDEN.error_code,
            httpErrors.FORBIDDEN.message,
            {
                ...httpErrors.FORBIDDEN,
                type: 'Forbidden user action',
                details: null
            }))
    }

    return next()
}
