import { HttpError } from 'http-errors-enhanced'

const httpErrors = {
    HASH_NO_AVAILABLE: { error_code: 499, message: 'User hash has not been sent' },
    HASH_ON_QUEUE: { error_code: 498, message: 'User hash it\'s on review' },
    NOT_ENOUGH_SHARES: { error_code: 491, message: 'Shares over 100 percent' },
    CAN_NOT_COMPLETE_ORDER: { error_code: 490, message: 'Order can not be completed with that amount of points' },
    BAD_REQUEST: { error_code: 400, message: 'Bad Request' },
    BAD_REQUEST_VALIDATION: { error_code: 409, message: 'Bad Request Validaton Error, on request values' },
    NOT_FOUND: { error_code: 404, message: 'Not Found Error, Resource not found' },
    FORBIDDEN: { error_code: 403, message: 'This resource it\'s forbidden for this user role or account' },
    UNAUTHORIZED: { error_code: 401, message: 'Not authorized for this action' },
    UNIQUE_CONSTRAINT: { error_code: 470, message: 'Unique constraint on the request' },
    ALREADY_REPORTED: { error_code: 480, message: 'Already Reported data...' },
    CODE_EXPIRED: { error_code: 420, message: 'Code Error, This token is not longer valid' },
    NOT_VERIFIED_EMAIL: { error_code: 206, message: 'You have not verified your email' },
    SOMETHING_HAPPEND: { error_code: 418, message: 'Something happend, try again later...' }
}

export const makeValidationError = (infoError) => {
    return new HttpError(
        httpErrors.BAD_REQUEST_VALIDATION.error_code,
        'Verification, you have not valid data on your request',
        {
            ...httpErrors.BAD_REQUEST_VALIDATION,
            type: httpErrors.BAD_REQUEST_VALIDATION.message,
            details: infoError.messages
        })
}
export const makeNotFoundError = (infoError) => {
    return new HttpError(
        httpErrors.NOT_FOUND.error_code,
        httpErrors.NOT_FOUND.message,
        {
            ...httpErrors.NOT_FOUND,
            type: httpErrors.NOT_FOUND.message,
            details: [
                {
                    resource: infoError
                }
            ]
        })
}
export const makeATeaPot = (infoError) => {
    return new HttpError(
        httpErrors.SOMETHING_HAPPEND.error_code,
        infoError.message ?? httpErrors.SOMETHING_HAPPEND.message,
        {
            ...httpErrors.SOMETHING_HAPPEND,
            type: 'Error unexpected',
            details: [
                {
                    message: infoError.message ?? '',
                    stack: process.env.REPORT === 'VERBOSE' ? infoError.stack ?? '' : null
                }
            ]
        })
}
export const makeAlreadyReportedError = (infoError) => {
    return new HttpError(
        httpErrors.BAD_REQUEST_VALIDATION.error_code,
        infoError,
        {
            ...httpErrors.BAD_REQUEST_VALIDATION,
            type: infoError,
            details: null
        })
}
export const makeCodeExpireError = () => {
    return new HttpError(
        httpErrors.CODE_EXPIRED.error_code,
        'This Code Has Expired',
        {
            ...httpErrors.CODE_EXPIRED,
            type: 'This Code Has Expired',
            details: null
        })
}

export { httpErrors }
