import Joi from 'joi'
import vine from '@vinejs/vine'

export const encodedIntegerArray = Joi.string().custom((value, helpers) => {
    const numbers = value.split(',').map(Number)
    const isValid = numbers.every(Number.isInteger)
    if (isValid) {
        return numbers
    } else {
        return helpers.error('any.invalid')
    }
})

export const myRule = vine.createRule(async (value, options, field) => {
    if (typeof value !== 'string') {
        // eslint-disable-next-line no-useless-return
        return
    }
    const numbers = value.split(',').map(Number)
    const isValid = numbers.every(Number.isInteger)
    if (isValid) {
        // return numbers
    } else {
        field.report(
            'The {{ field }} must be comma separated value',
            'unique',
            field
        )
    }
}, {
    implicit: true
})

export const notEmptyString = vine.createRule(async (value, options, field) => {
    if (typeof value !== 'string') {
        // eslint-disable-next-line no-useless-return
        return
    }
    if (value.length === 0) {
        field.report(
            'The {{ field }} must not be an empty value',
            'Empty',
            field
        )
    }
}, {
    implicit: true
})

export const transformEncodedIntegerArray = (value) => {
    return value.split(',').map(Number)
}
export const transformEncodedStringArray = (value) => {
    const results = value.split(',')
    const resolve = results.map((e) => {
        if (e.includes('-')) {
            return [e.substring(1), 'DESC']
        }
        return [e, 'ASC']
    })
    return resolve
}

export const verifyEmso = vine.createRule(async (value, options, field) => {
    if (typeof value !== 'string') {
        // eslint-disable-next-line no-useless-return
        return
    }
    const emsoFactorMap = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let controlDigit = value.split('').slice(0, 12).reduce((acc, curr, i) => {
        return acc + (parseInt(curr) * emsoFactorMap[i])
    }, 0) % 11
    controlDigit = controlDigit === 0 ? 0 : 11 - controlDigit

    if (!(controlDigit === parseInt(value[12]))) {
        field.report(
            'The {{ field }} number is not valid',
            'EMSO',
            field
        )
    }
}, {
    implicit: true
})
