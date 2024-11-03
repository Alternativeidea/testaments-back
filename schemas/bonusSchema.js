import vine from '@vinejs/vine'

export const filterDataBonus = vine.object({
    type: vine.enum(['all', 'memberships', 'tst']).parse((v) => v ?? 'all'),
    level: vine.enum(['all', 'direct', 'indirects']).parse((v) => v ?? 'all')
})
