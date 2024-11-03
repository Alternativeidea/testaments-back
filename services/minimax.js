import axios from 'axios'
import qs from 'qs'
import { generateRandomString } from '../utils/strings.js'
import { User } from '../models/user.js'
import { sendPremiumNoticeAttachment } from '../utils/mails/transactions.js'

// Helper to get headers
const getHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})

// Helper to handle errors more specifically
const handleAxiosError = (error, contextMessage) => {
    if (error.response) {
        // Request made and server responded
        console.error(`${contextMessage}:`, error.response.data)
        console.error('Status:', error.response.status)
        console.error('Headers:', error.response.headers)
    } else if (error.request) {
        // Request made but no response received
        console.error(`${contextMessage}: No response received`, error.request)
    } else {
        // Something else happened
        console.error(`${contextMessage}:`, error.message)
    }
    throw error
}

// Helper to authenticate and retrieve token
const authenticate = async () => {
    try {
        // Get credentials from environment variables
        const username = process.env.MINIMAX_USERNAME
        const password = process.env.MINIMAX_PASSWORD
        const clientId = process.env.MINIMAX_CLIENT_ID
        const clientSecret = process.env.MINIMAX_CLIENT_SECRET
        const baseURL = process.env.MINIMAX_URL

        // Prepare data for authentication
        const data = qs.stringify({
            username,
            password,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'password',
            scope: 'minimax.si'
        })

        // Authenticate with Minimax
        console.log('Authenticating with Minimax...')
        const response = await axios.post(`${baseURL}/AUT/oauth20/token`, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        console.log('Authenticated with Minimax successfully!')

        return response.data.access_token
    } catch (error) {
        handleAxiosError(error, 'Error authenticating with Minimax')
    }
}

// Function to get the current user's organization
const getMyOrganization = async (token) => {
    try {
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/currentuser/orgs`, getHeaders(token))
        const organization = response.data.Rows[0]

        if (!organization) {
            console.error('Organization not found')
            return null
        }

        return organization.Organisation
    } catch (error) {
        handleAxiosError(error, 'Error fetching organization from Minimax')
    }
}

// Function to get a customer by ID
const getCustomer = async (orgId, customerId, token) => {
    try {
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/customers/${customerId}`, getHeaders(token))
        return response.data
    } catch (error) {
        handleAxiosError(error, `Error fetching customer with ID ${customerId}`)
    }
}

// Function to get a customer by code
const getCustomerByCode = async (orgId, customerCode, token) => {
    try {
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/customers/code(${customerCode})`, getHeaders(token))
        return response.data
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn(`Customer with code ${customerCode} not found`)
            return null // Expected case
        }
        handleAxiosError(error, `Error fetching customer with code ${customerCode}`)
    }
}

// Function to get all customers
const getCustomers = async (orgId, token) => {
    try {
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/customers`, getHeaders(token))
        return response.data
    } catch (error) {
        handleAxiosError(error, 'Error fetching customers')
    }
}

// Function to add a new customer, returns the customer code
const addCustomer = async (orgId, token, customerData) => {
    try {
        // Generate a random code for the customer
        let code = customerData.Code || generateRandomString(12)
        let existingCustomer = await getCustomerByCode(orgId, code, token)

        // Check if the code already exists
        while (existingCustomer) {
            console.warn('Customer already exists with code:', code)
            // Generate a new code
            code = generateRandomString(12)
            // Check if the new code already exists
            existingCustomer = await getCustomerByCode(orgId, code, token)
        }

        const finalCustomerData = { ...customerData, Code: code }
        console.debug('Adding a new customer with data:', finalCustomerData)

        // Add the new customer
        const response = await axios.post(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/customers`, finalCustomerData, getHeaders(token))

        if (response.data) {
            console.log('Customer added successfully:', code)
            return await getCustomerByCode(orgId, code, token) // Fetch created customer
        }
    } catch (error) {
        handleAxiosError(error, 'Error adding a new customer')
    }
}

// Function to get all items and filter the Premium membership
const getItem = async (orgId, token, itemName = 'Testament premium') => {
    try {
        console.log('Fetching items...')
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/items`, getHeaders(token))
        const items = response.data.Rows
        // Find the item with the name 'Testament premium'
        const item = items.find(item => item.Title === itemName)
        console.log('Premium item found:', item)
        return item
    } catch (error) {
        handleAxiosError(error, 'Error fetching items')
    }
}

// Function to get payment methods and filter for STRIPE
const getPaymentMethod = async (orgId, token, paymentMethodName = 'STRIPE') => {
    try {
        console.log('Fetching payment methods...')
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/paymentMethods`, getHeaders(token))
        const paymentMethods = response.data.Rows
        // Find the payment method with the name 'STRIPE'
        const method = paymentMethods.find(method => method.Name === paymentMethodName)
        console.log('Payment method found:', method)
        return method
    } catch (error) {
        handleAxiosError(error, 'Error fetching payment methods')
    }
}

// Function to add a new issued invoice
const addIssuedInvoice = async (orgId, invoiceData, token) => {
    try {
        console.debug('Adding a new issued invoice with data:', JSON.stringify(invoiceData, null, 2))
        const response = await axios.post(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/issuedinvoices`, invoiceData, getHeaders(token))

        // As it responds with 201 Created, we can't get the response data
        // Instead, if the response is successful, we retrieve the last issued invoice
        // that matches the customer id
        if (response.status === 201) {
            console.log('Issued invoice added successfully')
            const customerId = invoiceData.Customer.ID
            console.debug('Searching for customerID:', customerId)

            // Retrieve all issued invoices
            const issuedInvoicesResponse = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/issuedinvoices`, getHeaders(token))
            const issuedInvoices = issuedInvoicesResponse.data.Rows

            // Filter to find invoices that match both the customer ID
            const matchingInvoices = issuedInvoices.filter(inv =>
                inv.Customer.ID === customerId
            )

            // Sort the matching invoices by date (assuming there's a date field, e.g., `DateIssued`)
            const latestInvoice = matchingInvoices.sort((a, b) => new Date(b.DateIssued) - new Date(a.DateIssued))[0]
            if (latestInvoice.Status === 'I') {
                const p = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/issuedinvoices/${latestInvoice.IssuedInvoiceId}`, getHeaders(token))
                console.debug('james  data', p.data)
                console.debug('trying to retrieve document ID = ', p.data.Document.ID)
                const d = await getDocument(orgId, p.data.Document.ID, token)
                console.debug('james Doc ', d)
                console.debug('trying to retrieve Attachment ID = ', d.Attachments[0].DocumentAttachmentId)
                const a = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/documents/${p.data.Document.ID}/attachments/${d.Attachments[0].DocumentAttachmentId}`, getHeaders(token))
                console.debug(a.data)
                console.debug('===== End trying to retrieve document =====')
                latestInvoice.customAction = a.data
                // console.log('full Invoice Data ', latestInvoice)
                return latestInvoice
            }
            if (latestInvoice) {
                console.log('Latest issued invoice:', latestInvoice)
                /**
                 * Status O - sin confirmar
                 */
                return latestInvoice
            } else {
                console.warn('No matching issued invoice found')
                return null
            }
        }

        if (response.data) {
            console.log('Issued invoice added successfully:', response.data)
            return response.data
        }
    } catch (error) {
        handleAxiosError(error, 'Error adding a new issued invoice')
    }
}

const getDocument = async (orgId, documentId, token) => {
    try {
        const d = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/documents/${documentId}`, getHeaders(token))
        return d.data
    } catch (error) {
        handleAxiosError(error, 'Error fetching Document')
    }
}

// Get employees and return the first one
const getFirstEmployee = async (orgId, token) => {
    try {
        const response = await axios.get(`${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/employees`, getHeaders(token))
        const employees = response.data.Rows
        return employees[0]
    } catch (error) {
        handleAxiosError(error, 'Error fetching employees')
    }
}

// Function to handle custom action on issued invoice
const customActionIssuedInvoice = async (orgId, invoiceId, rowVersion, action, token) => {
    try {
        console.log(`Performing custom action (${action}) on issued invoice...`)
        const response = await axios.put(
            `${process.env.MINIMAX_URL}/API/api/orgs/${orgId}/issuedinvoices/${invoiceId}/actions/${action}?rowVersion=${rowVersion}`,
            null,
            getHeaders(token)
        )
        return response.data
    } catch (error) {
        handleAxiosError(error, `Error performing custom action (${action}) on issued invoice`)
    }
}

// Helper function to verify user integrity
const verifyUserIntegrity = (user) => {
    // Check if the user exists
    if (!user) {
        console.error('No user found')
        return false
    }
    // Check if the user data is complete
    if (!user.name || !user.email || !user.phone || !user.address || !user.zipcode || !user.city) {
        console.error('User data is incomplete: name, email, phone, address, zipcode, city')
        return false
    }
    return true
}

// Function to issue a premium invoice for the customer
const issuePremiumInvoice = async (userId) => {
    try {
        // Find the user by ID
        const user = await User.findByPk(userId)

        // Verify user integrity
        if (!verifyUserIntegrity(user)) {
            throw new Error('User integrity not correct')
        }

        // Authenticate with Minimax
        const token = await authenticate()
        const organization = await getMyOrganization(token)
        console.debug('=====================')

        let customer = null
        // Check if the user has a Minimax customer ID
        if (user.minimaxCustomerId) {
            // Get the customer by code
            customer = await getCustomerByCode(organization.ID, user.minimaxCustomerId, token)
        }

        if (!customer) {
            // Add a new customer if not found
            customer = await addCustomer(organization.ID, token, {
                Name: `${user.name}${process.env.ENVIRONMENT === 'DEV' ? '-DEV' : ''}`,
                Email: user.email,
                Phone: user.phone,
                Address: user.address,
                PostalCode: user.zipcode,
                City: user.city,
                Country: { ID: 192, Name: 'Slovenia' },
                Currency: { ID: 7, Name: 'EUR' },
                SubjectToVAT: 'N',
                EInvoiceIssuing: 'N',
                Code: user.minimaxCustomerId,
                RebatePercent: 0
            })
            user.minimaxCustomerId = customer.Code
            await user.save()
        }
        console.debug('=====================')

        // Get the payment method and premium item
        const paymentMethod = await getPaymentMethod(organization.ID, token)
        if (!paymentMethod) throw new Error('Payment method not found')
        console.debug('=====================')

        // Get the premium item
        const premiumItem = await getItem(organization.ID, token)
        if (!premiumItem) throw new Error('Premium item not found')
        console.debug('=====================')

        // Get the first employee
        const employee = await getFirstEmployee(organization.ID, token)
        if (!employee) throw new Error('Employee not found')
        console.debug('=====================')

        // Prepare the invoice data
        const invoiceData = {
            InvoiceType: 'R',
            Customer: { ID: customer.CustomerId, Name: customer.Name },
            DocumentNumbering: { ID: 52130 },
            DateIssued: new Date().toISOString(),
            DateTransaction: new Date().toISOString(),
            DateDue: new Date().toISOString(),
            IssuedInvoiceRows: [{
                RowNumber: 1,
                Item: { ID: premiumItem.ItemId, Name: premiumItem.Title },
                ItemName: 'Testament premium',
                Description: 'Enoletna Premium naročnina vključuje dostop do spletne pisarne, novic, prejemanje in vračilo TST, digitalne shrambe, e-tržnice zapuščin, digitalne oporoke ter premium podpore.',
                Quantity: 1,
                UnitOfMeasurement: 'unit',
                Price: premiumItem.Price,
                VatRate: { ID: premiumItem.VatRate.ID, Name: premiumItem.VatRate.Name },
                VATPercent: 22
            }],
            IssuedInvoicePaymentMethods: [{
                PaymentMethod: { ID: paymentMethod.PaymentMethodId },
                Amount: premiumItem.Price,
                AlreadyPaid: 'D'
            }],
            Employee: {
                ID: employee.EmployeeId,
                Name: employee.FirstName
            }
        }

        // Add the issued invoice
        const issuedInvoice = await addIssuedInvoice(organization.ID, invoiceData, token)
        console.debug('Issued premium invoice:', issuedInvoice)
        console.debug('=====================')

        // In case we want to programatically take further action on the issued invoice
        if (issuedInvoice) {
            if (issuedInvoice.Status === 'I') {
                console.debug('Al ready confirmed')
                // If the status ==== I means the invoice is already confirmed
                await sendPremiumNoticeAttachment(user, {
                    AttachmentFileName: issuedInvoice.customAction.FileName,
                    AttachmentData: issuedInvoice.customAction.AttachmentData
                })
            } else {
                // Issue the invoice and generate the PDF
                const action = 'issueAndGeneratepdf'
                console.log(`Issuing premium invoice with action: ${action}`)
                const customAction = await customActionIssuedInvoice(organization.ID, issuedInvoice.IssuedInvoiceId, issuedInvoice.RowVersion, action, token)
                console.debug('Custom action on the issued invoice:', customAction)
                // console.debug('Data log:')
                // console.debug(customAction.Data.AttachmentData)
                await sendPremiumNoticeAttachment(user, {
                    AttachmentFileName: customAction.Data.AttachmentFileName,
                    AttachmentData: customAction.Data.AttachmentData
                })
                console.debug('=====================')
            }
        }

        // Return the issued invoice
        return issuedInvoice
    } catch (error) {
        handleAxiosError(error, 'Error issuing premium invoice')
    }
}

const issueInvoice = async (userId, paymentMethodName, itemName, itemPrice, itemDescription) => {
    try {
        // Find the user by ID
        const user = await User.findByPk(userId)

        // Verify user integrity
        if (!verifyUserIntegrity(user)) {
            throw new Error('User integrity not correct')
        }

        // Authenticate with Minimax
        const token = await authenticate()
        const organization = await getMyOrganization(token)
        console.debug('=====================')

        let customer = null
        // Check if the user has a Minimax customer ID
        if (user.minimaxCustomerId) {
            // Get the customer by code
            customer = await getCustomerByCode(organization.ID, user.minimaxCustomerId, token)
        }

        if (!customer) {
            // Add a new customer if not found
            customer = await addCustomer(organization.ID, token, {
                Name: user.name,
                Email: user.email,
                Phone: user.phone,
                Address: user.address,
                PostalCode: user.zipcode,
                City: user.city,
                Country: { ID: 192, Name: 'Slovenia' },
                Currency: { ID: 7, Name: 'EUR' },
                SubjectToVAT: 'N',
                EInvoiceIssuing: 'N',
                Code: user.minimaxCustomerId,
                RebatePercent: 0
            })
            user.minimaxCustomerId = customer.Code
            await user.save()
        }
        console.debug('=====================')

        // Get the payment method and premium item
        const paymentMethod = await getPaymentMethod(organization.ID, token, paymentMethodName)
        if (!paymentMethod) throw new Error('Payment method not found')
        console.debug('=====================')

        // Get the premium item
        const selectedItem = await getItem(organization.ID, token, itemName)
        if (!selectedItem) throw new Error('Premium item not found')
        console.debug('=====================')

        // Get the first employee
        const employee = await getFirstEmployee(organization.ID, token)
        if (!employee) throw new Error('Employee not found')
        console.debug('=====================')

        // Prepare the invoice data
        const invoiceData = {
            InvoiceType: 'R',
            Customer: { ID: customer.CustomerId, Name: customer.Name },
            DocumentNumbering: { ID: 52130 },
            DateIssued: new Date().toISOString(),
            DateTransaction: new Date().toISOString(),
            DateDue: new Date().toISOString(),
            IssuedInvoiceRows: [{
                RowNumber: 1,
                Item: { ID: selectedItem.ItemId, Name: selectedItem.Title },
                ItemName: itemName,
                Description: itemDescription,
                Quantity: 1,
                UnitOfMeasurement: 'unit',
                Price: itemPrice,
                VatRate: { ID: selectedItem.VatRate.ID, Name: selectedItem.VatRate.Name },
                VATPercent: 22
            }],
            IssuedInvoicePaymentMethods: [{
                PaymentMethod: { ID: paymentMethod.PaymentMethodId },
                Amount: itemPrice,
                AlreadyPaid: 'D'
            }],
            Employee: {
                ID: employee.EmployeeId,
                Name: employee.FirstName
            }
        }

        // Add the issued invoice
        const issuedInvoice = await addIssuedInvoice(organization.ID, invoiceData, token)
        console.debug('Issued invoice:', issuedInvoice)
        console.debug('=====================')

        // In case we want to programatically take further action on the issued invoice
        if (issuedInvoice) {
            if (issuedInvoice.Status === 'I') {
                console.debug('Al ready confirmed')
                // If the status ==== I means the invoice is already confirmed
                await sendPremiumNoticeAttachment(user, {
                    AttachmentFileName: issuedInvoice.customAction.FileName,
                    AttachmentData: issuedInvoice.customAction.AttachmentData
                })
            } else {
                // Issue the invoice and generate the PDF
                const action = 'issueAndGeneratepdf'
                console.log(`Issuing premium invoice with action: ${action}`)
                const customAction = await customActionIssuedInvoice(organization.ID, issuedInvoice.IssuedInvoiceId, issuedInvoice.RowVersion, action, token)
                console.debug('Custom action on the issued invoice:', customAction)
                // console.debug('Data log:')
                // console.debug(customAction.Data.AttachmentData)
                await sendPremiumNoticeAttachment(user, {
                    AttachmentFileName: customAction.Data.AttachmentFileName,
                    AttachmentData: customAction.Data.AttachmentData
                })
                console.debug('=====================')
            }
        }

        // Return the issued invoice
        return issuedInvoice
    } catch (error) {
        handleAxiosError(error, 'Error issuing premium invoice')
    }
}

export { issuePremiumInvoice, issueInvoice, getItem, getCustomer, getCustomerByCode, addCustomer, getCustomers, addIssuedInvoice, getMyOrganization }
