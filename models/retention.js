import { DataTypes, Model } from 'sequelize'

export class Retention extends Model {
    static TYPE = {
        fee: 0,
        sell: 1
    }
}

export const init = (sequelize) => {
    Retention.init({
        quantity: {
            type: DataTypes.DECIMAL(10, 4)
        },
        rate: {
            type: DataTypes.DECIMAL(10, 4)
        },
        total: {
            type: DataTypes.DECIMAL(10, 4)
        }
    }, {
        sequelize
    })
}
