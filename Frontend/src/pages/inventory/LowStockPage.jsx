import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Package, Layers, Wrench, Briefcase } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const TYPE_CONFIG = {
  CONSUMABLE: { label: 'Consumible', icon: Package, color: 'text-sky-600 bg-sky-50' },
  FABRIC: { label: 'Tela', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  TOOL: { label: 'Herramienta', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  SERVICE: { label: 'Servicio', icon: Briefcase, color: 'text-slate-600 bg-slate-50' }
};

const LowStockPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getLowStockMaterials();
      const data = res.data || res || [];
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const config = TYPE_CONFIG[type] || { label: type, icon: Package, color: 'text-slate-400 bg-slate-50' };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        <Icon size={10} /> {config.label}
      </span>
    );
  };

  const getStockLevel = (available, min) => {
    const ratio = min > 0 ? available / min : 1;
    if (ratio <= 0.5) return { label: 'Crítico', icon: '🔴', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    if (ratio <= 1) return { label: 'Bajo', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    return { label: 'Óptimo', icon: '🟢', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 rounded-xl">
            <AlertTriangle size={20} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock Bajo</h2>
            <p className="text-sm text-slate-500 font-medium">
              {materials.length} material{materials.length !== 1 ? 'es' : ''} por debajo del mínimo
            </p>
          </div>
        </div>
        <button
          onClick={fetchLowStock}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Cargando...
          </div>
        ) : materials.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-slate-400 font-bold">No hay materiales con stock bajo.</p>
            <p className="text-slate-300 text-sm">Todos los materiales están dentro del límite mínimo.</p>
          </div>
        ) : (
          materials.map(m => {
            const available = parseFloat(m.available_stock || 0);
            const min = parseFloat(m.min_stock || 0);
            const current = parseFloat(m.current_stock || 0);
            const level = getStockLevel(available, min);
            const deficit = Math.max(0, min - available);

            return (
              <div key={m.id} className={`p-5 rounded-3xl border-2 ${level.border} ${level.bg} shadow-sm hover:shadow-md transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(m.inventory_type)}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${level.bg} ${level.text}`}>
                        {level.label}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-sm truncate mt-1">{m.name}</h3>
                    {m.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {m.sku}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Stock actual</span>
                    <span className={`font-black ${level.text}`}>{current.toFixed(2)} {m.unit || 'un'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Disponible</span>
                    <span className={`font-black ${level.text}`}>{available.toFixed(2)} {m.unit || 'un'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Stock mínimo</span>
                    <span className="font-bold text-slate-700">{min.toFixed(2)} {m.unit || 'un'}</span>
                  </div>
                  {deficit > 0 && (
                    <div className="pt-2 mt-2 border-t border-rose-200 flex justify-between text-sm">
                      <span className="text-rose-600 font-bold">Déficit</span>
                      <span className="font-black text-rose-600">-{deficit.toFixed(2)} {m.unit || 'un'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-rose-200">
                  <div className="w-full bg-rose-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${deficit > 0 ? 'bg-rose-500' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, (available / Math.max(1, min)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LowStockPage;
