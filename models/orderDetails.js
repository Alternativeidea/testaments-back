import { DataTypes, Model } from 'sequelize'

export class OrderDetail extends Model {
}

export const init = (sequelize) => {
    OrderDetail.init({
        quantity: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        unitPrice: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        subtotal: {
            type: DataTypes.DECIMAL,
            allowNull: false
        }
    }, {
        sequelize
    })
}
