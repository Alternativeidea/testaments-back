import Brevo from '@getbrevo/brevo/src/index.js'

export async function sendTransactionalMail(user, body, order, orderId) {
    console.log('instance entering')
    const defaultClient = Brevo.ApiClient.instance
    const apiKey = defaultClient.authentications['api-key']
    apiKey.apiKey = process.env.BREVO_API
    console.log('instance created')
    const apiInstance = new Brevo.TransactionalEmailsApi()
    const sendSmtpEmail = new Brevo.SendSmtpEmail()

    sendSmtpEmail.subject = 'Order Created'
    sendSmtpEmail.htmlContent = '<html><body><h1>Common: This is my first transactional email {{params.parameter}}</h1></body></html>'
    sendSmtpEmail.sender = { name: 'Abrahams', email: 'info@abrahams.com' }
    // sendSmtpEmail.to = [
    //     { email: user.email, name: user.name }
    // ]
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    sendSmtpEmail.templateId = 2
    sendSmtpEmail.replyTo = { email: 'info@abrahams.com', name: 'Abrahams Hand' }
    sendSmtpEmail.headers = { 'Some-Custom-Name': 'unique-id-1234' }
    sendSmtpEmail.params = {
        subject: 'Orden Creada desde Acá',
        parameter: 'My param value Joshep',
        NAME: user.name,
        PRODUCTS2: body,
        total: order,
        orderId
    }
    // PRODUCTS: '<h3><span style="color:red;">hola html</span></html>',
    console.log('instance api call')
    await apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
        console.log('API called successfully. Returned data: ' + data)
    }, function(error) {
        console.error(error)
    })
    console.log('instance api ended')
}
