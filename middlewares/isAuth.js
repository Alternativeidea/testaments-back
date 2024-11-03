import { User } from '../models/user.js'
import jwt from 'jsonwebtoken'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors } from '../utils/httpErrors.js'

const isAuth = async (req, res, next) => {
    let token = req.headers.token || req.headers.authorization

    if (token) {
        token = token.replace('Bearer ', '')
        let decoded = null
        try {
            decoded = jwt.verify(token, process.env.SECRET)
        } catch (error) {
            return next(
                new HttpError(
                    httpErrors.UNAUTHORIZED.error_code,
                    'Unauthorized',
                    {
                        ...httpErrors.UNAUTHORIZED,
                        type: 'Authorization Error, Could not make the search for this token',
                        details: { ...error }
                    })
            )
        }
        let user = null
        try {
            user = await User.scope('mid').findByPk(decoded.id)
            if (!user) {
                // throw { type: 'Authorization Error, Could not make the search for this token', ...httpErrors.UNAUTHORIZED }
                return next(
                    new HttpError(
                        httpErrors.UNAUTHORIZED.error_code,
                        'Unauthorized',
                        {
                            ...httpErrors.UNAUTHORIZED,
                            type: 'Authorization Error, Could not make the search for this token'
                        })
                )
            }
            // TODOO: Make here the check for active or inactive users
            // User.status > User.ACTIVE reject user
        } catch (error) {
            // throw { type: '', ...httpErrors.UNAUTHORIZED }
            return next(
                new HttpError(
                    httpErrors.UNAUTHORIZED.error_code,
                    'Unauthorized',
                    {
                        ...httpErrors.UNAUTHORIZED,
                        type: 'Authorization Error, Could not make this request, not able to get decoded info'
                    })
            )
        }
        req.user = user
    } else {
        console.log('header not auth')
        return next(
            new HttpError(
                httpErrors.UNAUTHORIZED.error_code,
                'Unauthorized',
                {
                    ...httpErrors.UNAUTHORIZED,
                    type: 'Unauthorized: Not token in header'
                })
        )
    }

    next()
}

export default isAuth
