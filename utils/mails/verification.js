import Brevo from '@getbrevo/brevo/src/index.js'
import { SUBJECTS, TEMPLATES, sendInterMail } from './base.js'

export async function sendVerificationCode(user, code, type) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.to = [
        { email: user }
    ]
    sendSmtpEmail.params = {
        sendTo: `${process.env.FRONT_URL}/registracija/osnovne-informacije?code=${code}`
    }
    sendSmtpEmail.templateId = TEMPLATES.TST_REGISTER_CODE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_REGISTER_CODE
    }
    if (type === 2) {
        sendSmtpEmail.params = {
            sendTo: `${process.env.FRONT_URL}/resetiraj-geslo/new-password?email=${user}&code=${code}`
        }
        sendSmtpEmail.templateId = TEMPLATES.TST_RESET_PASSWORD
        if (process.env.ENVIRONMENT === 'DEV') {
            sendSmtpEmail.subject = SUBJECTS.TST_RESET_PASSWORD
        }
    }
    await sendInterMail(sendSmtpEmail)
    console.log('instance api ended')
}
