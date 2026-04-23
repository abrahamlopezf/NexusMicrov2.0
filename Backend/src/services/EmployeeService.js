const db = require('../models');

const createEmployee = async (data) => {
    return db.Employee.create(data);
};

const updateEmployee = async (id, data) => {
    const employee = await db.Employee.findByPk(id);
    if (!employee) throw new Error('Employee not found');
    return employee.update(data);
};

const getEmployeeById = async (id) => {
    const employee = await db.Employee.findByPk(id, {
        include: [{ model: db.ProductionTask, as: 'production_tasks' }]
    });
    if (!employee) throw new Error('Employee not found');
    return employee;
};

const getAllEmployees = async () => {
    return db.Employee.findAll({
        order: [['created_at', 'DESC']]
    });
};

const assignTaskToEmployee = async (taskId, employeeId) => {
    const task = await db.ProductionTask.findByPk(taskId);
    if (!task) throw new Error('Task not found');

    const employee = await db.Employee.findByPk(employeeId);
    if (!employee) throw new Error('Employee not found');

    task.employee_id = employeeId;
    await task.save();

    return task;
};

module.exports = {
    createEmployee,
    updateEmployee,
    getEmployeeById,
    getAllEmployees,
    assignTaskToEmployee
};
