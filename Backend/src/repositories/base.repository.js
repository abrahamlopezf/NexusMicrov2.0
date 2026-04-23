class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async bulkCreate(data, options = {}) {
    return this.model.bulkCreate(data, options);
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findAndCountAll(options = {}) {
    return this.model.findAndCountAll(options);
  }

  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async update(id, data, options = {}) {
    const record = await this.findById(id, options);
    if (!record) return null;
    return record.update(data, options);
  }

  async delete(id, options = {}) {
    const record = await this.findById(id, options);
    if (!record) return false;
    await record.destroy(options);
    return true;
  }

  async sum(field, options = {}) {
    return this.model.sum(field, options);
  }

  async count(options = {}) {
    return this.model.count(options);
  }
}

module.exports = BaseRepository;
