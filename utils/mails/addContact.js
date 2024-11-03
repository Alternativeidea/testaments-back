import Brevo from '@getbrevo/brevo/src/index.js'

export async function addContact(user) {
    const defaultClient = Brevo.ApiClient.instance
    const apiInstance = new Brevo.ContactsApi()
    const apiKey = defaultClient.authentications['api-key']
    // const apiKey = apiInstance.authentications.apiKey

    apiKey.apiKey = process.env.BREVO_API

    const createContact = new Brevo.CreateContact()

    let status = 'FREE'
    if (user.membershipId === 2) {
        status = 'PREMIUM'
    }

    createContact.email = user.email
    createContact.listIds = [5]
    createContact.updateEnabled = true
    createContact.attributes = {
        NAME: user.name,
        FIRSTNAME: user.name,
        SURNAME: user.lastName,
        LASTNAME: user.lastName,
        EMAIL: user.email,
        ID: user.id,
        STATUS: status,
        SVETOVALEC: user.isAmbassador
    }

    await apiInstance.createContact(createContact).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data))
    }, function(error) {
        console.error(error)
    })
}
