import vine from '@vinejs/vine'
import { myRule, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import { Order } from '../models/order.js'

export const createSchema = vine.object({
    products: vine.array(
        vine.object({
            id: vine.number(),
            quantity: vine.number()
        })
    )
})

export const updateSchema = vine.object({
    status: vine.number().positive().min(Order.STATUS.PENDING)
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})
