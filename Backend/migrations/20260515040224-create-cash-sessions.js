'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cash_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'OPEN'
      },

      opening_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },

      expected_closing_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },

      actual_closing_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },

      difference_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },

      opened_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      closed_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      opened_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      closed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      closing_notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('cash_sessions', ['status']);
    await queryInterface.addIndex('cash_sessions', ['opened_by']);
    await queryInterface.addIndex('cash_sessions', ['opened_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cash_sessions');
  }
};