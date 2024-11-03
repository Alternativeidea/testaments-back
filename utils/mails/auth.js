import Brevo from '@getbrevo/brevo/src/index.js'
import { sendInterMail, emailBase, TEMPLATES, SUBJECTS } from './base.js'
import { User } from '../../models/user.js'

export async function sendNewIpEmail(user, session) {
    // TODO: for this one i need to block the login until the user verify the session
    const sendSmtpEmail = new Brevo.SendSmtpEmail()

    sendSmtpEmail.subject = 'Potrditev Prijave z Novega Računalnika'
    const content = `
        <p>Spoštovani ${user.name},</p>
        <p>Obveščamo vas, da je bila z vašega računalnika izvedena prijava na vaš račun na Testament.si iz novega kraja ali računalnika.</p>    
        <p>Remote IP = ${session.remoteIp}</p>
        <p>Če imate kakršna koli vprašanja ali potrebujete pomoč, nas lahko vedno kontaktirate na pomoc@testament.si ali <a href="tel:+386000000">040 000 000</a>.</p>
        <p>Hvala za vašo pozornost pri varovanju vašega računa na Testament.si.</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Potrditev Prijave z Novega Računalnika')
    sendSmtpEmail.sender = { name: 'Testament.si', email: 'noreply@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    sendSmtpEmail.replyTo = { email: 'noreply@testaments.si', name: 'Testaments Info' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendChangedPasswordEmail(email, name) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email }
    ]
    sendSmtpEmail.params = {
        name
    }
    sendSmtpEmail.templateId = TEMPLATES.TST_PASSWORD_CHANGE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_PASSWORD_CHANGE
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendNewReferredUserEmail(user, referredId, level, link) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.params = {
        name: user.name,
        referred: referredId,
        level,
        link
    }
    sendSmtpEmail.to = [
        { email: user.email }
    ]
    sendSmtpEmail.templateId = TEMPLATES.AMBASSADOR_NEW_USER
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.AMBASSADOR_NEW_USER
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendWellcomeEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.params = {
        name: user.name
    }
    sendSmtpEmail.templateId = TEMPLATES.TST_WELLCOME
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_WELLCOME
    }
    sendSmtpEmail.to = [
        { email: user.email }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendContactEmail(user, subject) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()

    let email = 'podpora@testament.si'
    let phone = '051 272 100'
    let phoneLink = '+386051272100'
    switch (subject) {
    case 'TST/Zlato':
        email = 'tst@testament.si'
        phone = '041 444 001'
        phoneLink = '+386041444001'
        break
    case 'Tržnica zapuščin':
        email = 'trznica@testament.si'
        break
    case 'Datoteke':
        email = 'oporoke@testament.si'
        break
    case 'Dokumenti':
        email = 'oporoke@testament.si'
        break
    case 'Transakcije':
        email = 'tst@testament.si'
        break
    case 'Oporoke':
        email = 'oporoke@testament.si'
        break
    default:
        email = 'podpora@testament.si'
        break
    }

    sendSmtpEmail.params = {
        name: user.name,
        mail: email,
        mailLink: email,
        phone,
        phoneLink
    }
    sendSmtpEmail.templateId = TEMPLATES.TST_CONTACT_TICKET
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_CONTACT_TICKET
    }
    sendSmtpEmail.sender = { name: 'Testament.si', email }
    const sendTo = email
    sendSmtpEmail.to = [
        { email: user.email },
        { email: sendTo }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendStatusEmail(user, status) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.params = {
        name: user.name
    }

    if (status === User.STATUS.SUSPENDED) {
        if (process.env.ENVIRONMENT === 'DEV') {
            sendSmtpEmail.subject = SUBJECTS.ADMIN_SUSPEND_USER
        }
        sendSmtpEmail.templateId = TEMPLATES.ADMIN_SUSPEND_USER
    } else if (status === User.STATUS.DELETED) {
        if (process.env.ENVIRONMENT === 'DEV') {
            sendSmtpEmail.subject = SUBJECTS.ADMIN_DELETE_USER
        }
        sendSmtpEmail.templateId = TEMPLATES.ADMIN_DELETE_USER
    } else if (status === User.STATUS.ACTIVE) {
        if (process.env.ENVIRONMENT === 'DEV') {
            sendSmtpEmail.subject = SUBJECTS.ADMIN_REACTIVATE_USER
        }
        sendSmtpEmail.templateId = TEMPLATES.ADMIN_REACTIVATE_USER
    }

    sendSmtpEmail.to = [
        { email: user.email }, { email: 'info@testament.si' }
    ]
    await sendInterMail(sendSmtpEmail)
}
