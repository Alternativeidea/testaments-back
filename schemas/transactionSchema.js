import vine from '@vinejs/vine'
import { myRule, notEmptyString, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import { Transaction } from '../models/transaction.js'

export const createSchema = vine.object({
    name: vine.string().use(notEmptyString()),
    description: vine.string().optional().nullable(),
    sku: vine.string().optional().nullable(),
    price: vine.number().min(0),
    picture: vine.string().optional().nullable(),
    stock: vine.number().optional().nullable(),
    categories: vine.array(vine.number()).optional().nullable()
})

export const updateSchema = vine.object({
    status: vine.number().min(Transaction.STATUS.ACTIVE),
    paymentMethod: vine.string().optional().nullable(),
    notes: vine.string().optional().nullable()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    userId: vine.number().optional().nullable(),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable()
})

export const filterTSTSchema = vine.object({
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable(),
    type: vine.enum(['buys', 'sells', 'shared']).optional().nullable()
})
