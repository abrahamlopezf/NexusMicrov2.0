/**
 * Queue Job Type Constants
 * Single source of truth for all job type identifiers across the queue system.
 * Extend here — never hardcode strings in workers or services.
 */

const SALE_JOBS = {
    SALE_CONFIRMED: 'SALE_CONFIRMED',
    SALE_CANCELLED: 'SALE_CANCELLED'
};

const INVENTORY_JOBS = {
    RESERVE_STOCK:  'RESERVE_STOCK',
    RELEASE_STOCK:  'RELEASE_STOCK',
    CONSUME_STOCK:  'CONSUME_STOCK'
};

const PRODUCTION_JOBS = {
    CREATE_WORK_ORDER: 'CREATE_WORK_ORDER',
    COMPLETE_TASK:     'COMPLETE_TASK'
};

const PAYMENT_JOBS = {
    REGISTER_PAYMENT: 'REGISTER_PAYMENT',
    PROCESS_REFUND:   'PROCESS_REFUND'
};

module.exports = {
    SALE_JOBS,
    INVENTORY_JOBS,
    PRODUCTION_JOBS,
    PAYMENT_JOBS
};
