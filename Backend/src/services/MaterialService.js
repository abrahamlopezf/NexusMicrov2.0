const { Material } = require('../models');
const AppError = require('../utils/AppError');

class MaterialService {
    static async createMaterial(data) {
        return await Material.create(data);
    }

    static async getAllMaterials() {
        return await Material.findAll({
            order: [['name', 'ASC']]
        });
    }

    static async getMaterialById(id) {
        const material = await Material.findByPk(id);
        if (!material) throw new AppError('Material no encontrado', 404);
        return material;
    }

    static async updateMaterial(id, data) {
        const material = await Material.findByPk(id);
        if (!material) throw new AppError('Material no encontrado', 404);
        
        await material.update(data);
        return material;
    }

    static async deleteMaterial(id) {
        const material = await Material.findByPk(id);
        if (!material) throw new AppError('Material no encontrado', 404);
        
        await material.destroy();
        return null;
    }
}

module.exports = MaterialService;
