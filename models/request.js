import { DataTypes, Model } from 'sequelize'

export class Request extends Model {
    static STATUS = {
        ON_DATE: 3,
        IN_PROCESS: 0,
        ACCEPT: 1,
        CANCELLED: 2
    }

    static ACTIONS = {
        ADD: 0,
        EDIT: 1,
        DELETE: 2,
        UPDATE: 3
    }
}

export const init = (sequelize) => {
    Request.init({
        action: {
            type: DataTypes.SMALLINT(1),
            defaultValue: Request.ACTIONS.ADD
        },
        status: {
            type: DataTypes.SMALLINT(1),
            defaultValue: Request.STATUS.IN_PROCESS
        },
        history: {
            type: DataTypes.JSON
        },
        date: {
            type: DataTypes.DATEONLY
        },
        time: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        timestamps: false
    })
}
