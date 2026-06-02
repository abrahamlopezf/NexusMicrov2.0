const accountService = require('../finance/FinanceService');

const createAccount = async (req, res, next) => {
    try {
        const account = await accountService.createAccount(req.body);
        res.status(201).json({
            success: true,
            data: account
        });
    } catch (error) {
        next(error);
    }
};

const getAllAccounts = async (req, res, next) => {
    try {
        const accounts = await accountService.getAllAccounts();
        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error) {
        next(error);
    }
};

const getAccountById = async (req, res, next) => {
    try {
        const account = await accountService.getAccountById(req.params.id);
        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        next(error);
    }
};

const updateAccount = async (req, res, next) => {
    try {
        const account = await accountService.updateAccount(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        await accountService.deleteAccount(req.params.id);
        res.status(200).json({
            success: true,
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccount,
    deleteAccount
};