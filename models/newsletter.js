import { DataTypes, Model } from 'sequelize'

export class Newsletter extends Model {
}

export const init = (sequelize) => {
    Newsletter.init({
        email: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize
    })
}
