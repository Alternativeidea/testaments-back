import { DataTypes, Model } from 'sequelize'

export class Will extends Model {
    static STATUS = {
        NEW: -1,
        ON_HOLD: 0,
        ACTIVE: 1
    }
}
export const init = (sequelize) => {
    Will.init({
        description: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.INTEGER(1),
            defaultValue: Will.STATUS.NEW
        },
        constrains: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize
    })
    Will.addScope('list', () => ({
        attributes: ['id', 'description', 'status', 'categoryId']
    }))
    Will.addScope('mini', () => ({
        attributes: ['id', 'description', 'status']
    }))
}
