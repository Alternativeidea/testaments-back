// /* eslint-disable no-unreachable */
import { Category } from '../models/category.js'
// import { Membership } from '../models/membership.js'
// import { User } from '../models/user.js'
// import { Country } from '../models/country.js'
// import { Account } from '../models/account.js'
import { Role } from '../models/role.js'
// import { Document } from '../models/document.js'
import { faker } from '@faker-js/faker'
// import { countries } from '../utils/countries.js'
// import { finalUsers } from '../utils/finalUsers.js'
import { Product } from '../models/product.js'

import express from 'express'
import { Post } from '../models/post.js'
import { Membership } from '../models/membership.js'
// import { Address } from '../models/address.js'

const router = express.Router()

router.get('/', async function (req, res, next) {
    const role = await Role.findOne({
        where: {
            name: 'user'
        }
    })
    if (!role) {
        Role.bulkCreate([
            { name: 'user' },
            { name: 'ambassador' },
            { name: 'admin' }
        ])
    }
    const membership = await Membership.findOne({
        where: {
            name: 'free'
        }
    })
    if (!membership) {
        Membership.bulkCreate([
            { name: 'Free', price: 0 },
            { name: 'Premium', price: 60 }
        ])
    }
    const listCategories = [{ name: 'Real estate' }, { name: 'Ships' }, { name: 'Cars' }, { name: 'Land' }, { name: 'Gold/Jewellery' }, { name: 'Works of art' }, { name: 'Business models' }, { name: 'The rest' }]
    // if (process.env.PRODUCTION === 'true') {
    //     listCategories = ['Nepremičnina', 'Plovila', 'Avtomobili', 'Zemljišče', 'Zlatnina/Nakit', 'Umetnine', 'Poslovni modeli', 'Ostalo']
    // }
    let categories = []
    try {
        categories = await Category.bulkCreate(listCategories)
    } catch (error) {
        console.log(error)
    }

    const products = [
        {
            name: 'BMW M3 vehicle',
            description: 'BMW M3 vehicle desc',
            characteristics: [
                { name: 'Type of fuel', text: 'Gasoline', icon: null, order: 1 },
                { name: 'Year of the vehicle', text: '2021', icon: null, order: 1 },
                { name: 'Number of kilometers driven', text: '50.444', icon: null, order: 1 }
            ],
            price: 35000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 1
        },
        {
            name: 'Apartment house, Zbiljska cesta 27',
            description: 'Apartment house, Zbiljska cesta 27 description',
            characteristics: [
                { name: 'Square footage of the property', text: '122m2', icon: null, order: 1 },
                { name: 'Street and house number', text: 'Lorem ipsum dolor sit, 123a', icon: null, order: 1 },
                { name: 'Postcode', text: '1000', icon: null, order: 1 },
                { name: 'City', text: 'Ljubljana', icon: null, order: 1 }
            ],
            price: 425000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 2
        },
        {
            name: 'BMW M3 vehicle',
            description: 'BMW M3 vehicle desc',
            characteristics: [
                { name: 'Type of fuel', text: 'Gasoline', icon: null, order: 1 },
                { name: 'Year of the Ship', text: '2021', icon: null, order: 1 },
                { name: 'Length of vessel', text: '24m', icon: null, order: 1 },
                { name: 'Number of kilometers driven', text: '100', icon: null, order: 1 }
            ],
            price: 55000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 3
        },
        {
            name: 'Rolex',
            description: 'Rolex desc',
            characteristics: [
                { name: 'A type of jewelry', text: 'Watch', icon: null, order: 1 },
                { name: 'Type of metal', text: 'Gold', icon: null, order: 1 }
            ],
            price: 55000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 4
        },
        {
            name: 'Parcela 1003',
            description: 'Parcela 1003 - desc',
            characteristics: [
                { name: 'Type of land', text: 'Buildable', icon: null, order: 1 },
                { name: 'Land size', text: '4000m2', icon: null, order: 1 }
            ],
            price: 125000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 5
        },
        {
            name: 'Janez Boljka - Bull statue',
            description: 'Janez Boljka - Bull statue desc',
            characteristics: [
                { name: 'Type of artwork', text: 'A statue', icon: null, order: 1 },
                { name: 'The author of the artwork', text: 'Janez Boljka', icon: null, order: 1 },
                { name: 'The name of the artwork', text: 'Alegorija Melanholije', icon: null, order: 1 },
                { name: 'Year of manufacture', text: '2005', icon: null, order: 1 }
            ],
            price: 22000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 6
        },
        {
            name: 'Testament d.o.o.',
            description: 'Testament d.o.o. desc',
            characteristics: [
                { name: 'Type of business model', text: 'Company buyout', icon: null, order: 1 },
                { name: 'company name', text: 'Testamenti d.o.o.', icon: null, order: 1 }
            ],
            price: 225000,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 7
        },
        {
            name: 'Serie 8 Induction hob',
            description: 'Serie 8 Induction hob desc',
            characteristics: [
                { name: 'Product type', text: 'Household appliances', icon: null, order: 1 },
                { name: 'Product name', text: 'Serie 8 Induction hob', icon: null, order: 1 },
                { name: 'Year of addition', text: '2003', icon: null, order: 1 }
            ],
            price: 500,
            sku: faker.commerce.isbn({ separator: '' }),
            picture: faker.image.urlPlaceholder({ width: 450, height: 450 }),
            stock: faker.number.int({ max: 20 }),
            categoryId: 8
        }
    ]
    try {
        await Product.bulkCreate(products)
    } catch (error) {
        console.log(error)
    }
    const articles = []
    for (let index = 0; index < 25; index++) {
        articles.push({
            title: faker.company.catchPhrase(),
            resume: faker.lorem.paragraph(),
            content: faker.lorem.paragraph(),
            image: faker.image.avatar(),
            categoryId: categories[Math.floor(Math.random() * categories.length)].id
        })
    }
    // await Post.bulkCreate(articles)

    return res.send({ done: 'done' })
})

export default router
