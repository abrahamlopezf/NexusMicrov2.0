const { Client, ClientGarment, GarmentMeasurement, GarmentAnnotation, sequelize } = require('../../models');

const AppError = require('../../utils/AppError');

class ClientGarmentService {
    static normalizeGarmentType(type) {
        return String(type || '').trim().toUpperCase();
    }

    static normalizeStatus(status) {
        return String(status || 'ACTIVE').trim().toUpperCase();
    }

    static normalizeNoteType(type) {
        return String(type || 'GENERAL').trim().toUpperCase();
    }

    static validateMeasurementData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('measurement_data must be a valid object', 400);
        }

        if (Object.keys(data).length === 0) {
            throw new AppError('measurement_data cannot be empty', 400);
        }
    }

    static async createGarment(clientId, data = {}, actor = null) {
        const client = await Client.findByPk(clientId);

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        const garmentType = this.normalizeGarmentType(data.garment_type);
        const name = String(data.name || '').trim();

        if (!garmentType) {
            throw new AppError('garment_type is required', 400);
        }

        if (!name) {
            throw new AppError('Garment name is required', 400);
        }

        const garment = await ClientGarment.create({
            client_id: client.id,
            garment_type: garmentType,
            name,
            description: data.description || null,
            status: this.normalizeStatus(data.status),
            notes: data.notes || null,
            created_by: actor?.id || null
        }, {
            userId: actor?.id || null
        });

        return garment;
    }

    static async getGarmentsByClient(clientId) {
        const client = await Client.findByPk(clientId);

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        return ClientGarment.findAll({
            where: { client_id: clientId },
            include: [
                {
                    model: GarmentMeasurement,
                    as: 'measurements',
                    required: false,
                    order: [['version', 'DESC']]
                },
                {
                    model: GarmentAnnotation,
                    as: 'annotations',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    static async getGarmentById(garmentId) {
        const garment = await ClientGarment.findByPk(garmentId, {
            include: [
                {
                    model: Client,
                    as: 'client'
                },
                {
                    model: GarmentMeasurement,
                    as: 'measurements',
                    required: false,
                    include: [
                        {
                            model: GarmentAnnotation,
                            as: 'annotations',
                            required: false
                        }
                    ]
                },
                {
                    model: GarmentAnnotation,
                    as: 'annotations',
                    required: false
                }
            ],
            order: [
                [{ model: GarmentMeasurement, as: 'measurements' }, 'version', 'DESC'],
                [{ model: GarmentAnnotation, as: 'annotations' }, 'created_at', 'DESC']
            ]
        });

        if (!garment) {
            throw new AppError('Garment not found', 404);
        }

        return garment;
    }

    static async updateGarment(garmentId, data = {}, actor = null) {
        const garment = await ClientGarment.findByPk(garmentId);

        if (!garment) {
            throw new AppError('Garment not found', 404);
        }

        const payload = {};

        if (data.garment_type !== undefined) {
            const garmentType = this.normalizeGarmentType(data.garment_type);

            if (!garmentType) {
                throw new AppError('garment_type cannot be empty', 400);
            }

            payload.garment_type = garmentType;
        }

        if (data.name !== undefined) {
            const name = String(data.name || '').trim();

            if (!name) {
                throw new AppError('Garment name cannot be empty', 400);
            }

            payload.name = name;
        }

        if (data.description !== undefined) {
            payload.description = data.description || null;
        }

        if (data.status !== undefined) {
            payload.status = this.normalizeStatus(data.status);
        }

        if (data.notes !== undefined) {
            payload.notes = data.notes || null;
        }

        payload.updated_by = actor?.id || null;

        await garment.update(payload, {
            userId: actor?.id || null
        });

        return garment;
    }

    static async deleteGarment(garmentId, actor = null) {
        const garment = await ClientGarment.findByPk(garmentId);

        if (!garment) {
            throw new AppError('Garment not found', 404);
        }

        await garment.destroy({
            userId: actor?.id || null
        });

        return {
            deleted: true,
            garment_id: Number(garmentId)
        };
    }

    static async createMeasurement(garmentId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const garment = await ClientGarment.findByPk(garmentId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!garment) {
                throw new AppError('Garment not found', 404);
            }

            this.validateMeasurementData(data.measurement_data);

            const lastMeasurement = await GarmentMeasurement.findOne({
                where: { client_garment_id: garment.id },
                order: [['version', 'DESC']],
                transaction: t
            });

            const nextVersion = lastMeasurement
                ? Number(lastMeasurement.version || 0) + 1
                : 1;

            const setActive = data.is_active !== undefined
                ? Boolean(data.is_active)
                : true;

            if (setActive) {
                await GarmentMeasurement.update(
                    { is_active: false },
                    {
                        where: { client_garment_id: garment.id },
                        transaction: t,
                        userId: actor?.id || null
                    }
                );
            }

            const measurement = await GarmentMeasurement.create({
                client_garment_id: garment.id,
                version: nextVersion,
                measurement_data: data.measurement_data,
                unit: String(data.unit || 'CM').toUpperCase(),
                notes: data.notes || null,
                is_active: setActive,
                taken_by: data.taken_by || actor?.id || null,
                created_by: actor?.id || null
            }, {
                transaction: t,
                userId: actor?.id || null
            });

            return measurement;
        });
    }

    static async updateMeasurement(measurementId, data = {}, actor = null) {
        const measurement = await GarmentMeasurement.findByPk(measurementId);

        if (!measurement) {
            throw new AppError('Measurement not found', 404);
        }

        const payload = {};

        if (data.measurement_data !== undefined) {
            this.validateMeasurementData(data.measurement_data);
            payload.measurement_data = data.measurement_data;
        }

        if (data.unit !== undefined) {
            payload.unit = String(data.unit || 'CM').toUpperCase();
        }

        if (data.notes !== undefined) {
            payload.notes = data.notes || null;
        }

        payload.updated_by = actor?.id || null;

        await measurement.update(payload, {
            userId: actor?.id || null
        });

        return measurement;
    }

    static async activateMeasurement(measurementId, actor = null) {
        return sequelize.transaction(async (t) => {
            const measurement = await GarmentMeasurement.findByPk(measurementId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!measurement) {
                throw new AppError('Measurement not found', 404);
            }

            await GarmentMeasurement.update(
                { is_active: false },
                {
                    where: {
                        client_garment_id: measurement.client_garment_id
                    },
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            await measurement.update({
                is_active: true,
                updated_by: actor?.id || null
            }, {
                transaction: t,
                userId: actor?.id || null
            });

            return measurement;
        });
    }

    static async deleteMeasurement(measurementId, actor = null) {
        const measurement = await GarmentMeasurement.findByPk(measurementId);

        if (!measurement) {
            throw new AppError('Measurement not found', 404);
        }

        await measurement.destroy({
            userId: actor?.id || null
        });

        return {
            deleted: true,
            measurement_id: Number(measurementId)
        };
    }

    static async createAnnotation(data = {}, actor = null) {
        const garmentId = data.client_garment_id || data.garment_id;
        const measurementId = data.measurement_id || null;

        if (!garmentId) {
            throw new AppError('client_garment_id is required', 400);
        }

        const garment = await ClientGarment.findByPk(garmentId);

        if (!garment) {
            throw new AppError('Garment not found', 404);
        }

        if (measurementId) {
            const measurement = await GarmentMeasurement.findByPk(measurementId);

            if (!measurement) {
                throw new AppError('Measurement not found', 404);
            }

            if (Number(measurement.client_garment_id) !== Number(garmentId)) {
                throw new AppError('Measurement does not belong to this garment', 400);
            }
        }

        const note = String(data.note || '').trim();

        if (!note) {
            throw new AppError('Annotation note is required', 400);
        }

        const annotation = await GarmentAnnotation.create({
            client_garment_id: garmentId,
            measurement_id: measurementId,
            note_type: this.normalizeNoteType(data.note_type),
            note,
            created_by: actor?.id || null
        }, {
            userId: actor?.id || null
        });

        return annotation;
    }

    static async updateAnnotation(annotationId, data = {}, actor = null) {
        const annotation = await GarmentAnnotation.findByPk(annotationId);

        if (!annotation) {
            throw new AppError('Annotation not found', 404);
        }

        const payload = {};

        if (data.note_type !== undefined) {
            payload.note_type = this.normalizeNoteType(data.note_type);
        }

        if (data.note !== undefined) {
            const note = String(data.note || '').trim();

            if (!note) {
                throw new AppError('Annotation note cannot be empty', 400);
            }

            payload.note = note;
        }

        payload.updated_by = actor?.id || null;

        await annotation.update(payload, {
            userId: actor?.id || null
        });

        return annotation;
    }

    static async deleteAnnotation(annotationId, actor = null) {
        const annotation = await GarmentAnnotation.findByPk(annotationId);

        if (!annotation) {
            throw new AppError('Annotation not found', 404);
        }

        await annotation.destroy({
            userId: actor?.id || null
        });

        return {
            deleted: true,
            annotation_id: Number(annotationId)
        };
    }

    static async getAnnotationsByGarment(garmentId) {
        const garment = await ClientGarment.findByPk(garmentId);

        if (!garment) {
            throw new AppError('Garment not found', 404);
        }

        return GarmentAnnotation.findAll({
            where: {
                client_garment_id: garmentId
            },
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = ClientGarmentService;