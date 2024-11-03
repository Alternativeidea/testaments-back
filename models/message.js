import { DataTypes, Model } from 'sequelize'

export class Message extends Model {
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
    Message.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: Message.STATUS.ACTIVE
        },
        section: {
            type: DataTypes.SMALLINT(1),
            defaultValue: Message.SECTION.DASHBOARD
        }
    }, {
        sequelize,
        timestamps: false
    })
}
