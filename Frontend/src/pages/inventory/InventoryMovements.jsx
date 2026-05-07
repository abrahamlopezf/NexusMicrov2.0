import React, { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownLeft, Settings, Search, Calendar } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const InventoryMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getMovements();
      
      // If the backend uses findAndCountAll, the array is in response.data.rows
      // If it's a direct array, it's in response.data or response
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

  const getMovementBadge = (type) => {
    const types = {
      'ENTRADA_COMPRA': { label: 'Compra', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
      'SALIDA_PRODUCCION': { label: 'Producción', icon: ArrowUpRight, color: 'text-amber-600 bg-amber-50' },
      'SALIDA_VENTA': { label: 'Venta', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
      'AJUSTE': { label: 'Ajuste', icon: Settings, color: 'text-slate-600 bg-slate-50' },
      'ENTRADA_MANUAL': { label: 'Entrada Manual', icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
      'SALIDA_MANUAL': { label: 'Salida Manual', icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' }
    };
    const config = types[type] || { label: type || 'Movimiento', icon: History, color: 'text-slate-400 bg-slate-50' };
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
    const typeStr = m.type || "";
    return materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           typeStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 p-4">
      {/* Filters */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por material o tipo..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={fetchMovements} 
          className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2"
          title="Actualizar historial"
        >
          <History size={20} />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Actualizar</span>
        </button>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando movimientos...</p>
                  </div>
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
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
                      <span className={`font-black ${parseFloat(move.quantity) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {parseFloat(move.quantity) > 0 ? '+' : ''}{parseFloat(move.quantity || 0).toFixed(2)}
                      </span>
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
