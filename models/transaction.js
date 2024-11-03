import { DataTypes, Model } from 'sequelize'

export class Transaction extends Model {
    static STATUS = {
        ACTIVE: 0,
        ACCEPTED: 1,
        DECLINED: 2,
        // ON USER SENDING STATUSES
        USER_PENDING: 3,
        USER_RECIVED: 4,
        SYSTEM_RETURNED: 5
    }

    static TYPE = {
        INCOMING: 0,
        OUTCOMING: 1,
        TRANSFER: 2,
        MANUALLY_ADD: 3,
        MANUALLY_RETURN: 4
    }
}
export const init = (sequelize) => {
    Transaction.init({
        quantity: {
            type: DataTypes.DECIMAL(8, 3)
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: Transaction.STATUS.ACTIVE
        },
        rate: {
            type: DataTypes.DECIMAL(10, 4)
        },
        reference: {
            type: DataTypes.STRING
        },
        total: {
            type: DataTypes.DECIMAL(10, 4)
        },
        type: {
            type: DataTypes.INTEGER(1),
            defaultValue: Transaction.TYPE.INCOMING
        },
        paymentMethod: {
            type: DataTypes.STRING(30)
        },
        notes: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize
    })
}
