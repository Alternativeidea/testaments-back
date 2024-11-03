import { DataTypes, Model } from 'sequelize'

export class Category extends Model {
    static TYPES = {
        PRODUCT: 1,
        POST: 2,
        WILL: 3
    }
}

export const init = (sequelize) => {
    Category.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false
        },
        description: {
            type: DataTypes.TEXT
        },
        image: {
            type: DataTypes.TEXT
        },
        translations: {
            type: DataTypes.JSON
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: Category.TYPES.PRODUCT
        }
    }, {
        sequelize,
        timestamps: false
    })
    Category.addScope('list', () => ({
        attributes: ['id', 'name', 'image']
    }))
    Category.addScope('mini', () => ({
        attributes: ['id', 'name']
    }))
}
