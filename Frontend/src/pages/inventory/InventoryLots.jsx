import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Layers, RefreshCw, ShoppingCart, RotateCcw, Wrench } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import api from '../../api/axios';

const ORIGIN_CONFIG = {
  PURCHASE: { label: 'Compra', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
  MANUAL: { label: 'Manual', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  REUSABLE: { label: 'Reutilizable', icon: RotateCcw, color: 'text-emerald-600 bg-emerald-50' }
};

const SCOPE_CONFIG = {
  GENERAL: { label: 'General', color: 'bg-slate-100 text-slate-600' },
  SALE: { label: 'Venta', color: 'bg-indigo-100 text-indigo-600' },
  SALE_ITEM: { label: 'Prenda', color: 'bg-amber-100 text-amber-600' }
};

const InventoryLots = () => {
  const [lots, setLots] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  useEffect(() => {
    fetchLots();
    api.get('/materials').then(res => {
      const data = res.data?.data || res.data || [];
      setMaterials(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const params = {};
      if (materialFilter) params.material_id = materialFilter;
      if (scopeFilter) params.scope_type = scopeFilter;
      const res = await inventoryService.getMaterialLots(params);
      const data = res.data || res || [];
      setLots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching lots:', err);
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = lots.filter(l => {
    const matchesSearch = !searchTerm ||
      (l.lot_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.material?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getOriginBadge = (origin) => {
    const config = ORIGIN_CONFIG[origin] || { label: origin, icon: Package, color: 'text-slate-400 bg-slate-50' };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        <Icon size={10} /> {config.label}
      </span>
    );
  };

  const getScopeBadge = (scope) => {
    const config = SCOPE_CONFIG[scope] || { label: scope, color: 'bg-slate-100 text-slate-600' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar lote o material..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los materiales</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los alcances</option>
            <option value="GENERAL">General</option>
            <option value="SALE">Venta</option>
            <option value="SALE_ITEM">Prenda</option>
          </select>
          <button onClick={fetchLots} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Código de Lote</th>
                <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Material</th>
                <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Origen</th>
                <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Stock</th>
                <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Costo Unit.</th>
                <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Alcance</th>
                <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Cargando lotes...
                  </td>
                </tr>
              ) : filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 font-medium">No se encontraron lotes.</td>
                </tr>
              ) : (
                filteredLots.map(lot => (
                  <tr key={lot.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg">
                          <Layers size={14} className="text-slate-500" />
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-sm">{lot.lot_code}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-700">{lot.material?.name || 'Material Desconocido'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {lot.material_id}</p>
                    </td>
                    <td className="py-4 px-6 text-center">{getOriginBadge(lot.lot_origin)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-700">{parseFloat(lot.stock_quantity || 0).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 ml-1">{lot.material?.unit || 'un'}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-600">
                      {lot.unit_cost ? `$${parseFloat(lot.unit_cost).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-4 px-6 text-center">{getScopeBadge(lot.scope_type)}</td>
                    <td className="py-4 px-6 text-center">
                      {lot.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Activo</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">{lot.status}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryLots;
