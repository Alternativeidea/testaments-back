import { DataTypes, Model } from 'sequelize'

export class Account extends Model {
}
export const init = (sequelize) => {
    Account.init({
        name: {
            type: DataTypes.STRING
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT
        },
        swift: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        companyAddress: {
            type: DataTypes.STRING
        },
        companyTin: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        }
    }, {
        sequelize
    })
}
