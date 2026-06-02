'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_tickets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      ticket_number: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true
      },

      ticket_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'SALE_SUMMARY'
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'ISSUED'
      },

      snapshot: {
        type: Sequelize.JSONB,
        allowNull: false
      },

      issued_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('sale_tickets', ['sale_id']);
    await queryInterface.addIndex('sale_tickets', ['ticket_number']);
    await queryInterface.addIndex('sale_tickets', ['ticket_type']);
    await queryInterface.addIndex('sale_tickets', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sale_tickets');
  }
};