import { Sequelize } from 'sequelize'
import init from '../models/index.js'
// import { Code } from '../models/code.js'

let connection = null

export async function getConnection () {
    if (connection) {
        return connection
    }

    const dbString = process.env.DB_STRING
    // TODO: check if string is not null
    connection = new Sequelize(dbString, {
        logging: false,
        dialect: 'mysql'
    })
    await connection.authenticate()
    console.log('Connection has been established successfully.')
    init(connection)
    // await Code.sync({ alter: true })
    // await connection.sync({ force: true })
    return connection
}
