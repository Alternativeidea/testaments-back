const GENERAL_STATUS = {
    ENABLED: 1,
    DISABLED: 0
}

const VIDEO = {
    TYPE: {
        COMPRESS: 0,
        LIVE: 1,
        EMBEDDED: 1
    },
    CONTENT: {
        DRAFT: 0,
        LOOSE: 0,
        LECTURE: 1,
        WORKSHOP: 2
    }
    // ? NAMING CONVENTION
    // ? clip_{video_id}_{10 number padding}_{quality}.extension
}

const CLIP = {
    STATUS: {
        LOOSE: 0,
        ASSIGNED: 1
    },
    QUALITY: {
        NORMAL: 0,
        HD: 1,
        HQ: 2
    },
    LABEL: {
        NORMAL: 'NORMAL',
        HD: 'HD',
        HQ: 'HQ'
    }
}

const USER = {
    ROLE: {
        NORMAL: 0,
        ADMIN: 1
    },
    TYPES: {
        VOD: 0,
        STUDENT: 1,
        TEACHER: 2
    }
}

const MARITAL_STATUS = [
    {
        name: 'Never Married'
    },
    {
        name: 'Married'
    },
    {
        name: 'Divorced'
    },
    {
        name: 'Separated'
    },
    {
        name: 'Widowed'
    }
]

export {
    GENERAL_STATUS,
    MARITAL_STATUS,
    CLIP,
    VIDEO,
    USER
}
