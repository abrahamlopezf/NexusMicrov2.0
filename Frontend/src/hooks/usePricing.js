import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const LABOR_RATE_SEWING = 44.38;
const LABOR_RATE_PATTERN = 50.50;
const SUPPLY_TIERS = {
  SENCILLO: 30,
  MEDIO: 45,
  COMPLEJO: 60
};
const OPERATION_MARGIN = 0.14;
const PROFIT_MARGIN = 0.20;

export const usePricing = () => {
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const calculateRow = useCallback((row, manualPriceOverride = null) => {
    // 1. Calculate Base Cost
    const laborCost = (Number(row.hours_sewing || 0) * LABOR_RATE_SEWING) +
                      (Number(row.hours_pattern || 0) * LABOR_RATE_PATTERN);
    
    const fixedSupply = SUPPLY_TIERS[row.supply_level || 'SENCILLO'] || 30;

    const extraMaterialsCost = (row.extra_materials || []).reduce((acc, mat) => {
      return acc + (Number(mat.quantity) * Number(mat.unit_price));
    }, 0);

    const cost = laborCost + fixedSupply + extraMaterialsCost;

    // 2. Apply Margins
    const costWithOperation = cost * (1 + OPERATION_MARGIN);
    const suggestedPrice = costWithOperation * (1 + PROFIT_MARGIN);

    // 3. Determine Final Price
    let finalUnitPrice = suggestedPrice;

    // Role Enforcement: Only ADMIN/MANAGER can override price
    if (manualPriceOverride !== null && manualPriceOverride !== undefined) {
      if (isAdminOrManager) {
        finalUnitPrice = Number(manualPriceOverride);
      } else {
        // Enforce fallback to suggested if a SELLER tries to inject manualPriceOverride
        console.warn('RBAC Violation: Attempt to modify price by non-admin role. Denied.');
      }
    }

    const total = finalUnitPrice * Number(row.quantity || 1);

    return {
      cost: cost.toFixed(2),
      costWithOperation: costWithOperation.toFixed(2),
      suggestedPrice: suggestedPrice.toFixed(2),
      finalUnitPrice: finalUnitPrice.toFixed(2),
      total: total.toFixed(2)
    };
  }, [isAdminOrManager]);

  return { calculateRow, isAdminOrManager };
};
