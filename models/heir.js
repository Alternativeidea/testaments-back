import { DataTypes, Model } from 'sequelize'

export class Heir extends Model {
}
export const init = (sequelize) => {
    Heir.init({
        name: {
            type: DataTypes.STRING(380)
        },
        address: {
            type: DataTypes.STRING(380)
        },
        postcode: {
            type: DataTypes.STRING(10)
        },
        city: {
            type: DataTypes.STRING(380)
        },
        residenceCountry: {
            type: DataTypes.STRING(380)
        },
        relationship: {
            type: DataTypes.STRING(380)
        },
        areaCode: {
            type: DataTypes.STRING(8)
        },
        phone: {
            type: DataTypes.STRING(20)
        },
        email: {
            type: DataTypes.STRING(380)
        }
    }, {
        sequelize,
        scopes: {
            joined: {
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
            mini: {
                attributes: ['id', 'name', 'relationship', 'address']
            }
        }
    })
}
