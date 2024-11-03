import { DataTypes, Model } from 'sequelize'
export class Product extends Model {
    static STATUS = {
        INACTIVE: 0,
        ACTIVE: 1,
        TAKEN: 2
    }
}

export const init = (sequelize) => {
    Product.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING
        },
        sku: {
            type: DataTypes.STRING(20)
        },
        price: {
            type: DataTypes.DOUBLE(12, 2)
        },
        picture: {
            type: DataTypes.TEXT
        },
        picture2: {
            type: DataTypes.TEXT
        },
        picture3: {
            type: DataTypes.TEXT
        },
        picture4: {
            type: DataTypes.TEXT
        },
        stock: {
            type: DataTypes.SMALLINT
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Product.STATUS.ACTIVE
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        characteristics: {
            type: DataTypes.JSON
        },
        publishedAt: {
            type: DataTypes.DATEONLY
        }
    },
    {
        sequelize
    })
    Product.addScope('list', () => ({
        attributes: ['name', 'isFeatured', 'sku', 'id', 'price', 'picture', 'picture2', 'picture3', 'picture4', 'stock', 'categoryId']
    }))
    Product.addScope('public', () => ({
        attributes: ['name', 'isFeatured', 'description', 'sku', 'id', 'price', 'picture', 'picture2', 'picture3', 'picture4', 'stock', 'characteristics', 'categoryId']
    }))
    Product.addScope('mini', () => ({
        attributes: ['name', 'isFeatured', 'description', 'sku', 'id', 'price', 'picture', 'picture2', 'picture3', 'picture4']
    }))
}
