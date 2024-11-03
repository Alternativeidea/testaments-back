import Brevo from '@getbrevo/brevo/src/index.js'
import { SUBJECTS, TEMPLATES, sendInterMail } from './base.js'
import { format } from '@formkit/tempo'

export async function sendAddDocumentEmail(user, document) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email: user.email }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        documentName: document.name,
        id: document.id,
        createdAt: format(document.createdAt, 'full', 'sl')
    }
    sendSmtpEmail.templateId = TEMPLATES.DOCUMENT_ADDED
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.DOCUMENT_ADDED
    }
    await sendInterMail(sendSmtpEmail)
    console.log('instance api ended')
}
export async function sendDeleteDocumentEmail(user, document) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email: user.email }
    ]
    sendSmtpEmail.params = {
        name: user.name,
        documentName: document.name,
        id: document.id,
        createdAt: format(document.createdAt, 'full', 'sl')
    }
    sendSmtpEmail.templateId = TEMPLATES.DOCUMENT_DELETE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.DOCUMENT_DELETE
    }
    await sendInterMail(sendSmtpEmail)
    console.log('instance api ended')
}
