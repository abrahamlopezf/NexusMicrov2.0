'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cash_movements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      cash_session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cash_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      payment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      movement_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },

      source: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'MANUAL'
      },

      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },

      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      reference: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'ACTIVE'
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      cancellation_reason: {
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

    await queryInterface.addIndex('cash_movements', ['cash_session_id']);
    await queryInterface.addIndex('cash_movements', ['payment_id']);
    await queryInterface.addIndex('cash_movements', ['movement_type']);
    await queryInterface.addIndex('cash_movements', ['source']);
    await queryInterface.addIndex('cash_movements', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cash_movements');
  }
};