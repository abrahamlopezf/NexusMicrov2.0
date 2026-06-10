import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle, MoreVertical, Edit2, Trash2, PlusCircle, MinusCircle, Layers, Package, Wrench, Briefcase, Eye } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import MaterialForm from './MaterialForm';
import StockAdjustmentModal from './StockAdjustmentModal';

const TYPE_CONFIG = {
  CONSUMABLE: { label: 'Consumible', icon: Package, color: 'text-sky-600 bg-sky-50' },
  FABRIC: { label: 'Tela', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  TOOL: { label: 'Herramienta', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  SERVICE: { label: 'Servicio', icon: Briefcase, color: 'text-slate-600 bg-slate-50' }
};

const MaterialsPage = ({ onSelectMaterial }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const handleSuccess = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedMaterial(null);
      fetchMaterials(true);
    }, 100);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await inventoryService.getMaterials();
      if (response.success) {
        setMaterials(response.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const filteredMaterials = (materials || []).filter(m => {
    const matchesSearch = !searchTerm ||
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || m.inventory_type === typeFilter;
    const matchesStatus = !statusFilter || m.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStockStatus = (current, min) => {
    const curr = parseFloat(current || 0);
    const m = parseFloat(min || 0);
    if (m === 0) return { label: 'Sin mínimo', color: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-50' };
    if (curr <= m * 0.5) return { label: 'Crítico', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-50' };
    if (curr <= m) return { label: 'Bajo', color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Óptimo', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' };
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Activo</span>;
    return <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">Inactivo</span>;
  };

  const getTypeBadge = (type) => {
    const config = TYPE_CONFIG[type] || { label: type, icon: Package, color: 'text-slate-400 bg-slate-50' };
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        <Icon size={10} />
        {config.label}
      </div>
    );
  };

  const getTrackingLabel = (method) => {
    if (method === 'STOCK') return 'Stock';
    if (method === 'ASSET') return 'Activo';
    if (method === 'EXPENSE_ONLY') return 'Gasto';
    return method || '—';
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU, categoría, color o marca..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los tipos</option>
            <option value="CONSUMABLE">Consumible</option>
            <option value="FABRIC">Tela</option>
            <option value="TOOL">Herramienta</option>
            <option value="SERVICE">Servicio</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
          <button
            onClick={() => { setSelectedMaterial(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} />
            Nuevo Insumo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Material / Insumo</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Tipo</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Stock Actual</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Disponible</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Min.</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Estado</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Costo</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                   Cargando materiales...
                </td>
              </tr>
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400 font-medium">No se encontraron materiales.</td>
              </tr>
            ) : (
              filteredMaterials.map((material) => {
                const status = getStockStatus(material.current_stock, material.min_stock);
                return (
                  <tr key={material.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                          {(material.name || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 leading-tight">{material?.name || 'Insumo'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span>{material?.description || 'Sin descripción'}</span>
                            {material?.sku && <span className="font-mono text-slate-300">#{material.sku}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {material?.brand && <span className="text-[10px] text-slate-500 font-bold">{material.brand}</span>}
                            {material?.color && <span className="text-[10px] text-slate-400">• {material.color}</span>}
                            {material?.size && <span className="text-[10px] text-slate-400">• {material.size}</span>}
                            {material?.category?.name && <span className="text-[10px] text-slate-400 font-bold">{material.category.name}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getTypeBadge(material.inventory_type)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-black text-slate-700">{parseFloat(material?.current_stock || 0).toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{material?.unit || 'un'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-slate-600">{parseFloat(material?.available_stock || 0).toFixed(1)}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-400 text-sm">{parseFloat(material?.min_stock || 0).toFixed(1)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg} ${status.text} text-[10px] font-black uppercase tracking-wider`}>
                          <div className={`w-1 h-1 rounded-full ${status.color}`} />
                          {status.label}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(material.status)}
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{getTrackingLabel(material.tracking_method)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-700">
                      ${parseFloat(material?.cost || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        {onSelectMaterial && (
                          <button
                            onClick={() => onSelectMaterial(material.id)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedMaterial(material); setShowAdjustModal(true); }}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ajustar stock"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button
                          onClick={() => { setSelectedMaterial(material); setShowModal(true); }}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('¿Eliminar material?')) {
                              try {
                                await inventoryService.deleteMaterial(material.id);
                                fetchMaterials(true);
                              } catch {
                                alert('Error al eliminar');
                              }
                            }
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAdjustModal && selectedMaterial && (
        <StockAdjustmentModal
          material={selectedMaterial}
          onClose={() => setShowAdjustModal(false)}
        />
      )}

      {showModal && (
        <MaterialForm
          key={selectedMaterial ? `edit-${selectedMaterial.id}` : 'new-material'}
          material={selectedMaterial}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default MaterialsPage;
