import Brevo from '@getbrevo/brevo/src/index.js'
import { sendInterMail, SUBJECTS, TEMPLATES } from './base.js'
import { format } from '@formkit/tempo'

export async function sendTSTToUserEmail(user, code) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SEND_TO_USER
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SEND_TO_USER
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        sendTo: `${process.env.FRONT_URL}/namizje/tst?code=${code}`
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendTSTToUserApprovedEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SEND_TO_USER_APPROVE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SEND_TO_USER_APPROVE
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        reference: transaction.reference,
        toName: transaction.to.name,
        toEmail: transaction.to.email,
        quantity: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        updatedAt: format(transaction.updatedAt, 'full', 'sl')
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendTSTToUserRecivedEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SEND_TO_USER_RECEIVER
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SEND_TO_USER_RECEIVER
    }
    sendSmtpEmail.to = [
        { email: transaction.to.email, name: transaction.to.name }
    ]
    sendSmtpEmail.params = {
        name: transaction.to.name,
        fromUser: user.name,
        reference: transaction.reference,
        quantity: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        updatedAt: format(transaction.updatedAt, 'full', 'sl')
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendTSTPurchaseEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_PURCHASE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_PURCHASE
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'tst@testament.si' }
    ]
    const totalNumber = Math.abs(parseFloat(transaction.total))
    sendSmtpEmail.params = {
        name: user.name,
        reference: transaction.reference,
        total: totalNumber.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        quantity: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        grams: transaction.quantity.toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    }
    await sendInterMail(sendSmtpEmail)
}

export async function sendTSTSellEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SELL
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SELL
    }
    sendSmtpEmail.params = {
        name: user.name,
        reference: transaction.reference
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'tst@testament.si' }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendTSTTankyou(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SEND_TO_USER_TANK_YOU
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SEND_TO_USER_TANK_YOU
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendApprovedTSTPurchaseEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_PURCHASE_ACCEPTED
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_PURCHASE_ACCEPTED
    }
    sendSmtpEmail.params = {
        name: user.name,
        reference: transaction.reference,
        grams: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        quantity: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        createdAt: format(transaction.createdAt, 'full', 'sl'),
        updatedAt: format(transaction.updatedAt, 'full', 'sl')
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendApprovedTSTSellEmail(user, transaction) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_SELL_ACCEPTED
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_SELL_ACCEPTED
    }
    sendSmtpEmail.params = {
        name: user.name,
        reference: transaction.reference,
        quantity: parseFloat(transaction.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        updatedAt: format(transaction.updatedAt, 'full', 'sl')
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendApprovedWithdrawEmail(user, withdraw) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_WITHDRAW_ACCEPTED
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_WITHDRAW_ACCEPTED
    }
    sendSmtpEmail.params = {
        name: user.name,
        reference: withdraw.id,
        quantity: parseFloat(withdraw.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR',
        createdAt: format(withdraw.updatedAt, 'full', 'sl'),
        updatedAt: format(withdraw.updatedAt, 'full', 'sl'),
        account: `**** **** **** **** ${withdraw.number.substr(withdraw.number.length - 3)}`
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendCodeWithdrawEmail(user, withdraw, code) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.WITHDRAW_SEND_CODE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.WITHDRAW_SEND_CODE
    }
    sendSmtpEmail.params = {
        name: user.name,
        id: withdraw.id,
        amount: Number(withdraw.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR',
        date: format(withdraw.createdAt, 'full', 'sl'),
        account: `**** **** **** **** ${withdraw.number.substr(withdraw.number.length - 3)}`,
        link: `${process.env.FRONT_URL}/namizje/tst-svetovalec?id=${withdraw.id}&code=${code}&tab=izplacila`
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendDeniedWithdrawEmail(user, withdraw) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_WITHDRAW_DENIED
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_WITHDRAW_DENIED
    }
    sendSmtpEmail.params = {
        name: user.name,
        reference: withdraw.id,
        quantity: parseFloat(withdraw.quantity).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'EUR',
        createdAt: format(withdraw.createdAt, 'full', 'sl'),
        updatedAt: format(withdraw.updatedAt, 'full', 'sl'),
        reason: withdraw.reason,
        account: `**** **** **** **** ${withdraw.number.substr(withdraw.number.length - 3)}`
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendPremiumNoticeAttachment(user, attachment) {
    // console.log('link invoice ', invoiceUrl)
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_PREMIUM_NOTICE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_PREMIUM_NOTICE
    }
    sendSmtpEmail.params = {
        link: process.env.FRONT_URL,
        name: user.name
    }
    sendSmtpEmail.attachment = [
        {
            name: attachment.AttachmentFileName,
            content: attachment.AttachmentData
        }
    ]
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendPremiumNotice(user, invoiceUrl = `${process.env.FRONT_URL}`) {
    console.log('link invoice ', invoiceUrl)
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_PREMIUM_NOTICE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_PREMIUM_NOTICE
    }
    sendSmtpEmail.params = {
        link: invoiceUrl,
        name: user.name
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}
