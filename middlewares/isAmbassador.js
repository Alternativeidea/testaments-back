import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../utils/httpErrors.js'
import { Role } from '../models/role.js'

function isAmbassador (req, res, next) {
    const ambassadorRole = Role.findOne({
        where: {
            name: 'ambassador'
        }
    })
    if (req.user.roleId === ambassadorRole.id) {
        next()
    } else {
        throw new HttpError(
            httpErrors.FORBIDDEN.error_code,
            httpErrors.FORBIDDEN.message + ' you are not an ambassador',
            {
                ...httpErrors.FORBIDDEN,
                type: 'Permissions Error',
                details: null
            })
    }
}

export default isAmbassador
