import { Account, init as initAccount } from './account.js'
import { Category, init as initCategory } from './category.js'
import { Membership, init as initMembership } from './membership.js'
import { Role, init as initRole } from './role.js'
import { User, init as initUser } from './user.js'
// Store
import { Product, init as initProduct } from './product.js'
import { Order, init as initOrder } from './order.js'
import { OrderDetail, init as initOrderDetail } from './orderDetails.js'
import { init as initCode } from './code.js'
import { Transaction, init as initTransaction } from './transaction.js'
import { init as initTestament } from './testament.js'
// import { Wishlist, init as initWishlist } from './whislist.js'
import { Post, init as initPost } from './post.js'
import { Retention, init as initRetention } from './retention.js'
import { Will, init as initWill } from './will.js'
import { UserProducts, init as initUserProducts } from './user_product.js'
import { Heir, init as initHeir } from './heir.js'
import { Session, init as initSession } from './sessions.js'
import { init as initNewsletter } from './newsletter.js'
import { init as initRate } from './rates.js'
import { Request, init as initRequest } from './request.js'
import { Ticket, init as initTicket } from './ticket.js'
import { Log, init as initLog } from './log.js'
import { HeirWill, init as initHeirWill } from './will_heirs.js'
import { init as initMessage } from './message.js'
import { Country, init as initCountry } from './country.js'
import { init as initBanner } from './banner.js'
import { Document, init as initDocument } from './document.js'
import { init as initGeneral } from './general.js'
import { init as initSetting } from './setting.js'
import { init as initFAQ } from './faq.js'
import { init as initWithdraw, Withdraw } from './withdraw.js'
import { init as initBonusRate } from './bonusesRate.js'

const init = (sequelize) => {
    initUser(sequelize)
    initCode(sequelize)
    initTransaction(sequelize)
    initTestament(sequelize)
    initProduct(sequelize)
    initOrder(sequelize)
    initCategory(sequelize)
    initOrderDetail(sequelize)
    initPost(sequelize)
    initRole(sequelize)
    initMembership(sequelize)
    initRetention(sequelize)
    initWill(sequelize)
    initUserProducts(sequelize)
    initHeir(sequelize)
    initSession(sequelize)
    initNewsletter(sequelize)
    initRate(sequelize)
    initAccount(sequelize)
    initRequest(sequelize)
    initTicket(sequelize)
    initLog(sequelize)
    initHeirWill(sequelize)
    initMessage(sequelize)
    initCountry(sequelize)
    initBanner(sequelize)
    initDocument(sequelize)
    initGeneral(sequelize)
    initSetting(sequelize)
    initFAQ(sequelize)
    initWithdraw(sequelize)
    initBonusRate(sequelize)
    /**
     * User Belongs
     */
    User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })
    User.belongsTo(Membership, { foreignKey: 'membershipId', as: 'membership' })
    Will.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Will, { foreignKey: 'userId', as: 'wills' })
    User.hasMany(Heir, { foreignKey: 'userId', as: 'heirs' })
    User.belongsTo(Country, { foreignKey: 'countryId', as: 'country' })
    Account.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    Withdraw.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' })
    Transaction.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    })
    Transaction.belongsTo(User, {
        foreignKey: 'reviewerId',
        as: 'reviewer'
    })
    Transaction.belongsTo(User, {
        foreignKey: 'toUserId',
        as: 'to'
    })
    /**
     * User Retentions for the system, when TST are sold
     */
    Retention.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' })

    Category.belongsTo(Category, { foreignKey: 'parentId', as: 'upper' })
    Category.hasMany(Category, { foreignKey: 'parentId', as: 'childs' })
    // Store
    Order.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Order, { foreignKey: 'userId', as: 'orders' })

    // Product.belongsTo(OrderDetail, { foreignKey: 'productId', as: 'details' })
    OrderDetail.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

    OrderDetail.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
    Order.hasMany(OrderDetail, { foreignKey: 'orderId', as: 'details' })

    Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
    Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' })

    Product.belongsToMany(User,
        { through: 'Wishlists', foreignKey: 'productId', as: 'user' }
    )
    User.belongsToMany(Product,
        { through: 'Wishlists', foreignKey: 'userId', as: 'wishlist' }
    )
    Product.belongsToMany(User,
        { through: UserProducts, foreignKey: 'productId', as: 'owner' }
    )
    User.belongsToMany(Product,
        { through: UserProducts, foreignKey: 'userId', as: 'products' }
    )

    // News - Articles
    Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
    Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' })

    Post.belongsTo(User,
        { foreignKey: 'userId', as: 'user' })

    // Wills - Heir - Category
    Will.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
    Category.hasMany(Will, { foreignKey: 'categoryId', as: 'wills' })
    Request.belongsTo(Will, { foreignKey: 'willId', as: 'will' })
    Request.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Request, { foreignKey: 'userId', as: 'requests' })
    Will.hasMany(Request, { foreignKey: 'willId', as: 'requests' })
    Will.belongsToMany(Heir,
        { through: HeirWill, foreignKey: 'willId', otherKey: 'heirId', as: 'heirs' }
    )
    Heir.belongsToMany(Will,
        { through: HeirWill, foreignKey: 'heirId', otherKey: 'willId', as: 'wills' }
    )
    HeirWill.belongsTo(Will, { foreignKey: 'willId', as: 'wills' })
    // Auth Sessions
    Session.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    // Documents
    Document.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Document, { foreignKey: 'userId', as: 'documents' })
    Document.belongsTo(Will, { foreignKey: 'willId', as: 'will' })
    Will.hasOne(Document, { foreignKey: 'willId', as: 'document' })

    // Tickets and Logs
    Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    Ticket.belongsTo(User, { foreignKey: 'adminId', as: 'admin' })
    Log.belongsTo(User, { foreignKey: 'userId', as: 'user' })
    User.hasMany(Log, { foreignKey: 'userId', as: 'logs' })
    Log.belongsTo(User, { foreignKey: 'adminId', as: 'admin' })

    // Memberships
    // Membership.hasOne(User, { foreignKey: 'membershipId' })
}

export default init
