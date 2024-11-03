import bcryptjs from 'bcryptjs'
import { DataTypes, Model } from 'sequelize'
// Deleted Izbrisani
export class User extends Model {
    static STATUS = {
        SUSPENDED: -1,
        INACTIVE: 0,
        ACTIVE: 1,
        VERIFIED: 2,
        ACTIVE_PREMIUM: 3,
        DECEASED: 4,
        DELETED: 5
    }

    static STATUS_VERIFIED = {
        NOT_VERIFIED: -1,
        INCOMPLETE: 0,
        WAITING: 1,
        ACCEPTED: 2
    }
}

export const init = (sequelize) => {
    User.init({
        name: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        secondLastName: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING,
            unique: true
        },
        areaCode: {
            type: DataTypes.STRING(8)
        },
        phone: {
            type: DataTypes.STRING
        },
        mobilephone: {
            type: DataTypes.STRING
        },
        isReferred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        referralId: {
            type: DataTypes.INTEGER
        },
        referralLink: {
            type: DataTypes.STRING
        },
        picture: {
            type: DataTypes.TEXT
        },
        city: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        zipcode: {
            type: DataTypes.STRING
        },
        street: {
            type: DataTypes.STRING
        },
        suburb: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: User.STATUS.INACTIVE
        },
        birthdate: {
            type: DataTypes.DATEONLY
        },
        birthplace: {
            type: DataTypes.INTEGER
        },
        emailVerifiedAt: {
            type: DataTypes.DATEONLY
        },
        gender: {
            type: DataTypes.STRING(25)
        },
        balance: {
            // TODO: check where to put the balance
            // TODO: and where to reserve sents testaments
            // TODO: A sending its a transaction ¿?
            type: DataTypes.DECIMAL(10, 4),
            defaultValue: 0
        },
        memPurchasedAt: {
            type: DataTypes.DATEONLY
        },
        nextRenewal: {
            type: DataTypes.DATEONLY
        },
        emso: {
            type: DataTypes.STRING(13)
        },
        tin: {
            type: DataTypes.STRING(9)
        },
        career: {
            type: DataTypes.STRING
        },
        isVerified: {
            type: DataTypes.SMALLINT,
            defaultValue: User.STATUS_VERIFIED.NOT_VERIFIED,
            get () {
                return this.getDataValue('isVerified') > -1
            }
        },
        stripeCustomerId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        minimaxCustomerId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        suspensionDate: {
            type: DataTypes.DATE
        },
        payLater: {
            type: DataTypes.DATE
        },
        isAmbassador: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        agreeAmbassador: {
            type: DataTypes.DATE
        },
        uplineId: {
            type: DataTypes.INTEGER
        },
        level: {
            type: DataTypes.INTEGER
        },
        hierarchy: {
            type: DataTypes.TEXT
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            set (value) {
                this.setDataValue('password', bcryptjs.hashSync(value, 10))
            },
            get () {
                return this.getDataValue('password')
            }
        }
    },
    {
        sequelize,
        paranoid: true,
        defaultScope: {
            attributes: {
                exclude: ['password', 'stripeCustomerId']
            }
        },
        scopes: {
            withPassword: {
            },
            mini: {
                attributes: ['id', 'name', 'lastName', 'email']
            },
            mid: {
                attributes: ['id', 'name', 'lastName', 'email', 'status', 'roleId', 'membershipId']
            }
        }
    })
}
