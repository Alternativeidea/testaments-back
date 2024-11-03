import { DataTypes, Model } from 'sequelize'

export class Withdraw extends Model {
    static STATUS = {
        WAITING: 0,
        ACTIVE: 1,
        DONE: 2,
        CANCELLED: 3
    }
}

export const init = (sequelize) => {
    Withdraw.init({
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Withdraw.STATUS.ACTIVE
        },
        quantity: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        fee: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT
        },
        // account for log purposes
        name: {
            type: DataTypes.STRING
        },
        number: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
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
            type: DataTypes.SMALLINT
        }
    }, {
        sequelize,
        timestamps: true
    })
}
