import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Package, Layers, FileText, Truck, DollarSign } from 'lucide-react';
import purchaseService from '../../api/purchaseService';

const PurchaseDetailModal = ({ purchaseId, onClose }) => {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchaseId) {
      setLoading(true);
      purchaseService.getPurchaseById(purchaseId)
        .then(res => setPurchase(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [purchaseId]);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando detalle...</p>
      </div>
    </div>
  );

  if (!purchase) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <ShoppingBag size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Compra #{purchase.purchase_number}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Detalle de orden de compra</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              <Truck size={14} /> Proveedor
            </div>
            <p className="font-black text-slate-900">{purchase.supplier?.name || 'Desconocido'}</p>
            {purchase.reference && (
              <p className="text-xs text-slate-500 mt-1">Ref: {purchase.reference}</p>
            )}
            {purchase.notes && (
              <p className="text-xs text-slate-500 mt-1 italic">{purchase.notes}</p>
            )}
          </div>

          {/* Items */}
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package size={14} /> Materiales ({purchase.items?.length || 0})
          </h3>

          <div className="space-y-4 mb-6">
            {purchase.items?.map((item, idx) => (
              <div key={item.id || idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{item.material?.name || 'Material'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {item.material_id}</p>
                  </div>
                  <span className="font-black text-slate-900">
                    ${parseFloat(item.total || item.quantity * item.unit_cost || 0).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold">Cantidad:</span>
                    <span className="ml-1 font-black text-slate-700">{parseFloat(item.quantity).toFixed(2)} {item.material?.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Costo unit.:</span>
                    <span className="ml-1 font-black text-slate-700">${parseFloat(item.unit_cost).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Alcance:</span>
                    <span className="ml-1 font-black text-slate-700 uppercase">{item.scope_type || 'GENERAL'}</span>
                  </div>
                </div>

                {/* Lot info */}
                {item.lot && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
                    <Layers size={12} className="text-emerald-500" />
                    <span className="text-slate-500 font-bold">Lote generado:</span>
                    <span className="font-mono font-black text-emerald-700">{item.lot.lot_code}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">Stock: {parseFloat(item.lot.stock_quantity).toFixed(2)}</span>
                  </div>
                )}

                {/* Movement info */}
                {item.inventory_movement && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <FileText size={12} className="text-indigo-500" />
                    <span className="text-slate-500 font-bold">Movimiento:</span>
                    <span className="font-mono font-black text-indigo-700">#{item.inventory_movement.id}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{item.inventory_movement.type}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex justify-between items-center">
            <span className="text-sm font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={16} /> Total
            </span>
            <span className="text-2xl font-black text-indigo-700">
              ${parseFloat(purchase.total || purchase.subtotal || 0).toLocaleString()}
            </span>
          </div>

          {purchase.notes && (
            <div className="mt-4 text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl">
              {purchase.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailModal;
