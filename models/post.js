import { DataTypes, Model } from 'sequelize'

export class Post extends Model {
    static STATUS = {
        DRAFT: 0,
        ACTIVE: 1,
        INACTIVE: 2
    }
}

export const init = (sequelize) => {
    Post.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        image: {
            type: DataTypes.TEXT
        },
        slug: {
            type: DataTypes.STRING(200),
            unique: true
        },
        resume: {
            type: DataTypes.STRING(400)
        },
        content: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: Post.STATUS.DRAFT
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        publishedAt: {
            type: DataTypes.DATEONLY
        }
    }, {
        sequelize
    })
    Post.addScope('list', () => ({
        attributes: ['id', 'status', 'title', 'image', 'slug', 'resume', 'isFeatured', 'categoryId', 'publishedAt', 'content']
    }))
}
