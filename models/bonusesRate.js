import { DataTypes, Model } from 'sequelize'

export class BonusesRate extends Model {
}

export const init = (sequelize) => {
    BonusesRate.init({
        direct: {
            type: DataTypes.DOUBLE(5, 2)
        },
        indirect: {
            type: DataTypes.DOUBLE(5, 2)
        },
        type: {
            type: DataTypes.STRING
        },
        isCurrent: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        timestamps: true
    })
}
