import { DataTypes, Model } from 'sequelize'

export class Log extends Model {
    static ACTIONS = process.env.ENVIRONMENT === 'DEV'
        ? {
            SUSPEND: 'Suspend',
            REACTIVATE: 'Reactivate',
            DELETE: 'Delete',
            DECEASED: 'Pokojni'
        }
        : {
            SUSPEND: 'Suspendiraj',
            REACTIVATE: 'Reaktiviraj',
            DELETE: 'Izbriši',
            DECEASED: 'Pokojni'
        }
}

export const init = (sequelize) => {
    Log.init({
        action: {
            type: DataTypes.STRING(50)
        },
        message: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        createdAt: true,
        updatedAt: false
    })
}
