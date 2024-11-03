import { DataTypes, Model } from 'sequelize'

export class Country extends Model {
}

export const init = (sequelize) => {
    Country.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        iso: {
            type: DataTypes.CHAR(2)
        },
        nicename: {
            type: DataTypes.STRING
        },
        iso3: {
            type: DataTypes.CHAR(3)
        },
        numcode: {
            type: DataTypes.SMALLINT
        },
        phonecode: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        timestamps: false
    })
}
