import React, { useState } from 'react';
import { Package, Hammer, History, Info, Layers, RotateCcw, AlertTriangle, FolderTree } from 'lucide-react';
import MaterialsPage from './MaterialsPage';
import MaterialDetailPage from './MaterialDetailPage';
import MaterialForm from './MaterialForm';
import ProductsPage from './ProductsPage';
import InventoryMovements from './InventoryMovements';
import InventoryLots from './InventoryLots';
import LowStockPage from './LowStockPage';
import CategoriesPage from './CategoriesPage';
import ReusableReturnModal from './ReusableReturnModal';

const InventoryLayout = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showReusableReturn, setShowReusableReturn] = useState(false);

  const tabs = [
    { id: 'materials', label: 'Insumos', icon: Package, description: 'Materia prima y stock base' },
    { id: 'categories', label: 'Categorías', icon: FolderTree, description: 'Clasificación y taxonomía' },
    { id: 'products', label: 'Catálogo', icon: Hammer, description: 'Prendas terminadas y recetas' },
    { id: 'lots', label: 'Lotes', icon: Layers, description: 'Traza y costeo por lote' },
    { id: 'lowstock', label: 'Stock Bajo', icon: AlertTriangle, description: 'Alertas de inventario crítico' },
    { id: 'movements', label: 'Historial', icon: History, description: 'Auditoría de movimientos' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Inventarios</h1>
          </div>
          <button
            onClick={() => setShowReusableReturn(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <RotateCcw size={16} /> Registrar Sobrante
          </button>
        </div>
        <p className="text-slate-500 font-medium">Control total de materiales, productos y trazabilidad operativa.</p>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-4 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] p-4 rounded-2xl border transition-all text-left group ${
                isActive
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                }`}>
                  <Icon size={20} />
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </div>
              <h3 className={`font-bold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                {tab.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[600px]">
        {selectedMaterialId ? (
          <MaterialDetailPage
            materialId={selectedMaterialId}
            onBack={() => setSelectedMaterialId(null)}
            onEdit={(mat) => { setEditingMaterial(mat); }}
          />
        ) : activeTab === 'materials' ? (
          <MaterialsPage onSelectMaterial={setSelectedMaterialId} />
        ) : activeTab === 'categories' ? (
          <CategoriesPage />
        ) : activeTab === 'products' ? (
          <ProductsPage />
        ) : activeTab === 'lots' ? (
          <InventoryLots />
        ) : activeTab === 'lowstock' ? (
          <LowStockPage />
        ) : activeTab === 'movements' ? (
          <InventoryMovements />
        ) : null}
      </div>

      {editingMaterial && (
        <MaterialForm
          key={`edit-${editingMaterial.id}`}
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSuccess={() => setEditingMaterial(null)}
        />
      )}

      {showReusableReturn && (
        <ReusableReturnModal
          onClose={() => setShowReusableReturn(false)}
          onSuccess={() => setShowReusableReturn(false)}
        />
      )}
    </div>
  );
};

export default InventoryLayout;
