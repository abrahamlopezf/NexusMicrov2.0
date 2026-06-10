import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, MinusCircle, History, Layers, Hash } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const StockAdjustmentModal = ({ material, onClose }) => {
  const [type, setType] = useState('entry');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [lots, setLots] = useState([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMounted = React.useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (type !== 'entry' && material?.id) {
      fetchLots();
    }
  }, [type, material?.id]);

  const fetchLots = async () => {
    try {
      setLoadingLots(true);
      const response = await inventoryService.getMaterialDetail(material.id);
      if (isMounted.current && response?.success) {
        setLots(response.data?.lots || []);
      }
    } catch (err) {
      console.error('Error fetching lots:', err);
    } finally {
      if (isMounted.current) setLoadingLots(false);
    }
  };

  const getMovementType = () => {
    if (type === 'entry') return 'ENTRADA_MANUAL';
    if (type === 'exit') return 'SALIDA_MANUAL';
    return 'AJUSTE';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a cero');
      return;
    }

    if (type !== 'entry' && !selectedLotId) {
      setError('Debe seleccionar un lote');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        material_id: material.id,
        type: getMovementType(),
        quantity: parseFloat(quantity),
        notes: reason || getMovementType() === 'ENTRADA_MANUAL' ? 'Entrada manual' : getMovementType() === 'SALIDA_MANUAL' ? 'Salida manual' : 'Ajuste de stock'
      };

      if (type !== 'entry') {
        payload.material_lot_id = parseInt(selectedLotId);
      }

      const response = await inventoryService.adjustStock(payload);
      if (response.success) {
        alert('Movimiento registrado con éxito.');
        window.location.reload();
      } else {
        if (isMounted.current) setError(response.message || 'Error al registrar el movimiento');
      }
    } catch (err) {
      if (isMounted.current) setError(err.response?.data?.message || 'Error en el servidor');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const activeLots = lots.filter(l => l.status === 'ACTIVE' && parseFloat(l.stock_quantity) > 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Movimiento de Inventario</h2>
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('entry')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'entry' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <PlusCircle size={20} />
                <span className="text-[9px] font-black uppercase">Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setType('exit')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'exit' ? 'border-rose-500 bg-rose-50 text-rose-500' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <MinusCircle size={20} />
                <span className="text-[9px] font-black uppercase">Salida</span>
              </button>
              <button
                type="button"
                onClick={() => setType('adjustment')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'adjustment' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <Layers size={20} />
                <span className="text-[9px] font-black uppercase">Ajuste</span>
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cantidad ({material?.unit || ''})</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-black text-xl text-slate-700"
              />
            </div>

            {/* Lot selection for non-entry movements */}
            {type !== 'entry' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Lote de origen</label>
                {loadingLots ? (
                  <p className="text-xs text-indigo-500 font-bold animate-pulse px-1">Cargando lotes...</p>
                ) : activeLots.length === 0 ? (
                  <p className="text-xs text-rose-500 font-bold px-1">No hay lotes disponibles con stock</p>
                ) : (
                  <select
                    value={selectedLotId}
                    onChange={(e) => setSelectedLotId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700"
                  >
                    <option value="">-- Seleccionar lote --</option>
                    {activeLots.map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lot_code} — {parseFloat(lot.stock_quantity).toFixed(2)} {material?.unit} (${parseFloat(lot.unit_cost || 0).toFixed(2)}/un)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Current stock info */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Stock actual</span>
                <span className="font-black text-slate-700">{parseFloat(material?.current_stock || 0).toFixed(2)} {material?.unit}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Disponible</span>
                <span className="font-black text-emerald-600">{parseFloat(material?.available_stock || 0).toFixed(2)} {material?.unit}</span>
              </div>
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
              disabled={loading || (type !== 'entry' && activeLots.length === 0)}
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
