import { DataTypes, Model } from 'sequelize'

export class Testament extends Model {
}
export const init = (sequelize) => {
    Testament.init({
        quantity: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize
    })
}
