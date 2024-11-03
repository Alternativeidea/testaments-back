import { myRule, transformEncodedIntegerArray } from './validation.js'
import vine from '@vinejs/vine'

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    start: vine.date().before('today').optional().nullable(),
    end: vine.date().afterField('start').optional().nullable(),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})

export const graphSchema = vine.object({
    period: vine.enum(['today', 'week', 'month', 'six', 'year', 'five']),
    price: vine.enum(['buy', 'sell']).parse(v => v ?? 'buy')
})

export const adminUpdateSchema = vine.object({
    type: vine.enum(['buy', 'sell']),
    rate: vine.number()
})
