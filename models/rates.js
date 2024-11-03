import { DataTypes, Model } from 'sequelize'

export class Rate extends Model {
}
export const init = (sequelize) => {
    Rate.init({
        openTime: {
            type: DataTypes.DATE
        },
        price: {
            type: DataTypes.DECIMAL(10, 4)
        },
        priceGram24k: {
            type: DataTypes.DECIMAL(10, 4)
        },
        rateBuy: {
            type: DataTypes.DECIMAL(10, 4)
        },
        rateSell: {
            type: DataTypes.DECIMAL(10, 4)
        },
        priceBuy: {
            type: DataTypes.DECIMAL(10, 4)
        },
        priceSell: {
            type: DataTypes.DECIMAL(10, 4)
        }
    }, {
        sequelize,
        scopes: {
            mini: {
                attributes: ['id', 'priceGram24k', 'price', 'priceBuy', 'priceSell', 'createdAt']
            }
        }
    })
}
