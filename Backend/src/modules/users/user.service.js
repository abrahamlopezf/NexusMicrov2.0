const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const db = require('../../models');
const AppError = require('../../utils/AppError');

const {
    ROLES,
    normalizeRole,
    canCreateRole,
    canChangeRole,
    canManageUser
} = require('../../utils/permissions');

class UserService {
    static sanitizeUser(user) {
        if (!user) return null;

        const plain = user.toJSON ? user.toJSON() : user;
        delete plain.password;

        return plain;
    }

    static async ensureLastSuperAdminIsProtected(targetUser, data = {}) {
        if (targetUser.role !== ROLES.SUPER_ADMIN) return;

        const wantsToDeactivate = data.active === false;
        const wantsToChangeRole = data.role && normalizeRole(data.role) !== ROLES.SUPER_ADMIN;

        if (!wantsToDeactivate && !wantsToChangeRole) return;

        const superAdminCount = await db.User.count({
            where: {
                role: ROLES.SUPER_ADMIN,
                active: true
            }
        });

        if (superAdminCount <= 1) {
            throw new AppError('Cannot modify or deactivate the last active SUPER_ADMIN', 400);
        }
    }

    static async createUser(data = {}, actor = null) {
        if (!actor || !actor.role) {
            throw new AppError('Authenticated actor is required', 401);
        }

        const name = String(data.name || '').trim();
        const email = String(data.email || '').trim().toLowerCase();
        const password = String(data.password || '');
        const role = normalizeRole(data.role || ROLES.EMPLOYEE);

        if (!name) {
            throw new AppError('Name is required', 400);
        }

        if (!email) {
            throw new AppError('Email is required', 400);
        }

        if (!password || password.length < 6) {
            throw new AppError('Password must be at least 6 characters', 400);
        }

        if (!Object.values(ROLES).includes(role)) {
            throw new AppError('Invalid role', 400);
        }

        if (!canCreateRole(actor.role, role)) {
            throw new AppError(`You are not allowed to create user with role ${role}`, 403);
        }

        const existingUser = await db.User.findOne({
            where: { email }
        });

        if (existingUser) {
            throw new AppError('Email is already registered', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.User.create({
            name,
            email,
            password: hashedPassword,
            role,
            active: data.active !== undefined ? Boolean(data.active) : true
        }, {
            userId: actor.id || null
        });

        return this.sanitizeUser(user);
    }

    static async getUsers(query = {}) {
        const where = {};

        if (query.role) {
            where.role = normalizeRole(query.role);
        }

        if (query.active !== undefined) {
            where.active = String(query.active) === 'true';
        }

        if (query.search) {
            const search = `%${String(query.search).trim()}%`;

            where[Op.or] = [
                { name: { [Op.iLike]: search } },
                { email: { [Op.iLike]: search } }
            ];
        }

        const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
        const page = Math.max(parseInt(query.page, 10) || 1, 1);
        const offset = (page - 1) * limit;

        const result = await db.User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            count: result.count,
            page,
            limit,
            data: result.rows
        };
    }

    static async getUserById(id) {
        const user = await db.User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    static async updateUser(id, data = {}, actor = null) {
        if (!actor || !actor.role) {
            throw new AppError('Authenticated actor is required', 401);
        }

        const user = await db.User.findByPk(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isSelf = String(actor.id) === String(user.id);

        await this.ensureLastSuperAdminIsProtected(user, data);

        const updateData = {};

        if (data.name !== undefined) {
            updateData.name = String(data.name || '').trim();

            if (!updateData.name) {
                throw new AppError('Name cannot be empty', 400);
            }
        }

        if (data.email !== undefined) {
            const newEmail = String(data.email || '').trim().toLowerCase();

            if (!newEmail) {
                throw new AppError('Email cannot be empty', 400);
            }

            const existingUser = await db.User.findOne({
                where: {
                    email: newEmail,
                    id: { [Op.ne]: user.id }
                }
            });

            if (existingUser) {
                throw new AppError('Email is already registered', 400);
            }

            updateData.email = newEmail;
        }

        if (data.password !== undefined && data.password !== '') {
            const newPassword = String(data.password);

            if (newPassword.length < 6) {
                throw new AppError('Password must be at least 6 characters', 400);
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        if (data.role !== undefined) {
            const newRole = normalizeRole(data.role);

            if (!Object.values(ROLES).includes(newRole)) {
                throw new AppError('Invalid role', 400);
            }

            if (isSelf) {
                throw new AppError('You cannot change your own role', 400);
            }

            if (!canChangeRole(actor.role, user.role, newRole)) {
                throw new AppError('You are not allowed to change this user role', 403);
            }

            updateData.role = newRole;
        }

        if (data.active !== undefined) {
            if (isSelf && data.active === false) {
                throw new AppError('You cannot deactivate your own account', 400);
            }

            if (!canManageUser(actor.role, user.role)) {
                throw new AppError('You are not allowed to change this user status', 403);
            }

            updateData.active = Boolean(data.active);
        }

        // Si no es cambio propio, debe poder administrar al usuario.
        if (!isSelf && !canManageUser(actor.role, user.role)) {
            throw new AppError('You are not allowed to update this user', 403);
        }

        await user.update(updateData, {
            userId: actor.id || null
        });

        return this.sanitizeUser(user);
    }

    static async deleteUser(id, actor = null) {
        if (!actor || !actor.role) {
            throw new AppError('Authenticated actor is required', 401);
        }

        const user = await db.User.findByPk(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (String(actor.id) === String(user.id)) {
            throw new AppError('You cannot deactivate your own account', 400);
        }

        if (!canManageUser(actor.role, user.role)) {
            throw new AppError('You are not allowed to deactivate this user', 403);
        }

        await this.ensureLastSuperAdminIsProtected(user, {
            active: false
        });

        await user.update({
            active: false
        }, {
            userId: actor.id || null
        });

        return this.sanitizeUser(user);
    }
}

module.exports = UserService;