import { DataTypes, Model } from 'sequelize'

export class Banner extends Model {
    static STATUS = {
        INACTIVE: false,
        ACTIVE: true
    }

    static SECTION = {
        DASHBOARD: 1,
        STORAGE: 2,
        TST: 3,
        MARKET: 4,
        NEWS: 5
    }
}

export const init = (sequelize) => {
    Banner.init({
        title: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        subtitle: {
            type: DataTypes.STRING
        },
        cta: {
            type: DataTypes.STRING
        },
        ctaLink: {
            type: DataTypes.TEXT
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: Banner.STATUS.ACTIVE
        },
        image: {
            type: DataTypes.TEXT
        },
        section: {
            type: DataTypes.SMALLINT(1),
            defaultValue: Banner.SECTION.DASHBOARD
        }
    }, {
        sequelize,
        timestamps: false
    })
}
