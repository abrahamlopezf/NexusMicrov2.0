const ClientService = require('../services/ClientService');

const createClient = async (req, res, next) => {
    try {
        const result = await ClientService.createClient(req.body);
        res.status(201).json({
            success: true,
            data: result.toJSON ? result.toJSON() : result
        });
    } catch (error) {
        next(error);
    }
};

const getClients = async (req, res, next) => {
    try {
        const result = await ClientService.getAllClients(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getClientById = async (req, res, next) => {
    try {
        const result = await ClientService.getClientById(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateClient = async (req, res, next) => {
    try {
        const result = await ClientService.updateClient(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: result.toJSON ? result.toJSON() : result
        });
    } catch (error) {
        next(error);
    }
};

const deleteClient = async (req, res, next) => {
    try {
        const result = await ClientService.deleteClient(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient
};
