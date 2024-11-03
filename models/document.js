import { DataTypes, Model } from 'sequelize'

export class Document extends Model {
}

export const init = (sequelize) => {
    Document.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT
            },
            url: {
                type: DataTypes.STRING(512)
            },
            type: {
                type: DataTypes.STRING
            },
            processingDate: {
                type: DataTypes.DATEONLY
            },
            refCount: {
                type: DataTypes.SMALLINT,
                defaultValue: 0
            }
        },
        {
            sequelize,
            timestamps: true,
            defaultScope: {
                attributes: {
                    exclude: ['refCount']
                }
            }
        }
    )
}
