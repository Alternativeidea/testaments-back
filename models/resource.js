import { DataTypes, Model } from 'sequelize'

export class Resource extends Model {
}

export const init = (sequelize) => {
    Resource.init(
        {
            originalName: {
                type: DataTypes.STRING
            },
            refCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            name: {
                type: DataTypes.STRING
            },
            url: {
                type: DataTypes.STRING(512)
            }
        },
        {
            sequelize,
            timestamps: true
        }
    )
    Resource.addScope('mini', () => ({
        attributes: ['id', 'name', 'url']
    }))
}
