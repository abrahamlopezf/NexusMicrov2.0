import React, { useState } from 'react';
import { X, Package, CheckCircle2, AlertTriangle, Layers, DollarSign, ArrowRight } from 'lucide-react';
import inventoryService from '../../../api/inventoryService';

const ConsumeModal = ({ saleId, item, onClose, onSuccess }) => {
  const [step, setStep] = useState('preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [quantities, setQuantities] = useState({});

  const planning = item?.material_planning || {};
  const requirements = planning.requirements || [];

  const handleConsume = async () => {
    try {
      setLoading(true);
      setError(null);

      const hasOverrides = Object.keys(quantities).length > 0;
      const res = await inventoryService.consumePlannedMaterials(
        saleId,
        item.id,
        hasOverrides ? quantities : undefined
      );

      setResult(res?.data || res);
      setStep('result');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consumir materiales');
    } finally {
      setLoading(false);
    }
  };

  const unresolved = requirements.filter(r => r.status !== 'CONSUMED');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${step === 'result' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                {step === 'result' ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : (
                  <Package size={20} className="text-indigo-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {step === 'result' ? 'Materiales Consumidos' : 'Confirmar Consumo'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {step === 'result' ? item.product_name : `#${item.id} · ${item.product_name}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <>
              {unresolved.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold">
                  Todos los materiales ya han sido consumidos.
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Materiales a consumir ({unresolved.length})
                  </p>
                  {unresolved.map((req, idx) => {
                    const reqId = req.material_planning_id || req.id || idx;
                    return (
                      <div key={reqId} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-slate-400" />
                            <span className="font-bold text-slate-800">{req.material?.name || 'Material'}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{req.source || 'PLANNED'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block">Planeado</span>
                            <span className="font-black text-slate-700">{parseFloat(req.planned_quantity).toFixed(2)} {req.unit}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">A consumir</span>
                            <input
                              type="number"
                              step="0.001"
                              value={quantities[reqId] ?? parseFloat(req.planned_quantity).toFixed(3)}
                              onChange={(e) => setQuantities({ ...quantities, [reqId]: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Lote</span>
                            <span className="font-mono font-bold text-slate-600 text-[10px]">{req.lot?.lot_code || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Costo est.</span>
                            <span className="font-black text-slate-700">
                              ${((quantities[reqId] ?? parseFloat(req.planned_quantity)) * parseFloat(req.material?.cost || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {req.lot && (
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                            <Layers size={10} />
                            Lote: {req.lot.lot_code} · Alcance: {req.lot.scope_type || 'GENERAL'} · Stock: {parseFloat(req.lot.stock_quantity).toFixed(2)}
                          </div>
                        )}
                        {req.warning && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-lg flex items-start gap-2 text-[10px] text-amber-700 font-bold">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            {req.warning}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {unresolved.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6 flex items-start gap-3 text-xs text-amber-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">¿Estás seguro de consumir estos materiales?</p>
                    <p className="text-amber-600 mt-1">Esta acción descontará el stock del inventario y registrará movimientos de SALIDA_PRODUCCION.</p>
                  </div>
                </div>
              )}

              {unresolved.length > 0 && (
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button
                    onClick={handleConsume}
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Confirmar Consumo
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step: Result */}
          {step === 'result' && (
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-800 text-lg">Consumo Registrado</h3>
                  <p className="text-sm text-emerald-600 font-medium">Los materiales han sido descontados del inventario correctamente.</p>
                </div>
              </div>

              {result?.consumed_materials?.map((cm, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{cm.material_name || cm.material?.name || 'Material'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Req ID: {cm.material_planning_id || cm.id}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${cm.status === 'CONSUMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {cm.status || 'CONSUMED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold">Cantidad consumida:</span>
                      <p className="font-black text-slate-700">{parseFloat(cm.consumed_quantity || cm.quantity || 0).toFixed(2)} {cm.unit}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Movimiento:</span>
                      <p className="font-mono font-bold text-indigo-600">#{cm.inventory_movement_id || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Stock restante lote:</span>
                      <p className="font-black text-slate-700">{parseFloat(cm.lot_stock_after || cm.remaining_stock || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {result?.errors?.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Errores parciales</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-rose-500">{e.message || e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onSuccess} className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                  Cerrar y Recargar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumeModal;
