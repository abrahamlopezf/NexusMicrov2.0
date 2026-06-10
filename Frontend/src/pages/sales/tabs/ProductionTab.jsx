import React, { useState, useEffect } from 'react';
import { Package, Scissors, Check, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../../api/axios';
import ConsumeModal from './ConsumeModal';

export const ProductionTab = ({ posSummary, saleId, onReload }) => {
  const [materials, setMaterials] = useState([]);
  const [reusables, setReusables] = useState([]);
  const [selectingItem, setSelectingItem] = useState(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedReusableId, setSelectedReusableId] = useState('');
  const [consumeItem, setConsumeItem] = useState(null);

  useEffect(() => {
    api.get('/materials?inventory_type=FABRIC')
      .then(res => {
        setMaterials(res.data?.data || res.data || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedMaterialId) {
      api.get(`/inventory/reusable-suggestions?material_id=${selectedMaterialId}`)
        .then(res => {
          setReusables(res.data?.data || res.data || []);
        })
        .catch(console.error);
    } else {
      setReusables([]);
      setSelectedReusableId('');
    }
  }, [selectedMaterialId]);

  const handleSelectFabric = (item) => {
    setSelectingItem(item);
    setSelectedMaterialId('');
    setSelectedReusableId('');
    setReusables([]);
  };

  const submitFabricSelection = async () => {
    if (!selectingItem) return;

    if (!selectedMaterialId && !selectedReusableId) {
      return alert("Seleccione una tela o un reutilizable");
    }

    try {
      const pendingRule = selectingItem.material_planning?.recipe?.pending_selectable_rules?.[0];

      const payload = {
        recipe_rule_id: pendingRule?.rule_id || 0,
        material_id: selectedMaterialId ? parseInt(selectedMaterialId) : undefined,
        material_lot_id: selectedReusableId ? parseInt(selectedReusableId) : undefined,
        use_reusable: !!selectedReusableId
      };

      await api.post(`/inventory/sales/${saleId}/items/${selectingItem.id}/select-recipe-material`, payload);
      alert("Tela seleccionada correctamente");
      setSelectingItem(null);
      onReload();
    } catch (err) {
      if (err.response?.status === 409) {
        alert("Esta tela ya ha sido seleccionada previamente.");
      } else {
        alert("Error al seleccionar tela");
      }
      console.error(err);
    }
  };

  if (!posSummary || !posSummary.items) return <div className="p-10">Cargando...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h2 className="text-xl font-black text-slate-900 tracking-tighter mb-6 flex items-center gap-2">
        <Scissors size={22} className="text-indigo-500" />
        Producción y Materiales
      </h2>

      <div className="space-y-5">
        {posSummary.items.map(item => {
          const planning = item.material_planning || {};
          const status = planning.status || {};
          const isReady = status.is_material_planning_ready;
          const hasPending = status.has_pending_selectable_materials;
          const allConsumed = planning.requirements?.length > 0 && planning.requirements.every(r => r.status === 'CONSUMED');
          const isConsumed = allConsumed;
          const pendingRule = planning.recipe?.pending_selectable_rules?.[0];

          const statusBadge = isConsumed ? (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Check size={14}/> Consumido
            </span>
          ) : hasPending ? (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={14}/> Tela Pendiente
            </span>
          ) : isReady ? (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Check size={14}/> Listo para consumir
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
              En Proceso
            </span>
          );

          return (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.product_name || item.custom_description || 'Producto'}</h3>
                  <p className="text-xs text-slate-400 font-bold">Cantidad: {item.quantity}</p>
                </div>
                {statusBadge}
              </div>

              {/* Requirements */}
              {planning.requirements && planning.requirements.length > 0 && (
                <div className="mb-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requerimientos Planeados</h4>
                  <div className="space-y-2">
                    {planning.requirements.map((req, idx) => (
                      <div key={idx} className="flex justify-between text-sm items-center py-1.5">
                        <span className="font-bold text-slate-700">
                          {req.material?.name || 'Material'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                            {parseFloat(req.planned_quantity).toFixed(2)} {req.unit || ''}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
                            req.status === 'CONSUMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-50">
                {hasPending && selectingItem?.id !== item.id && (
                  <button
                    onClick={() => handleSelectFabric(item)}
                    className="px-4 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all text-xs"
                  >
                    Seleccionar Tela
                  </button>
                )}

                {selectingItem?.id === item.id && (
                  <div className="flex-1 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-black text-indigo-900">Selección de Tela</h4>
                      {pendingRule && (
                        <p className="text-[10px] text-indigo-700 font-bold mt-1">
                          Requerido: {pendingRule.required_category_name || 'Cualquier Categoría'}
                          {pendingRule.required_subcategory_name ? ` > ${pendingRule.required_subcategory_name}` : ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-indigo-800 block mb-1">1. Elige una tela del inventario</label>
                      <select
                        value={selectedMaterialId}
                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-indigo-200 outline-none text-sm bg-white font-bold"
                      >
                        <option value="">-- Catálogo de Telas --</option>
                        {materials
                          .filter(m => !pendingRule?.required_category_id || m.category_id === pendingRule.required_category_id)
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.color || 'N/A'}) - Disp: {parseFloat(m.available_stock || 0).toFixed(2)} {m.unit}</option>
                        ))}
                      </select>
                    </div>
                    {selectedMaterialId && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <label className="text-[10px] font-black text-emerald-800 block mb-2">2. (Opcional) Usar un sobrante/retazo</label>
                        {reusables.length > 0 ? (
                          <select
                            value={selectedReusableId}
                            onChange={(e) => setSelectedReusableId(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-emerald-200 outline-none text-sm bg-white font-bold"
                          >
                            <option value="">No, usar tela nueva del rollo</option>
                            {reusables.map(r => (
                              <option key={r.id} value={r.id}>
                                Retazo {r.lot_code} - Disp: {parseFloat(r.stock_quantity).toFixed(2)} {r.material?.unit}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-emerald-700 italic font-bold">No hay sobrantes para esta tela.</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={submitFabricSelection} className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest">
                        Guardar Selección
                      </button>
                      <button onClick={() => setSelectingItem(null)} className="px-6 py-2.5 bg-white text-slate-500 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-xs">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {isReady && !isConsumed && (
                  <button
                    onClick={() => setConsumeItem(item)}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Check size={16} /> Confirmar Consumo Real
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {consumeItem && (
        <ConsumeModal
          saleId={saleId}
          item={consumeItem}
          onClose={() => setConsumeItem(null)}
          onSuccess={() => { setConsumeItem(null); onReload(); }}
        />
      )}
    </div>
  );
};

export default ProductionTab;
