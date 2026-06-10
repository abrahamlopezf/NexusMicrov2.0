import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Layers, Wrench, Briefcase, Clock, DollarSign, Hash, Tag, Archive, AlertTriangle, Edit2 } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const TYPE_CONFIG = {
  CONSUMABLE: { label: 'Consumible', icon: Package, color: 'text-sky-600 bg-sky-50' },
  FABRIC: { label: 'Tela', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  TOOL: { label: 'Herramienta', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  SERVICE: { label: 'Servicio', icon: Briefcase, color: 'text-slate-600 bg-slate-50' }
};

const MaterialDetailPage = ({ materialId, onBack, onEdit }) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lots');
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    setLoading(true);
    inventoryService.getMaterialDetail(materialId)
      .then(res => {
        if (res?.success) setMaterial(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [materialId]);

  useEffect(() => {
    if (!materialId || activeTab !== 'movements') return;
    setMovementsLoading(true);
    inventoryService.getMovements({ material_id: materialId, limit: 50 })
      .then(res => {
        const data = res?.data?.rows || res?.data || res || [];
        setMovements(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setMovementsLoading(false));
  }, [materialId, activeTab]);

  if (loading) return (
    <div className="p-8">
      <div className="text-center py-20 text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando detalle...</div>
    </div>
  );

  if (!material) return (
    <div className="p-8">
      <div className="text-center py-20 text-slate-400 font-medium">Material no encontrado.</div>
    </div>
  );

  const typeCfg = TYPE_CONFIG[material.inventory_type] || { label: material.inventory_type, icon: Package, color: 'text-slate-600 bg-slate-50' };
  const TypeIcon = typeCfg.icon;
  const invSum = material.inventory_summary || {};

  const tabs = [
    { id: 'lots', label: 'Lotes', count: material.lots?.length },
    { id: 'movements', label: 'Movimientos', count: movements.length },
    { id: 'cost_history', label: 'Historial de Costo', count: material.cost_history?.length }
  ];

  return (
    <div className="p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a Insumos
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <TypeIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{material.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${typeCfg.color}`}>
                  <TypeIcon size={10} /> {typeCfg.label}
                </span>
                {material.sku && <span className="font-mono text-xs font-bold text-slate-300">SKU: {material.sku}</span>}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${material.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  {material.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <button onClick={() => onEdit(material)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
                <Edit2 size={14} /> Editar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Actual</p>
            <p className="text-3xl font-black text-slate-900">{parseFloat(material.current_stock || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">{material.unit || 'un'}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Disponible</p>
            <p className="text-3xl font-black text-slate-900">{parseFloat(material.available_stock || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">{material.unit || 'un'}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Mínimo</p>
            <p className="text-3xl font-black text-slate-900">{parseFloat(material.min_stock || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">{material.unit || 'un'}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Costo Actual</p>
            <p className="text-3xl font-black text-slate-900">${parseFloat(material.cost || 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-slate-400">{material.costing_method === 'LAST_COST' ? 'Último costo' : material.costing_method}</p>
          </div>
        </div>

        {/* Inventory Summary by Scope */}
        {invSum.by_scope && (
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Stock por Alcance</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-black text-slate-900">{parseFloat(invSum.by_scope.GENERAL || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">General</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{parseFloat(invSum.by_scope.SALE || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Asignado a Venta</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{parseFloat(invSum.by_scope.SALE_ITEM || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Asignado a Prenda</p>
              </div>
            </div>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {material.category && (
            <div className="flex items-center gap-2 text-sm"><Tag size={14} className="text-slate-300" /><span className="font-bold text-slate-600">{material.category.name}</span></div>
          )}
          {material.subcategory && (
            <div className="flex items-center gap-2 text-sm"><Tag size={14} className="text-slate-300" /><span className="font-bold text-slate-600">{material.subcategory.name}</span></div>
          )}
          {material.color && <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: material.color }} /><span className="font-bold text-slate-600">{material.color}</span></div>}
          {material.size && <div className="flex items-center gap-2 text-sm"><Archive size={14} className="text-slate-300" /><span className="font-bold text-slate-600">{material.size}</span></div>}
          {material.brand && <div className="flex items-center gap-2 text-sm"><Hash size={14} className="text-slate-300" /><span className="font-bold text-slate-600">{material.brand}</span></div>}
          <div className="flex items-center gap-2 text-sm"><Clock size={14} className="text-slate-300" /><span className="font-bold text-slate-600">{material.tracking_method === 'STOCK' ? 'Control por Stock' : material.tracking_method === 'ASSET' ? 'Activo Fijo' : 'Solo Gasto'}</span></div>
          {material.description && (
            <div className="col-span-4 mt-2"><p className="text-sm text-slate-500">{material.description}</p></div>
          )}
        </div>
      </div>

      {/* Tabs: Lots / Movements / Cost History */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500 bg-indigo-50/30'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {tab.label} {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px]">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[300px]">
          {activeTab === 'lots' && (
            <div>
              {(!material.lots || material.lots.length === 0) ? (
                <p className="text-center py-12 text-slate-400 font-medium">Sin lotes registrados.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Código</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Origen</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Stock</th>
                      <th className="text-right py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Costo Unit.</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Alcance</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {material.lots.map(lot => (
                      <tr key={lot.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 text-sm">{lot.lot_code}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            lot.lot_origin === 'PURCHASE' ? 'bg-blue-50 text-blue-600' :
                            lot.lot_origin === 'REUSABLE' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>{lot.lot_origin}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{parseFloat(lot.stock_quantity || 0).toFixed(2)} {material.unit}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">${parseFloat(lot.unit_cost || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            lot.scope_type === 'GENERAL' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>{lot.scope_type}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${lot.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{lot.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'movements' && (
            <div>
              {movementsLoading ? (
                <p className="text-center py-12 text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando movimientos...</p>
              ) : movements.length === 0 ? (
                <p className="text-center py-12 text-slate-400 font-medium">Sin movimientos registrados.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Fecha</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Tipo</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Cantidad</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Stock Anterior</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Nuevo Stock</th>
                      <th className="text-right py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Costo Total</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {movements.map(mov => (
                      <tr key={mov.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 text-xs font-bold text-slate-500">{new Date(mov.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            mov.type?.includes('ENTRADA') ? 'bg-emerald-50 text-emerald-600' :
                            mov.type?.includes('SALIDA') ? 'bg-rose-50 text-rose-500' :
                            'bg-slate-50 text-slate-500'
                          }`}>{mov.type}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{parseFloat(mov.quantity || 0).toFixed(2)} {material.unit}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{mov.previous_stock != null ? parseFloat(mov.previous_stock).toFixed(2) : '-'}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{mov.new_stock != null ? parseFloat(mov.new_stock).toFixed(2) : '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">${parseFloat(mov.total_cost || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs text-slate-400 font-bold">{mov.reference || mov.lot?.lot_code || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'cost_history' && (
            <div>
              {(!material.cost_history || material.cost_history.length === 0) ? (
                <p className="text-center py-12 text-slate-400 font-medium">Sin historial de costos.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Fecha</th>
                      <th className="text-right py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Anterior</th>
                      <th className="text-right py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Nuevo</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Motivo</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Origen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {material.cost_history.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 text-xs font-bold text-slate-500">{new Date(h.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">{h.previous_cost != null ? `$${parseFloat(h.previous_cost).toFixed(2)}` : '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">${parseFloat(h.new_cost).toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-bold">{h.reason}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500">{h.source}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailPage;
