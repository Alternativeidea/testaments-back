import { DataTypes, Model } from 'sequelize'

export class Setting extends Model {
}

export const init = (sequelize) => {
    Setting.init({
        key: {
            type: DataTypes.STRING
        },
        rateBuy: {
            type: DataTypes.DECIMAL(6, 3),
            get () {
                return parseFloat(this.getDataValue('rateBuy'))
            }
        },
        rateSell: {
            type: DataTypes.DECIMAL(6, 3),
            get () {
                return parseFloat(this.getDataValue('rateSell'))
            }
        }
    }, {
        sequelize,
        timestamps: false
    })
}
