const TaskService = require("../services/TaskService");

const createTask = async (req, res, next) => {
    try {
        const result = await TaskService.createTask(req.body);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getTasks = async (req, res, next) => {
    try {
        const result = await TaskService.getTasks(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateTaskStatus = async (req, res, next) => {
    try {
        const result = await TaskService.updateTaskStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const assignTask = async (req, res, next) => {
    try {
        const result = await TaskService.assignTask(req.params.id, req.body.employeeId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTaskStatus,
    assignTask
};
