import vine from '@vinejs/vine'
import { myRule, notEmptyString, transformEncodedIntegerArray, transformEncodedStringArray } from './validation.js'
import { Product } from '../models/product.js'

export const createSchema = vine.object({
    name: vine.string().use(notEmptyString()),
    description: vine.string().optional().nullable(),
    sku: vine.string().optional().nullable(),
    price: vine.number(),
    picture2: vine.string().optional().nullable(),
    picture3: vine.string().optional().nullable(),
    picture4: vine.string().optional().nullable(),
    picture: vine.string().optional().nullable(),
    stock: vine.number().optional().nullable(),
    categoryId: vine.number().positive(),
    isFeatured: vine.boolean().parse((v) => v ?? false),
    status: vine.number().parse((v) => v ?? Product.STATUS.ACTIVE).optional(),
    characteristics: vine.array(
        vine.object({
            charId: vine.string().optional(),
            text: vine.string().optional(),
            icon: vine.string().optional(),
            name: vine.string().optional()
        })
    ).optional().nullable(),
    publishedAt: vine.date().optional()
})

export const updateSchema = vine.object({
    name: vine.string().use(notEmptyString()).optional(),
    description: vine.string().optional().nullable(),
    sku: vine.string().optional().nullable(),
    price: vine.number().optional().nullable(),
    picture: vine.string().optional().nullable(),
    picture2: vine.string().optional().nullable(),
    picture3: vine.string().optional().nullable(),
    picture4: vine.string().optional().nullable(),
    stock: vine.number().optional().nullable(),
    isFeatured: vine.boolean().optional(),
    categoryId: vine.number().optional(),
    status: vine.number().optional(),
    characteristics: vine.array(
        vine.object({
            charId: vine.string().optional(),
            text: vine.string().optional(),
            icon: vine.string().optional(),
            name: vine.string().optional()
        })).optional(),
    publishedAt: vine.date().optional()
})

export const patchSchema = vine.object({
    name: vine.string().optional(),
    description: vine.string().optional(),
    sku: vine.string().optional(),
    price: vine.number().optional(),
    picture: vine.string().optional(),
    stock: vine.number().optional(),
    isFeatured: vine.boolean().optional(),
    status: vine.number().optional(),
    characteristics: vine.array(
        vine.object({
            charId: vine.string().optional(),
            text: vine.string().optional(),
            icon: vine.string().optional(),
            name: vine.string().optional()
        })).optional()
})

export const filterSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 50),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional()
})
