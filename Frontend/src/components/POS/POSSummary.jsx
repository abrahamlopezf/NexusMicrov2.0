import React, { useEffect } from 'react';
import { usePosStore } from '../../store/posStore';

export const POSSummary = ({ sessionId }) => {
  const session = usePosStore(state => state.sessions[sessionId]);
  const updateSessionTotals = usePosStore(state => state.updateSessionTotals);

  // Recalculate totals whenever items change
  useEffect(() => {
    if (!session) return;
    
    const subtotal = session.items.reduce((acc, row) => acc + Number(row.total || 0), 0);
    const discount = session.totals.discount || 0;
    const total = subtotal - discount;
    const advance = session.totals.advance || 0;
    const balance = total - advance;

    if (
      subtotal !== session.totals.subtotal ||
      total !== session.totals.total ||
      balance !== session.totals.balance
    ) {
      updateSessionTotals(sessionId, { subtotal, discount, total, advance, balance });
    }
  }, [session?.items, session?.totals.discount, session?.totals.advance, sessionId, updateSessionTotals]);

  if (!session) return null;
  const { totals } = session;

  const handleManualChange = (field, value) => {
    updateSessionTotals(sessionId, { ...totals, [field]: Number(value) });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 sticky top-6">
      <h3 className="font-bold text-gray-800 border-b pb-2">Resumen Venta</h3>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="font-mono font-medium">${totals.subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Descuento Global</span>
        <input 
          type="number" min="0" step="0.01"
          value={totals.discount}
          onChange={(e) => handleManualChange('discount', e.target.value)}
          className="w-24 text-right bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
        <span className="text-gray-800">Total</span>
        <span className="font-mono text-blue-600">${totals.total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm mt-2 border-t pt-3">
        <span className="text-gray-500">Anticipo Cliente</span>
        <input 
          type="number" min="0" step="0.01"
          value={totals.advance}
          onChange={(e) => handleManualChange('advance', e.target.value)}
          className="w-24 text-right bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex justify-between items-center text-sm font-bold bg-gray-50 p-2 rounded-md">
        <span className="text-gray-700">Saldo Restante</span>
        <span className="font-mono text-gray-900">${totals.balance.toFixed(2)}</span>
      </div>
    </div>
  );
};
