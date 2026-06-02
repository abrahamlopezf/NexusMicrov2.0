const UserService = require('./user.service');

const createUser = async (req, res, next) => {
    try {
        const result = await UserService.createUser(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const result = await UserService.getUsers(req.query);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const result = await UserService.getUserById(req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const result = await UserService.updateUser(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const result = await UserService.deleteUser(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};