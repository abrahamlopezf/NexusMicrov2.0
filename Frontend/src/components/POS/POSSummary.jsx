import React, { useEffect } from 'react';
import { usePosStore } from '../../store/posStore';
import { Package, Check, AlertCircle, Scissors } from 'lucide-react';

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
  const { totals, posSummary } = session;

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

      {/* Material Planning Section - visible after sale is confirmed */}
      {posSummary && posSummary.items && (
        <>
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Scissors size={16} className="text-indigo-500" />
              <h4 className="font-bold text-gray-800 text-sm">Planeación de Materiales</h4>
            </div>
            {posSummary.items.map(item => {
              const planning = item.material_planning || {};
              const status = planning.status || {};
              const isReady = status.is_material_planning_ready;
              const hasPending = status.has_pending_selectable_materials;
              const allConsumed = planning.requirements?.length > 0 && planning.requirements.every(r => r.status === 'CONSUMED');
              const isConsumed = allConsumed;

              const statusBadge = isConsumed ? (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">Consumido</span>
              ) : hasPending ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider">Tela Pendiente</span>
              ) : isReady ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider">Listo</span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-wider">En Proceso</span>
              );

              return (
                <div key={item.id} className="mb-3 pb-3 border-b border-slate-50 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-slate-600 truncate">
                      {item.product_name || item.custom_description || `Item #${item.id}`}
                    </p>
                    {statusBadge}
                  </div>
                  {planning.requirements && planning.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {planning.requirements.slice(0, 4).map((req, idx) => (
                        <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                          req.status === 'CONSUMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {req.material?.name || 'Material'}: {parseFloat(req.planned_quantity).toFixed(2)} {req.unit || ''}
                        </span>
                      ))}
                      {planning.requirements.length > 4 && (
                        <span className="text-[9px] text-slate-400 font-bold">+{planning.requirements.length - 4} más</span>
                      )}
                    </div>
                  )}
                  {(!planning.requirements || planning.requirements.length === 0) && (
                    <p className="text-[9px] text-slate-400 italic">Sin requerimientos</p>
                  )}
                </div>
              );
            })}
          </div>

          {session.saleId && (
            <a
              href={`/sales/${session.saleId}`}
              className="text-center text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest underline underline-offset-2"
            >
              Ir a detalle de venta
            </a>
          )}
        </>
      )}
    </div>
  );
};
