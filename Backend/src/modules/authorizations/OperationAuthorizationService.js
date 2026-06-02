const bcrypt = require('bcryptjs');
const { OperationAuthorization, User } = require('../../models');
const AppError = require('../../utils/AppError');

class OperationAuthorizationService {

    static getUserRole(user) {
        return String(user?.role || '').toUpperCase();
    }

    static isPrivileged(user) {
        const role = this.getUserRole(user);
        return role === 'ADMIN' || role === 'MANAGER';
    }

    static getPasswordHash(user) {
        return (
            user.password_hash ||
            user.passwordHash ||
            user.password ||
            null
        );
    }

    static async verifyManagerPassword(manager, password) {
        if (!password) {
            throw new AppError('Manager password is required for authorization', 400);
        }

        const passwordHash = this.getPasswordHash(manager);

        if (!passwordHash) {
            throw new AppError('Manager user does not have a valid password field configured', 500);
        }

        const isValid = await bcrypt.compare(password, passwordHash);

        if (!isValid) {
            throw new AppError('Invalid manager authorization credentials', 401);
        }

        return true;
    }

    static async authorizeOperation({
        operationType,
        targetType,
        targetId = null,
        requestedBy,
        reason,
        managerAuthorization = null,
        metadata = null,
        forceManagerApproval = false,
        transaction = null
    }) {
        if (!operationType) {
            throw new AppError('operationType is required', 400);
        }

        if (!targetType) {
            throw new AppError('targetType is required', 400);
        }

        if (!reason || !String(reason).trim()) {
            throw new AppError('Authorization reason is required', 400);
        }

        if (!requestedBy) {
            throw new AppError('requestedBy user is required', 400);
        }

        const requester = await User.findByPk(requestedBy, { transaction });

        if (!requester) {
            throw new AppError('Requester user not found', 404);
        }

        const requesterIsPrivileged = this.isPrivileged(requester);

        // Admin/Manager puede autorizarse automáticamente salvo que se fuerce aprobación externa.
        if (requesterIsPrivileged && !forceManagerApproval) {
            return await OperationAuthorization.create({
                operation_type: operationType,
                target_type: targetType,
                target_id: targetId ? String(targetId) : null,
                status: 'APPROVED',
                authorization_mode: 'SELF_PRIVILEGED',
                requested_by: requestedBy,
                authorized_by: requestedBy,
                reason,
                metadata,
                authorized_at: new Date()
            }, { transaction, userId: requestedBy });
        }

        if (!managerAuthorization || !managerAuthorization.manager_user_id) {
            throw new AppError('Manager authorization is required for this operation', 403);
        }

        const manager = await User.findByPk(managerAuthorization.manager_user_id, {
            transaction
        });

        if (!manager) {
            throw new AppError('Manager user not found', 404);
        }

        if (!this.isPrivileged(manager)) {
            throw new AppError('Authorizing user must be ADMIN or MANAGER', 403);
        }

        await this.verifyManagerPassword(
            manager,
            managerAuthorization.password
        );

        return await OperationAuthorization.create({
            operation_type: operationType,
            target_type: targetType,
            target_id: targetId ? String(targetId) : null,
            status: 'APPROVED',
            authorization_mode: 'MANAGER_PASSWORD',
            requested_by: requestedBy,
            authorized_by: manager.id,
            reason,
            metadata,
            authorized_at: new Date()
        }, { transaction, userId: requestedBy });
    }
}

module.exports = OperationAuthorizationService;