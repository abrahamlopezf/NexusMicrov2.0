import React, { useState } from 'react';
import { X, Save, PlusCircle, MinusCircle, History } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const StockAdjustmentModal = ({ material, onClose, onSuccess }) => {
  const [type, setType] = useState('entry'); // entry, exit, adjustment
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const handleAdjustmentSuccess = () => {
      alert('Ajuste de inventario realizado con éxito.');
      window.location.reload();
    };

    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a cero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const adjustQuantity = type === 'exit' ? -parseFloat(quantity) : parseFloat(quantity);
      
      const payload = {
        materialId: material.id,
        quantity: adjustQuantity,
        type: type === 'entry' ? 'ENTRADA_MANUAL' : type === 'exit' ? 'SALIDA_MANUAL' : 'AJUSTE',
        reason: reason || `Ajuste manual de ${type === 'entry' ? 'entrada' : type === 'exit' ? 'salida' : 'stock'}`
      };

      const response = await inventoryService.adjustStock(payload);
      if (response.success) {
        alert('Ajuste de inventario realizado con éxito.');
        window.location.reload();
      } else {
        if (isMounted.current) setError(response.message || 'Error al ajustar el stock');
      }
    } catch (err) {
      if (isMounted.current) setError(err.response?.data?.message || 'Error en el servidor al procesar el ajuste');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Ajustar Inventario</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{material?.name || '...'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('entry')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  type === 'entry' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <PlusCircle size={24} />
                <span className="text-[10px] font-black uppercase">Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setType('exit')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  type === 'exit' ? 'border-rose-500 bg-rose-50 text-rose-500' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <MinusCircle size={24} />
                <span className="text-[10px] font-black uppercase">Salida</span>
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cantidad ({material?.unit || ''})</label>
              <input
                required
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-black text-xl text-slate-700"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Motivo / Notas</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Compra de material, merma, devolución..."
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <History size={16} />
                  Registrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
