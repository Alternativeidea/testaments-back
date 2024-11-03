import { DataTypes, Model } from 'sequelize'

export class General extends Model {
    static TYPES = {
        CRYPTO: 0,
        FIAT: 1
    }

    static STATUS = {
        INACTIVE: 0,
        ACTIVE: 1
    }
}

export const init = (sequelize) => {
    General.init({
        total: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalSell: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        averageSell: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalCountSell: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        totalSellAccepted: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalBuy: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        averageBuy: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalCountBuy: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        totalBuyAccepted: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalShared: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalSharedAccepted: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        averageShared: {
            type: DataTypes.DECIMAL(14, 4),
            defaultValue: 0
        },
        totalCountShared: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        timestamps: false
    })
}
