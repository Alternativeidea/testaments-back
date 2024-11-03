import { DataTypes, Model } from 'sequelize'

export class Address extends Model {
    static TYPES = {
        DEFAULT: 0,
        SHIPPING: 1,
        INVOICE: 2
    }
}

export const init = (sequelize) => {
    Address.init({
        address: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        zipcode: {
            type: DataTypes.STRING
        },
        street: {
            type: DataTypes.STRING
        },
        suburb: {
            type: DataTypes.STRING
        },
        country: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: Address.TYPES.DEFAULT
        },
        title: {
            type: DataTypes.VIRTUAL,
            get () {
                const type = this.getDataValue('type')
                if (type === Address.TYPES.DEFAULT) {
                    return 'DEFAULT'
                }
                if (type === Address.TYPES.SHIPPING) {
                    return 'SHIPPING'
                }
                if (type === Address.TYPES.INVOICE) {
                    return 'INVOICE'
                }
            }
        }
    }, {
        sequelize,
        timestamps: false
    })
}
