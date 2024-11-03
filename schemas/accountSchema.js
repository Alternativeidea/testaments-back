import vine from '@vinejs/vine'

export const createSchema = vine.object({
    name: vine.string(),
    address: vine.string().optional().nullable(),
    number: vine.string(),
    swift: vine.string(),
    company: vine.string().optional().nullable(),
    companyAddress: vine.string().optional().nullable(),
    companyTin: vine.string().optional().nullable(),
    type: vine.number().parse((v) => v ?? 1)
})

export const updateSchema = vine.object({
    name: vine.string().optional(),
    address: vine.string().optional(),
    number: vine.string().optional(),
    swift: vine.string().optional(),
    company: vine.string().optional().nullable(),
    companyAddress: vine.string().optional().nullable(),
    companyTin: vine.string().optional().nullable()
})
