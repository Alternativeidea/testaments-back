import { DataTypes, Model } from 'sequelize'

export class HeirWill extends Model {
}
export const init = (sequelize) => {
    HeirWill.init({
        share: {
            type: DataTypes.DOUBLE(5, 2)
        },
        constrains: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        timestamps: true
    })
}
