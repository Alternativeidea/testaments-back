import Brevo from '@getbrevo/brevo/src/index.js'
import { sendInterMail, emailBase, TEMPLATES, SUBJECTS } from './base.js'
import { format } from '@formkit/tempo'

// TODO: All this emails must have the will request, or the will?
export async function sendNewWillRequestEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Potrditev Oddaje Digitalne Oporoke na Testament.si'
    const content = `<p>Spoštovani ${user.name},</p>
        <p>Hvala, ker ste oddali obrazec za digitalno oporoko na naši platformi Testament.si. Vaša zahteva je bila uspešno sprejeta.</p>
        <p>V priponki k temu sporočilu vam pošiljamo kopijo vašega obrazca za digitalno oporoko. Prosimo, da kopijo obrazca shranite in jo imate pripravljeno za naš sestanek.</p>
        <p>Zaradi pravne formalnosti se mora oporoka lastnoročno spisati. V roku enega delovnega tedna vas bomo kontaktirali po telefonu, da se dogovorimo za sestanek, na katerem boste to lahko storili. Na sestanku vam bomo zagotovili vse potrebne informacije in navodila za nadaljnje korake.</p>
        <p>Če imate kakršna koli vprašanja ali potrebujete dodatne informacije, nas lahko kontaktirate na oporoke@testament.si ali <a href="tel:+386000000">040 000 000</a>. Naša ekipa vam bo z veseljem pomagala.</p>
        <p>Hvala, ker ste izbrali Testament.si za urejanje vaše oporoke.</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Potrditev Oddaje Digitalne Oporoke na Testament.si')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}
export async function sendRemoveWillRequestEmail(user) {
}
export async function sendEditWillRequestEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Sestanek za Spremembo Oporoke'
    const content = `<p>Spoštovani ${user.name},</p>
        <p>Hvala za vaš nedavni zahtevek za spremembo vaše digitalne oporoke na naši platformi Testament.si. Zabeležili smo vaše želene spremembe in smo pripravljeni nadaljevati z naslednjim korakom postopka.</p>
        <p>V priponki k temu sporočilu vam pošiljamo kopijo dokumenta - zahtevka za spremembo digitalne oporoke. Prosimo, da kopijo dokumenta shranite in jo imate pripravljeno za naš sestanek.</p>
        <p>Kot ste verjetno že seznanjeni, za pravno-formalno veljavnost mora biti oporoka lastnoročno spisana. Zato vas bomo kmalu kontaktirali po telefonu, da se dogovorimo za sestanek, na katerem boste lahko spisali novo verzijo vaše oporoke.</p>
        <p>Prosimo vas, da v naslednjih dneh pričakujete klic od naše ekipe. Na sestanku vam bomo zagotovili vse potrebne informacije in podporo, da bo vaša nova oporoka ustrezno spisana in formalno veljavna.</p>
        <p>Če imate medtem kakršna koli vprašanja ali skrbi, nas prosimo kontaktirajte na oporoke@testament.si ali <a href="tel:+386000000">040 000 000</a>. Naša ekipa je tu, da vam pomaga in odgovori na vaša vprašanja.</p>
        <p>Hvala za vaše zaupanje v Testament.si.</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Sestanek za Spremembo Oporoke')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

// TODO: Here the document and the delete confirmation is needed also on [POTRDI IZBRIS OPOROKE]
export async function sendConfirmWillRequestEmail(user, action, will, code) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    let template = TEMPLATES.WILL_DELETE
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.WILL_DELETE
    }
    if (action !== 'delete') {
        template = TEMPLATES.WILL_EDIT
        if (process.env.ENVIRONMENT === 'DEV') {
            sendSmtpEmail.subject = SUBJECTS.WILL_EDIT
        }
    }
    sendSmtpEmail.params = {
        name: user.name,
        documentId: will.document.id,
        linkTo: `${process.env.FRONT_URL}/namizje/storage?willId=${will.id}&code=${code}&action=${action}`
    }
    sendSmtpEmail.templateId = template
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendNewWillEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_NEW_WILL
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_NEW_WILL
    }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name }
    ]
    await sendInterMail(sendSmtpEmail)
}

export async function sendEditedWillEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Posodobljena Oporoka v Vašem Računu'
    const content = `<p>Spoštovani ${user.name},</p>
        <p>Z veseljem vas obveščamo, da smo po vašem nedavnem sestanku uspešno uredili in osvežili vašo oporoko. Vaša posodobljena digitalna oporoka je zdaj shranjena in dostopna v vašem uporabniškem računu na platformi Testament.si.</p>
        <p>Prosimo, da si vzamete čas in pregledate spremembe v vaši oporoki, ki so zdaj na voljo v razdelku "Moji dokumenti" na vašem uporabniškem računu. Prepričajte se, da so vse informacije točne in da odražajo vaše trenutne želje.</p>
        <p>V primeru kakršnih koli vprašanj, pomislekov ali potrebe po nadaljnjih spremembah, nas prosimo ne oklevajte kontaktirati na oporoke@testament.si ali <a href="tel:+386000000">040 000 000</a>. 
        Naša ekipa je vedno pripravljena vam pomagati in zagotoviti, da je vaša oporoka popolnoma usklajena z vašimi željami.</p>
        <p>Zahvaljujemo se vam za zaupanje, ki ste nam ga izkazali z izbiro Testament.si za urejanje vaše oporoke.</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Posodobljena Oporoka v Vašem Računu')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendDeletedWillEmail(user) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Potrditev Izbrisa Vaše Oporoke'
    const content = `<p>Spoštovani ${user.name},</p>
        <p>Zahvaljujemo se vam za vašo udeležbo na nedavnem sestanku v zvezi z izbrisom vaše oporoke. Z veseljem vam sporočamo, da je bil postopek izbrisa vaše oporoke na platformi Testament.si uspešno zaključen po vašem formalnem preklicu na sestanku.</p>
        <p>Vaš dokument ni več dostopen in je bil trajno odstranjen iz našega sistema. Prosimo, upoštevajte, da je ta ukrep nepovraten.</p>
        <p>V primeru, da imate kakršna koli vprašanja, ne oklevajte in nas kontaktirajte na oporoke@testament.si ali <a href="tel:+386000000">040 000 000</a>. Naša ekipa je vedno na voljo za pomoč in podporo.</p>
        <p>Zahvaljujemo se vam za vaše sodelovanje z Testament.si</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Potrditev Izbrisa Vaše Oporoke')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendAppointmentEmail(user, request) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Potrditev sestanka za ureditev oporoke'
    const content = `<p>Spoštovani ${user.name},</p>
        <p>z veseljem vam sporočamo, da je vaš sestanek za ureditev oporoke uspešno potrjen. Spodaj najdete podrobnosti sestanka:</p>
        <p>
            <ul>
                <li>Datum: ${format(request.date, 'full', 'sl')}</li>
                <li>Čas: ${request.time}</li>
                <li>Lokacija: ${request.address}</li>
            </ul>
        </p>
        <p>Prosimo, da potrdite prejem tega sporočila. Če imate kakršnakoli vprašanja ali potrebujete dodatne informacije, nas ne oklevajte kontaktirati.</p>
        <p>Veselimo se srečanja z vami in sodelovanja pri ustvarjanju vaše oporoke.</p>
        `
    sendSmtpEmail.htmlContent = emailBase(content, 'Potrditev sestanka za ureditev oporoke')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: user.email, name: user.name },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendTestEmail(attachment) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Potrditev sestanka za ureditev oporoke'
    const content = '<p>Just a Test</p>'
    sendSmtpEmail.htmlContent = emailBase(content, 'Potrditev sestanka za ureditev oporoke')
    sendSmtpEmail.sender = { name: 'TST Oporoke', email: 'oporoke@testament.si' }
    sendSmtpEmail.to = [
        { email: 'rodriguezjjaime@hotmail.com', name: 'Testing' },
        { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    ]
    sendSmtpEmail.attachment = [
        {
            name: 'tesing-sending.pdf',
            content: attachment.AttachmentData
        }
    ]
    sendSmtpEmail.replyTo = { email: 'oporoke@testament.si', name: 'TST Oporoke' }
    await sendInterMail(sendSmtpEmail)
}

export async function sendDeceasedEmail(users) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.templateId = TEMPLATES.TST_CONTACT_HEIRS
    if (process.env.ENVIRONMENT === 'DEV') {
        sendSmtpEmail.subject = SUBJECTS.TST_CONTACT_HEIRS
    }
    users.push({ email: 'oporoke@testament.si', name: 'TST Oporoke' })
    sendSmtpEmail.to = users
    await sendInterMail(sendSmtpEmail)
}
