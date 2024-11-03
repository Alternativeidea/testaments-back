import { DataTypes, Model } from 'sequelize'

export class Membership extends Model {
}

export const init = (sequelize) => {
    Membership.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subtitle: {
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.DOUBLE
        },
        currency: {
            type: DataTypes.STRING,
            defaultValue: 'EUR'
        },
        paymentMode: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.JSON
        },
        image: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: 1
        }
    },
    {
        sequelize
    })

    Membership.addScope('list', () => ({
        attributes: ['id', 'name', 'subtitle', 'price', 'currency', 'paymentMode', 'description', 'image', 'status']
    }))
    Membership.addScope('public', () => ({
        attributes: ['id', 'name', 'subtitle', 'price', 'currency', 'paymentMode', 'description', 'image', 'status']
    }))
}
