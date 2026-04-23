const ClientRepository = require('../repositories/client.repository');

const createClient = async (data) => {
    return ClientRepository.create(data);
};

const updateClient = async (id, data) => {
    const updated = await ClientRepository.update(id, data);
    if (!updated) throw new Error('Client not found');
    return updated;
};

const deleteClient = async (id) => {
    const deleted = await ClientRepository.delete(id);
    if (!deleted) throw new Error('Client not found');
    return true;
};

const getClientById = async (id) => {
    const client = await ClientRepository.findByIdWithRelations(id);
    if (!client) throw new Error('Client not found');
    return client;
};

const getAllClients = async () => {
    return ClientRepository.findAllDesc();
};

module.exports = {
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getAllClients
};
