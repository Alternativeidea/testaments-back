import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../utils/httpErrors.js'

function isAdmin (req, res, next) {
    if (req.user.roleId === 3 || req.user.roleId === 4 || process.env.ENVIRONMENT === 'DEV') {
        next()
    } else {
        throw new HttpError(
            httpErrors.FORBIDDEN.error_code,
            httpErrors.FORBIDDEN.message,
            {
                ...httpErrors.FORBIDDEN,
                type: 'Permissions Error',
                details: null
            })
    }
}

export default isAdmin
