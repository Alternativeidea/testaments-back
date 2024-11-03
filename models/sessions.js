import { DataTypes, Model } from 'sequelize'

export class Session extends Model {
}
export const init = (sequelize) => {
    Session.init({
        agent: {
            type: DataTypes.STRING(320)
        },
        remoteIp: {
            type: DataTypes.STRING(320),
            allowNull: false
        },
        lastLogin: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        },
        expiresAt: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        }
    }, {
        sequelize,
        timestamps: false
    })
}
