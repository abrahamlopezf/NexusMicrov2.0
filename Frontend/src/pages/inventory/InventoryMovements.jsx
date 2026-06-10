import React, { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownLeft, Settings, Search, Calendar, Package, Hash, DollarSign, BarChart3 } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const MOVEMENT_TYPES = [
  'ENTRADA_COMPRA',
  'ENTRADA_REUTILIZABLE',
  'SALIDA_PRODUCCION',
  'SALIDA_VENTA',
  'AJUSTE',
  'DEVOLUCION',
  'ENTRADA_MANUAL',
  'SALIDA_MANUAL'
];

const TYPE_STYLES = {
  'ENTRADA_COMPRA': { label: 'Compra', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
  'ENTRADA_REUTILIZABLE': { label: 'Reutilizable', icon: ArrowDownLeft, color: 'text-teal-600 bg-teal-50' },
  'SALIDA_PRODUCCION': { label: 'Producción', icon: ArrowUpRight, color: 'text-amber-600 bg-amber-50' },
  'SALIDA_VENTA': { label: 'Venta', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
  'AJUSTE': { label: 'Ajuste', icon: Settings, color: 'text-slate-600 bg-slate-50' },
  'DEVOLUCION': { label: 'Devolución', icon: ArrowDownLeft, color: 'text-purple-600 bg-purple-50' },
  'ENTRADA_MANUAL': { label: 'Entrada Manual', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
  'SALIDA_MANUAL': { label: 'Salida Manual', icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' }
};

const getReferenceLabel = (refType, refId) => {
  if (!refType) return null;
  const labels = {
    'PURCHASE': 'Compra',
    'PURCHASE_ITEM': 'Item Compra',
    'SALE': 'Venta',
    'SALE_ITEM': 'Item Venta',
    'MANUAL_ADJUST': 'Ajuste Manual',
    'REUSABLE_RETURN': 'Sobrante Reutilizable',
    'CONSUMPTION': 'Consumo'
  };
  const label = labels[refType] || refType;
  return refId ? `${label} #${refId}` : label;
};

const getScopeBadge = (scopeType) => {
  if (scopeType === 'GENERAL') return <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">Gral</span>;
  if (scopeType === 'SALE') return <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded font-bold uppercase">Venta</span>;
  if (scopeType === 'SALE_ITEM') return <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded font-bold uppercase">Item</span>;
  return null;
};

const InventoryMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const response = await inventoryService.getMovements(params);

      let movementsData = [];

      if (response?.data?.rows) {
        movementsData = response.data.rows;
      } else if (Array.isArray(response?.data)) {
        movementsData = response.data;
      } else if (Array.isArray(response)) {
        movementsData = response;
      }

      setMovements(movementsData);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [typeFilter]);

  const getMovementBadge = (type) => {
    const config = TYPE_STYLES[type] || { label: type || 'Movimiento', icon: History, color: 'text-slate-400 bg-slate-50' };
    const Icon = config.icon || History;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </div>
    );
  };

  const filteredMovements = (movements || []).filter(m => {
    if (!m) return false;
    const materialName = m.material?.name || "";
    const lotCode = m.lot?.lot_code || "";
    const refLabel = getReferenceLabel(m.reference_type, m.reference_id) || "";
    return materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           refLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isEntry = (type) => ['ENTRADA_COMPRA', 'ENTRADA_REUTILIZABLE', 'ENTRADA_MANUAL', 'DEVOLUCION'].includes(type);

  return (
    <div className="space-y-6 p-4">
      {/* Filters */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por material, lote o referencia..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los tipos</option>
            {MOVEMENT_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_STYLES[t]?.label || t}</option>
            ))}
          </select>
          <button
            onClick={fetchMovements}
            className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2"
            title="Actualizar historial"
          >
            <History size={20} />
            <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Fecha</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Material / Insumo</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Tipo</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Cantidad</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Stock Anterior</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Nuevo Stock</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Costo Unit.</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Costo Total</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Lote / Referencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando movimientos...</p>
                  </div>
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                      <History size={40} />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">No hay movimientos registrados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovements.map((move) => {
                if (!move) return null;
                const date = move.created_at ? new Date(move.created_at) : new Date();
                const entry = isEntry(move.type);
                const refLabel = getReferenceLabel(move.reference_type, move.reference_id);
                return (
                  <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">
                          {date.toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-700">{move.material?.name || 'Insumo no identificado'}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{move.material?.unit || 'un'}</p>
                    </td>
                    <td className="py-4 px-6">
                      {getMovementBadge(move.type)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-black ${entry ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {entry ? '+' : ''}{parseFloat(move.quantity || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm text-slate-500 font-medium">
                      {move.previous_stock !== null && move.previous_stock !== undefined
                        ? parseFloat(move.previous_stock).toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-4 px-6 text-right text-sm">
                      <span className="font-bold text-slate-700">
                        {move.new_stock !== null && move.new_stock !== undefined
                          ? parseFloat(move.new_stock).toFixed(2)
                          : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm text-slate-600 font-medium">
                      {move.unit_cost !== null && move.unit_cost !== undefined
                        ? `$${parseFloat(move.unit_cost).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-black text-slate-700">
                      {move.total_cost !== null && move.total_cost !== undefined
                        ? `$${parseFloat(move.total_cost).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        {move.lot && (
                          <div className="flex items-center gap-1.5">
                            <Hash size={10} className="text-slate-400" />
                            <span className="text-[11px] font-mono font-bold text-slate-600">{move.lot.lot_code}</span>
                            {getScopeBadge(move.lot.scope_type)}
                          </div>
                        )}
                        {refLabel && (
                          <div className="flex items-center gap-1.5">
                            <BarChart3 size={10} className="text-slate-400" />
                            <span className="text-[10px] text-slate-500">{refLabel}</span>
                          </div>
                        )}
                        {move.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{move.notes}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryMovements;
