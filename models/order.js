import { DataTypes, Model } from 'sequelize'

export class Order extends Model {
    static STATUS = {
        PENDING: 0,
        IN_PROCESS: 1,
        ACCEPTED: 2,
        DENIED: 3
    }
}

export const init = (sequelize) => {
    Order.init({
        total: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        shipmentDate: {
            type: DataTypes.DATEONLY
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Order.STATUS.PENDING
        },
        shippingAddress: {
            type: DataTypes.JSON
        },
        tracking: {
            type: DataTypes.STRING
        },
        notes: {
            type: DataTypes.STRING(450)
        },
        history: {
            type: DataTypes.JSON
        }
    }, {
        sequelize
    })
    Order.addScope('list', () => ({
        attributes: ['id', 'total', 'shipmentDate', 'status', 'shippingAddress']
    }))
}
