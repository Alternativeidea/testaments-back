import { Model } from 'sequelize'

export class Wishlist extends Model {
}

export const init = (sequelize) => {
    Wishlist.init({
    }, {
        sequelize,
        timestamps: false
    })
}
