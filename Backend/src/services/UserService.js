const db = require('../models');

const createUser = async (data) => {
    // Basic implementation: hashing is highly recommended in production
    return db.User.create(data);
};

const authenticate = async (email, password) => {
    const user = await db.User.findOne({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    // In production: bcrypt.compareSync(password, user.password)
    if (user.password !== password) throw new Error('Invalid credentials');

    if (!user.active) throw new Error('User is inactive');

    user.last_login = new Date();
    await user.save();

    return user;
};

const updateUser = async (id, data) => {
    const user = await db.User.findByPk(id);
    if (!user) throw new Error('User not found');
    return user.update(data);
};

const getUserById = async (id) => {
    const user = await db.User.findByPk(id, {
        attributes: { exclude: ['password'] }
    });
    if (!user) throw new Error('User not found');
    return user;
};

const getAllUsers = async () => {
    return db.User.findAll({
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
    });
};

module.exports = {
    createUser,
    authenticate,
    updateUser,
    getUserById,
    getAllUsers
};
