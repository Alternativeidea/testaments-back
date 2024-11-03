import { DataTypes, Model } from 'sequelize'

export class Code extends Model {
    static TYPES = {
        REGISTRATION: 1,
        RESET_PASSWORD: 2,
        SEND_TO_USER: 3,
        REQUEST_EDIT: 4,
        REQUEST_DELETE: 5,
        WITHDRAW_REQUEST: 6
    }
}
export const init = (sequelize) => {
    Code.init({
        email: {
            type: DataTypes.STRING(320)
        },
        code: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: Code.TYPES.REGISTRATION
        },
        timeToLive: {
            type: DataTypes.INTEGER(5)
        },
        expiresAt: {
            type: DataTypes.DATE
        }
    }, {
        sequelize
    })
}
