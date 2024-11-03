import { DataTypes, Model } from 'sequelize'

export class Faq extends Model {
    static ACTIVE = true
    static INACTIVE = false

    static SECTION = {
        DASHBOARD: 1,
        STORAGE: 2,
        TST: 3,
        MARKET: 4,
        NEWS: 5
    }
}

export const init = (sequelize) => {
    Faq.init({
        question: {
            type: DataTypes.STRING,
            allowNull: false
        },
        response: {
            type: DataTypes.TEXT
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: Faq.ACTIVE
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        section: {
            type: DataTypes.SMALLINT(1),
            defaultValue: 1
        }
    }, {
        sequelize,
        createdAt: true,
        updatedAt: false
    })
}
