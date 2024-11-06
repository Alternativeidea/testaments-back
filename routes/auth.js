import express from 'express'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { User } from '../models/user.js'
import bcrypt from 'bcryptjs'
import isAuth from '../middlewares/isAuth.js'
import isAuthTemp from '../middlewares/isAuthTemp.js'
import { HttpError } from 'http-errors-enhanced'
import { httpErrors, makeATeaPot } from '../utils/httpErrors.js'
import jwt from 'jsonwebtoken'
import { registrationFirstStepSchema, registrationSchema, resetPasswordSchema, verifyToken } from '../schemas/userSchema.js'
import { getConnection } from '../config/database.js'
import vine, { errors } from '@vinejs/vine'
import { Code } from '../models/code.js'
import { sendVerificationCode } from '../utils/mails/verification.js'
import { Session } from '../models/sessions.js'
import { Newsletter } from '../models/newsletter.js'
import { sendChangedPasswordEmail, sendNewReferredUserEmail, sendWellcomeEmail } from '../utils/mails/auth.js'
import { Role } from '../models/role.js'
import { Account } from '../models/account.js'
import ShortUniqueId from 'short-unique-id'
import { addDay } from '@formkit/tempo'
import { addContact } from '../utils/mails/addContact.js'

async function verifyPassword(password, comparePassword) {
    return await bcrypt.compare(password, comparePassword)
}

passport.use(new LocalStrategy({ usernameField: 'email' }, async function verify(username, password, cb) {
    const user = await User.scope('withPassword').findOne({
        where: { email: username }
    })
    if (!user) {
        return cb(null, false, { message: 'Incorrect username or password. 1001' })
    }
    if (user.status === User.STATUS.DELETED) {
        return cb(null, false, { message: 'This User has been deactivated from the system. 1003' })
    }
    if (user.status === User.STATUS.SUSPENDED) {
        return cb(null, false, { message: 'This User has been suspended from the system. 1004' })
    }

    if (!(await verifyPassword(password, user.password))) {
        // throw { message: 'Wrong password', error_code: 400 }
        return cb(null, false, { message: 'Incorrect username or password. 1002' })
    }
    let token = null
    if (user.emailVerifiedAt === null) {
        token = jwt.sign(user.toJSON(), process.env.SECRET_TEMP, { expiresIn: '5h' })
    } else {
        token = jwt.sign(user.toJSON(), process.env.SECRET, { expiresIn: '5h' })
    }
    user.setDataValue('token', token)
    user.setDataValue('password', null)
    return cb(null, user)
}))

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        // cb(null, { id: user.id, username: user.username });
        cb(null, { user })
    })
})

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user)
    })
})

const router = express.Router()

router.get('/test-auth', function (req, res, next) {
    res.send({ hello: 'from auth' })
})

router.post('/login', function(req, res, next) {
    passport.authenticate('local', async function(err, user, info) {
        if (err) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    'Somehing was wrong on login',
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Login Error',
                        code_: 400
                    })
            )// will generate a 500 error
        }
        // Generate a JSON response reflecting signup
        if (!user) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST.error_code,
                    info.message,
                    {
                        ...httpErrors.BAD_REQUEST,
                        type: 'Login Error',
                        code_: 400
                    })
            )
        }
        if (user.emailVerifiedAt === null) {
            return res.status(206).send(user)
        }
        let session = await Session.findOne({
            where: {
                remoteIp: req.ip,
                userId: user.id
            }
        })
        if (!session) {
            session = await Session.create({
                agent: req.get('user-agent') ?? 'Not user agent found',
                remoteIp: req.ip,
                userId: user.id
            })
            // await sendNewIpEmail(user, session)
        } else {
            session.lastLogin = Date()
            session.save()
        }
        if (user.membershipId === 1 && user.balance > 0 && user.suspensionDate === null) {
            await User.update({
                suspensionDate: addDay(new Date(), 30)
            },
            {
                where: {
                    id: user.id
                }
            })
        }
        if (user.membershipId === 2 && user.suspensionDate !== null) {
            await User.update({
                suspensionDate: null
            },
            {
                where: {
                    id: user.id
                }
            })
        }
        user.setDataValue('session', session)
        return res.send(user)
    })(req, res, next)
})

router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
    })
})

router.post('/send-verification-code', isAuthTemp, async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const sendVerificationSchema = vine.object({
        type: vine.number().min(1).max(2).parse(v => v ?? Code.TYPES.REGISTRATION)
    })
    let output = null
    try {
        output = await vine.validate({
            schema: sendVerificationSchema,
            data: req.body
        })
    } catch (error) {
        console.log(error)
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
    }
    const connection = await getConnection()
    const transaction = await connection.transaction()

    let result = null
    try {
        // Send the verification code in here
        const token = jwt.sign({ email: req.user.email }, process.env.SECRET_MAILS, { expiresIn: 1200 })
        if (output.type === Code.TYPES.RESET_PASSWORD) {
            const user = await User.findOne({
                where: {
                    email: req.user.email
                }
            })
            if (!user) {
                await transaction.rollback()
                return next(
                    new HttpError(
                        httpErrors.NOT_FOUND.error_code,
                        'Verification',
                        {
                            ...httpErrors.NOT_FOUND,
                            type: httpErrors.NOT_FOUND.message,
                            details: null
                        })
                )
            }
        }
        result = await Code.create({
            code: token,
            email: req.user.email,
            type: output.type
        })
        if (process.env.ENVIRONMENT !== 'DEV') {
            result.setDataValue('code', null)
        }
        await sendVerificationCode(req.user.email, token, result.type)
    } catch (error) {
        console.log(error)
        await transaction.rollback()
    }
    return res.send(result)
})

router.post('/register-first-step', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    let output = null
    try {
        output = await vine.validate({
            schema: registrationFirstStepSchema,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Verification',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }
    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        if (output.newsletter) {
            await Newsletter.create({
                email: output.email
            }, { transaction })
        }
        output.uplineId = null
        output.level = 1
        let hierarchy = ''
        let referralUser
        if (req.query.referralLink) {
            referralUser = await User.findOne({
                where: {
                    referralLink: req.query.referralLink
                }
            }, { transaction })
            if (referralUser) {
                output.uplineId = referralUser.id
                output.level = referralUser.level + 1
                hierarchy = referralUser.hierarchy
            }
        }
        const user = await User.create(output, { transaction })
        user.set({
            hierarchy: hierarchy.length > 0 ? `${hierarchy}.${user.id}` : user.id
        })
        await user.save({ transaction })
        // ? sign the token with different secret
        const code = jwt.sign(output, process.env.SECRET_MAILS, { expiresIn: 1200 })
        const token = jwt.sign(user.toJSON(), process.env.SECRET_TEMP, { expiresIn: 1200 })
        await Code.create({
            code,
            email: output.email,
            type: Code.TYPES.REGISTRATION
        }, { transaction })

        await transaction.commit()
        if (process.env.DEVELOPMENT !== 'DEV') {
            user.setDataValue('code', null)
        }
        await addContact(user)
        await sendVerificationCode(output.email, code, Code.TYPES.REGISTRATION)
        const response = await User.findByPk(user.id)
        response.setDataValue('code', code)
        response.setDataValue('token', token)

        return res.send(response)
    } catch (err) {
        console.log(err)
        await transaction.rollback()
        if (err.name === 'SequelizeUniqueConstraintError') {
            if (err.errors[0].path === 'email') {
                return next(
                    new HttpError(
                        httpErrors.UNIQUE_CONSTRAINT.error_code,
                        'E-poštni naslov že obstaja',
                        {
                            ...httpErrors.UNIQUE_CONSTRAINT,
                            type: 'E-poštni naslov že obstaja',
                            details: err
                        })
                )
            }
            return next(
                new HttpError(
                    httpErrors.UNIQUE_CONSTRAINT.error_code,
                    'Unique constraint',
                    {
                        ...httpErrors.UNIQUE_CONSTRAINT,
                        type: 'Unique constraint',
                        details: err
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Something happend from devs :c',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Something happend from devs :c',
                    details: err
                })
        )
    }
})

router.post('/register', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const body = req.body

    let output = {}
    let code = null
    try {
        output = await vine.validate({
            schema: registrationSchema,
            data: body
        })
        code = await Code.findOne({
            where: {
                code: output.code
            }
        })

        if (!code) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Verification',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: httpErrors.NOT_FOUND.message
                    })
            )
        }
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Verification',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }

    const connection = await getConnection()
    const transaction = await connection.transaction()

    try {
        const user = await User.findOne({
            where: {
                email: code.email
            },
            transaction
        })

        if (!user) {
            return next(
                makeATeaPot({ message: 'Sorry either the User email does not longer exists or code has expired' })
            )
        }

        const uid = new ShortUniqueId({ length: 10 })

        const setObject = {
            ...output,
            status: User.STATUS.ACTIVE,
            membershipId: 1,
            roleId: 1,
            referralLink: uid.rnd(),
            emailVerifiedAt: new Date()
        }

        user.set(setObject, { transaction })
        await user.save({ transaction })

        await transaction.commit()
        const token = jwt.sign(user.toJSON(), process.env.SECRET, { expiresIn: 1200 })

        await sendWellcomeEmail(user)

        if (user.uplineId) {
            const referralUser = await User.findOne({
                where: {
                    id: user.uplineId
                }
            })
            if (referralUser && referralUser.isAmbassador) {
                await sendNewReferredUserEmail(
                    referralUser,
                    user.id, 1,
                    `${process.env.FRONT_URL}/namizje/tst-svetovalec`)
                if (referralUser.uplineId) {
                    const firstLevel = await User.findByPk(referralUser.uplineId)
                    if (firstLevel) {
                        await sendNewReferredUserEmail(
                            firstLevel,
                            user.id, 2,
                            `${process.env.FRONT_URL}/namizje/tst-svetovalec`)
                    }
                }
            }
        }

        user.setDataValue('token', token)
        return res.send(user)
    } catch (err) {
        await transaction.rollback()
        if (err.name === 'SequelizeUniqueConstraintError') {
            if (err.errors[0].path === 'email') {
                return next(
                    new HttpError(
                        httpErrors.UNIQUE_CONSTRAINT.error_code,
                        ' E-poštni naslov že obstaja',
                        {
                            ...httpErrors.UNIQUE_CONSTRAINT,
                            type: ' E-poštni naslov že obstaja',
                            details: err
                        })
                )
            }
            return next(
                new HttpError(
                    httpErrors.UNIQUE_CONSTRAINT.error_code,
                    'Unique constraint',
                    {
                        ...httpErrors.UNIQUE_CONSTRAINT,
                        type: 'Unique constraint',
                        details: err
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Something happend from devs :c',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: 'Something happend from devs :c',
                    details: err
                })
        )
    }
})

router.post('/reset-password-send-code', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const sendVerificationSchema = vine.object({
        email: vine.string().email()
    })
    let output = null
    try {
        output = await vine.validate({
            schema: sendVerificationSchema,
            data: req.body
        })
    } catch (error) {
        console.log(error)
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
    }
    let result = null
    try {
        // Send the verification code in here
        const user = await User.findOne({
            where: {
                email: output.email
            }
        })
        if (!user) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Verification',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: httpErrors.NOT_FOUND.message,
                        details: null
                    })
            )
        }
        const token = jwt.sign({ email: user.email }, process.env.SECRET_MAILS, { expiresIn: 1200 })
        result = await Code.create({
            code: token,
            email: user.email,
            type: Code.TYPES.RESET_PASSWORD
        })
        if (process.env.ENVIRONMENT !== 'DEV') {
            result.setDataValue('code', null)
        }
        await sendVerificationCode(user.email, token, result.type)
    } catch (error) {
        console.log(error)
        return next(
            makeATeaPot(error)
        )
    }
    return res.send(result)
})

router.patch('/reset-password', async function(req, res, next) {
    vine.convertEmptyStringsToNull = true
    const body = req.body

    let output = {}
    try {
        output = await vine.validate({
            schema: resetPasswordSchema,
            data: body
        })
        const code = await Code.findOne({
            where: {
                code: output.code,
                type: Code.TYPES.RESET_PASSWORD
            }
        })

        if (!code) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Verification',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: httpErrors.NOT_FOUND.message
                    })
            )
        }
        if (code.email !== output.email) {
            // There must be the same email in the code token
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Verification email',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: 'This email is not recognized for this code'
                    })
            )
        }
        await User.update({ password: output.password }, {
            where: {
                email: output.email
            }
        })
        const user = await User.findOne({
            attributes: ['name'],
            where: {
                email: output.email
            }
        })
        await sendChangedPasswordEmail(output.email, user.name)
        return res.send({ changed: true })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Verification',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }
})

router.patch('/change-email', isAuthTemp, async function(req, res, next) {
    const changeEmail = vine.object({
        email: vine.string().email().toLowerCase().notIn([req.user.email])
    })

    let output = {}
    const connection = await getConnection()
    const transaction = await connection.transaction()
    try {
        output = await vine.validate({
            schema: changeEmail,
            data: req.body
        })
        await User.update({ email: output.email }, {
            where: {
                id: req.user.id
            },
            transaction
        })
        const user = await User.findByPk(req.user.id, { transaction })
        const code = jwt.sign(output, process.env.SECRET_MAILS, { expiresIn: 1200 })
        const token = jwt.sign(user.toJSON(), process.env.SECRET_TEMP, { expiresIn: 1200 })
        const result = await Code.create({
            code,
            email: output.email,
            type: Code.TYPES.REGISTRATION
        }, { transaction })
        user.setDataValue('code', code)
        user.setDataValue('token', token)
        await transaction.commit()
        if (process.env.ENVIRONMENT !== 'DEV') {
            user.setDataValue('code', null)
        }
        await sendVerificationCode(output.email, code, result.type)
        return res.send(user)
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Email not valid, must not be the same as before',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Error from the devs :(',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }
})

router.post('/verify-registration-code', isAuthTemp, async function(req, res, next) {
    let output = null
    try {
        output = await vine.validate({
            schema: verifyToken,
            data: req.body
        })
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
            return next(
                new HttpError(
                    httpErrors.BAD_REQUEST_VALIDATION.error_code,
                    'Verification',
                    {
                        ...httpErrors.BAD_REQUEST_VALIDATION,
                        type: httpErrors.BAD_REQUEST_VALIDATION.message,
                        details: error.messages
                    })
            )
        }
        return next(
            new HttpError(
                httpErrors.SOMETHING_HAPPEND.error_code,
                'Verification',
                {
                    ...httpErrors.SOMETHING_HAPPEND,
                    type: httpErrors.SOMETHING_HAPPEND.message,
                    details: { ...error }
                })
        )
    }
    try {
        const code = await Code.findOne({
            where: {
                code: output.code,
                email: req.user.email
            }
        })

        if (!code) {
            return next(
                new HttpError(
                    httpErrors.NOT_FOUND.error_code,
                    'Verification',
                    {
                        ...httpErrors.NOT_FOUND,
                        type: httpErrors.NOT_FOUND.message
                    })
            )
        }
        jwt.verify(output.code, process.env.SECRET_MAILS)
        return res.send({ valid: true })
    } catch (error) {
        return next(
            new HttpError(
                httpErrors.CODE_EXPIRED.error_code,
                'NOT Valid Code',
                {
                    ...httpErrors.CODE_EXPIRED,
                    type: 'Code Error, This token is not longer valid',
                    details: { ...error }
                })
        )
    }
})

router.get('/profile', isAuth, async (req, res, next) => {
    const include = []
    const role = await Role.findOne({ where: { name: 'ambassador' } })
    if (req.user.roleId === role.id) {
        include.push({
            model: Account,
            as: 'accounts'
        })
    }
    console.log('TST called profile')
    const result = await User.findByPk(req.user.id, {
        include
    })
    return res.send(result)
})

router.get('/reset', isAuth, async (req, res, next) => {
    const user = await User.findByPk(req.user.id)
    // return res.send(req.query)
    if (req.query.level === 'one') {
        user.isAmbassador = false
    }
    if (req.query.level === 'two') {
        user.agreeAmbassador = null
    }
    if (req.query.level === 'three') {
        user.isAmbassador = false
        user.agreeAmbassador = null
    }
    await user.save()
    return res.send(user)
})

export default router
