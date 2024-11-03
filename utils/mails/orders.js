import Brevo from '@getbrevo/brevo/src/index.js'
import { sendInterMail, emailBase, TEMPLATES, SUBJECTS } from './base.js'

export async function orderApproved(email) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Notify Password Changed'
    const content = `<p>Your password was changed successfully<p>
        <p>If you dont recognize this action please contact the Admins</p>`
    sendSmtpEmail.htmlContent = emailBase(content, 'Wellcome')
    sendSmtpEmail.sender = { name: 'Testament.si', email: 'trznica@testament.si' }
    sendSmtpEmail.to = [
        { email },
        { email: 'trznica@testament.si', name: 'Testaments Info' }
    ]
    sendSmtpEmail.replyTo = { email: 'trznica@testament.si', name: 'Testaments Info' }
    await sendInterMail(sendSmtpEmail)
}

export async function orderInterestEmail(user, product) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email: user.email },
        { email: 'trznica@testament.si' }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        product: product.name
    }
    sendSmtpEmail.templateId = TEMPLATES.MARKETPLACE_INTEREST
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.MARKETPLACE_INTEREST
    }
    await sendInterMail(sendSmtpEmail)
}

export async function orderInterestFnishEmail(user, product) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email: user.email },
        { email: 'trznica@testament.si' }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        product: product.name
    }
    sendSmtpEmail.templateId = TEMPLATES.MARKETPLACE_FINISH
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.MARKETPLACE_FINISH
    }
    await sendInterMail(sendSmtpEmail)
}
