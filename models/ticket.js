import { DataTypes, Model } from 'sequelize'

export class Ticket extends Model {
    static STATUS = {
        OPEN: 0,
        PROCESSING: 1,
        CLOSE: 2
    }
}

export const init = (sequelize) => {
    Ticket.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Ticket.STATUS.OPEN
        }
    }, {
        sequelize,
        timestamps: true
    })
}
