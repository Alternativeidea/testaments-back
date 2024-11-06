import { User } from '../models/user.js'
import { myRule, notEmptyString, transformEncodedIntegerArray, verifyEmso, transformEncodedStringArray } from './validation.js'
import vine from '@vinejs/vine'

export const registrationSchema = vine.object({
    code: vine.string(),
    gender: vine.string(),
    name: vine.string(),
    lastName: vine.string(),
    phone: vine.string(),
    areaCode: vine.string(),
    emso: vine.string().fixedLength(13).use(verifyEmso()).optional().nullable()
})

export const registrationFirstStepSchema = vine.object({
    email: vine.string().email().toLowerCase(),
    password: vine.string().confirmed(),
    newsletter: vine.boolean().optional(),
    referralId: vine.string().optional().nullable()
})

export const verifyToken = vine.object({
    code: vine.string().jwt()
})

export const resetPasswordSchema = vine.object({
    email: vine.string().email().toLowerCase(),
    code: vine.string(),
    password: vine
        .string()
        .confirmed()
})

export const createAdminSchema = vine.object({
    name: vine.string(),
    lastName: vine.string().optional().nullable(),
    secondLastName: vine.string().optional().nullable(),
    email: vine.string().email(),
    password: vine.string(),
    state: vine.string().optional().nullable(),
    zipcode: vine.string().optional().nullable(),
    street: vine.string().optional().nullable(),
    suburb: vine.string().optional().nullable(),
    telephone: vine.string().mobile().optional().nullable(),
    mobilephone: vine.string().mobile().optional().nullable(),
    membershipId: vine.number().parse(v => v ?? 1),
    roleId: vine.number().parse(v => v ?? 1)
})

export const createSchema = vine.object({
    name: vine.string(),
    lastName: vine.string(),
    secondLastName: vine.string().optional().nullable(),
    email: vine.string().email(),
    password: vine.string(),
    state: vine.string().optional().nullable(),
    zipcode: vine.string().optional().nullable(),
    street: vine.string().optional().nullable(),
    suburb: vine.string().optional().nullable(),
    telephone: vine.string().mobile().optional().nullable(),
    mobilephone: vine.string().mobile().optional().nullable(),
    membershipId: vine.number().parse(v => v ?? 1)
})

export const verifySchema = vine.object({
    name: vine.string().use(notEmptyString()),
    lastName: vine.string().use(notEmptyString()),
    birthdate: vine.date(),
    birthplace: vine.number(),
    countryId: vine.number(),
    address: vine.string().use(notEmptyString()),
    city: vine.string().use(notEmptyString()),
    zipcode: vine.string().use(notEmptyString()),
    career: vine.string().use(notEmptyString())
})

export const updateSchema = vine.object({
    name: vine.string().use(notEmptyString()).optional(),
    lastName: vine.string().optional(),
    secondLastName: vine.string().optional().nullable(),
    state: vine.string().optional(),
    city: vine.string().optional(),
    zipcode: vine.string().optional(),
    street: vine.string().optional(),
    suburb: vine.string().optional(),
    telephone: vine.string().mobile().optional(),
    phone: vine.string().optional(),
    address: vine.string().optional(),
    areaCode: vine.string().optional(),
    mobilephone: vine.string().mobile().optional(),
    password: vine.string().confirmed().optional(),
    membershipId: vine.number().optional(),
    tin: vine.string().optional(),
    career: vine.string().optional(),
    emso: vine.string().optional(),
    countryId: vine.number().optional(),
    birthdate: vine.date({
        formats: {
            utc: true,
            format: 'YYYY-MM-DDTHH:mm:ssZ'
        }
    })
        .transform((value) =>
            Date.parse(value.toISOString(), { zone: 'utc' })
        )
        .optional()
})

export const patchSchema = vine.object({
    status: vine.number().min(User.STATUS.SUSPENDED).max(User.STATUS.DECEASED),
    message: vine.string().optional().nullable(),
    date: vine.date().optional(),
    notifyHeirs: vine.boolean().optional()
})

export const adminFilterSchema = vine.object({
    csv: vine.boolean().parse((v) => v ?? false),
    count: vine.boolean().parse((v) => v ?? false),
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 100),
    membershipId: vine.number().min(1).max(2).optional().nullable(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional()
})

export const contactSChema = vine.object({
    // name: vine.string().use(notEmptyString()),
    subject: vine.string().use(notEmptyString()),
    message: vine.string().use(notEmptyString())
})

export const filterLatersSchema = vine.object({
    offset: vine.number().min(0).parse(v => v ?? 0),
    limit: vine.number().min(-1).parse(v => v ?? 100),
    search: vine.string().optional().nullable(),
    status: vine.string().use(myRule()).transform((value) => transformEncodedIntegerArray(value)).optional(),
    orderBy: vine.string().transform((value) => transformEncodedStringArray(value)).optional(),
    startAt: vine.date().optional().nullable(),
    endAt: vine.date().optional().nullable(),
    payLater: vine.boolean().parse((v) => v ?? false)
})
