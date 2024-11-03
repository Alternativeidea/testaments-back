import Brevo from '@getbrevo/brevo/src/index.js'

export async function sendInterMail(emailOptions) {
    const defaultClient = Brevo.ApiClient.instance
    const apiKey = defaultClient.authentications['api-key']
    apiKey.apiKey = process.env.BREVO_API
    const apiInstance = new Brevo.TransactionalEmailsApi()
    if (process.env.PRODUCTION === 'true') {
        await apiInstance.sendTransacEmail(emailOptions).then(function(data) {
            console.log('API called successfully. Returned data: ' + data)
            console.log(data)
        }, function(error) {
            console.error(error)
        })
    } else {
        console.log('API Called ok, Email not sent cause you are in PRODUCTION False')
    }
}

export function emailBase(content, title = 'Notify') {
    const emailBase = `
        <html>
            <style>
                .btn {
                    background-color: black;
                    color: white;
                    padding: 8px 16px;
                    font-weight: bold;
                    text-decoration: none;
                }
            </style>
            <body>
            <div>
                ${content}
                <br>
                <p>Lep pozdrav</p> 
                <p>Ekipa Testament.si</p>
                <p>Testament d.o.o.</p>
                <p>Deteljica 8</p>
                <p>4290 Tržič</p>
            </div>
            </body>
        </html>`
    return emailBase
}

export const TEMPLATES = {
    TST_REGISTER_CODE: 1,
    TST_WELLCOME: 2,
    TST_RESET_PASSWORD: 6,
    TST_PURCHASE: 3,
    TST_SEND_TO_USER: 4,
    TST_SEND_TO_USER_APPROVE: 5,
    TST_SEND_TO_USER_RECEIVER: 11,
    TST_PASSWORD_CHANGE: 7,
    TST_PURCHASE_ACCEPTED: 8,
    TST_SELL: 9,
    TST_SELL_ACCEPTED: 10,
    TST_CONTACT_TICKET: 12,
    TST_CONTACT_HEIRS: 13,
    TST_NEW_WILL: 14,
    TST_SEND_TO_USER_TANK_YOU: 15,
    TST_WITHDRAW_ACCEPTED: 18,
    TST_WITHDRAW_DENIED: 19,
    MARKETPLACE_INTEREST: 20,
    MARKETPLACE_FINISH: 33,
    TST_PREMIUM_NOTICE: 22,
    AMBASSADOR_NEW_USER: 23,
    WITHDRAW_SEND_CODE: 28,
    ADMIN_DELETE_USER: 29,
    ADMIN_SUSPEND_USER: 30,
    ADMIN_REACTIVATE_USER: 31,
    DOCUMENT_ADDED: 35,
    DOCUMENT_DELETE: 36,
    WILL_DELETE: 39,
    WILL_EDIT: 40
}

export const SUBJECTS = {
    TST_REGISTER_CODE: 'DEV - Potrditev vašega E-poštnega naslova na Testament.si',
    TST_WELLCOME: 'DEV - Dobrodošli na Testament.si!',
    TST_RESET_PASSWORD: 'DEV - Ponastavite svoje geslo',
    TST_PURCHASE: 'DEV - Potrditev povpraševanja za nakup testamentov (TST)',
    TST_SEND_TO_USER: 'DEV - Potrditev pošiljanja TST na Testament.si',
    TST_SEND_TO_USER_APPROVE: 'DEV - Potrditev poslane TST transakcije',
    TST_SEND_TO_USER_RECEIVER: 'DEV - Potrditev poslane TST transakcije',
    TST_PASSWORD_CHANGE: 'DEV - Potrditev spremembe gesla',
    TST_PURCHASE_ACCEPTED: 'DEV - Potrditev nakupa zlata (TST)',
    TST_SELL: 'DEV - Uspešna oddaja formularja za vračilo testamentov',
    TST_SELL_ACCEPTED: 'DEV - Potrjen odkup zlata (TST)',
    TST_CONTACT_TICKET: 'DEV - Prejeli smo Vaše povpraševanje',
    TST_CONTACT_HEIRS: 'DEV - Pomembno obvestilo v zvezi s preminulim članom vaše družine',
    TST_NEW_WILL: 'DEV - Potrditev Urejanja in Shranjevanja Vaše Oporoke na Testament.si',
    TST_SEND_TO_USER_TANK_YOU: 'DEV - Vaš zahtevek je oddan!',
    TST_WITHDRAW_ACCEPTED: 'DEV - Potrditev izplačila - Sredstva na poti',
    TST_WITHDRAW_DENIED: 'DEV - Obvestilo o zavrnitvi izplačila - Preverite podrobnosti',
    MARKETPLACE_INTEREST: 'DEV - Potrditev zanimanja za izdelek na tržnici zapuščin',
    TST_PREMIUM_NOTICE: 'DEV - Čestitke! Postali ste Premium član Testament.si – Odklenili ste dostop do vseh ugodnosti',
    AMBASSADOR_NEW_USER: 'DEV - Čestitke! Pridobili ste novega člana v svoji strukturi',
    WITHDRAW_SEND_CODE: 'DEV - Potrditev zahteve za izplačilo',
    ADMIN_DELETE_USER: 'DEV - Obvestilo o izbrisu vašega računa iz sistema Testament.si',
    ADMIN_SUSPEND_USER: 'DEV - Obvestilo o začasni suspenziji vašega računa v sistemu Testament.si',
    ADMIN_REACTIVATE_USER: 'DEV - Obvestilo o ponovni aktivaciji vašega računa v sistemu Testament.si',
    MARKETPLACE_FINISH: 'DEV - Zaključek postopka za izdelek na tržnici zapuščin',
    DOCUMENT_ADDED: 'DEV - Obvestilo o naloženem dokumentu v vaši spletni pisarni',
    DOCUMENT_DELETE: 'DEV - Obvestilo o odstranitvi dokumenta v vaši spletni pisarni',
    WILL_DELETE: 'DEV - Zahtevek za Izbris Oporoke Prejet',
    WILL_EDIT: 'DEV - Zahtevek za Izbris Oporoke Prejet'
}

// export const TEMPLATES = {
//     TST_REGISTER_CODE: 4,
//     TST_WELLCOME: 6,
//     TST_RESET_PASSWORD: 5,
//     TST_PURCHASE: 7,
//     TST_SEND_TO_USER: 8,
//     TST_SEND_TO_USER_APPROVE: 9
// }
