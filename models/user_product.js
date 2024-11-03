import { Model } from 'sequelize'

export class UserProducts extends Model {
}
export const init = (sequelize) => {
    UserProducts.init({
    }, {
        sequelize,
        timestamps: false
    })
}
