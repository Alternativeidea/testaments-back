import { DataTypes, Model } from 'sequelize'

export class Role extends Model {
    static ACTIVE = 1
    static INACTIVE = 0
}

export const init = (sequelize) => {
    Role.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Role.ACTIVE
        }
    }, {
        sequelize,
        timestamps: false
    })
}
