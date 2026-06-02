'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('operation_authorizations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      operation_type: {
        type: Sequelize.STRING(80),
        allowNull: false
      },

      target_type: {
        type: Sequelize.STRING(80),
        allowNull: false
      },

      target_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'APPROVED'
      },

      authorization_mode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'MANAGER_PASSWORD'
      },

      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      authorized_by: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      authorized_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('operation_authorizations', ['operation_type']);
    await queryInterface.addIndex('operation_authorizations', ['target_type', 'target_id']);
    await queryInterface.addIndex('operation_authorizations', ['requested_by']);
    await queryInterface.addIndex('operation_authorizations', ['authorized_by']);
    await queryInterface.addIndex('operation_authorizations', ['status']);
    await queryInterface.addIndex('operation_authorizations', ['authorized_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('operation_authorizations');
  }
};