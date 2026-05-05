import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Calculator, Info, Package, Settings, AlertCircle } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const ProductForm = ({ product, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('basic'); // basic, recipe, config
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]); // All available materials for the select
  const [error, setError] = useState(null);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    is_custom: product?.is_custom || false
  });

  const [recipe, setRecipe] = useState([]); // [{ material_id, quantity, waste_percentage }]
  
  const [costConfig, setCostConfig] = useState({
    sewing_hours: 0,
    pattern_hours: 0,
    fixed_supply_cost: 0,
    operation_margin: 0.2, // Default 20%
    profit_margin: 0.3     // Default 30%
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const matResponse = await inventoryService.getMaterials();
      if (matResponse && matResponse.success) {
        setMaterials(matResponse.data);
      }

      if (product?.id) {
        const detailResponse = await inventoryService.getProductDetail(product.id);
        if (detailResponse && detailResponse.status === 'success') {
          const detail = detailResponse.data;
          if (detail.snapshot && Array.isArray(detail.snapshot.materials)) {
            setRecipe(detail.snapshot.materials.map(m => ({
              material_id: m.material_id,
              quantity: m.quantity,
              waste_percentage: m.waste_percentage
            })));
            if (detail.snapshot.cost_config) {
              setCostConfig({
                ...costConfig,
                ...detail.snapshot.cost_config
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product data:', err);
    }
  };

  const addMaterialToRecipe = () => {
    setRecipe([...recipe, { material_id: '', quantity: 1, waste_percentage: 0 }]);
  };

  const removeMaterialFromRecipe = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const updateRecipeItem = (index, field, value) => {
    const newRecipe = [...recipe];
    newRecipe[index][field] = value;
    setRecipe(newRecipe);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (recipe.some(r => !r.material_id)) {
      setError('Asegúrate de que todos los materiales de la receta estén seleccionados.');
      setActiveTab('recipe');
      return;
    }

    try {
      if (isMounted.current) setLoading(true);
      setError(null);
      const payload = {
        data: formData,
        materials: recipe,
        costConfig: costConfig
      };

      if (product?.id) {
        await inventoryService.updateProduct(product.id, payload);
      } else {
        await inventoryService.createProduct(payload);
      }
      onSuccess();
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error al guardar el producto');
        setLoading(false);
      }
    }
  };

  return (
    <div key="prod-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div key="prod-modal-content" className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {product ? 'Editar Prenda' : 'Nueva Prenda en Catálogo'}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configuración técnica y de costos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-8 border-b border-slate-50 gap-8">
          {[
            { id: 'basic', label: 'Información Básica', icon: Info },
            { id: 'recipe', label: 'Receta (BOM)', icon: Package },
            { id: 'config', label: 'Costos y Margen', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 flex items-center gap-2 border-b-2 transition-all font-black text-xs uppercase tracking-widest ${
                activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                    placeholder="Ej. Overol de Mezclilla Industrial"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                    placeholder="Ej. Seguridad"
                  />
                </div>
                <div className="flex items-center gap-3 h-full pt-6">
                  <input
                    type="checkbox"
                    id="is_custom"
                    checked={formData.is_custom}
                    onChange={(e) => setFormData({ ...formData, is_custom: e.target.checked })}
                    className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_custom" className="text-sm font-bold text-slate-600">¿Es sobre medida / personalizado?</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                  placeholder="Detalles técnicos de la prenda..."
                />
              </div>
            </div>
          )}

          {activeTab === 'recipe' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Desglose de Materiales</h3>
                <button
                  type="button"
                  onClick={addMaterialToRecipe}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={16} /> Agregar Material
                </button>
              </div>

              {recipe.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                  <p className="text-slate-400 text-sm font-medium">No has agregado materiales a la receta aún.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipe.map((item, index) => (
                    <div key={index} className="flex gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Insumo / Material</label>
                        <select
                          value={item.material_id}
                          onChange={(e) => updateRecipeItem(index, 'material_id', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {(materials || []).map(m => (
                            <option key={m.id} value={m.id}>{m.name || 'Sin nombre'} ({m.unit || 'un'})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cant. Base</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">% Desperdicio</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={item.waste_percentage * 100}
                            onChange={(e) => updateRecipeItem(index, 'waste_percentage', e.target.value / 100)}
                            className="w-full pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterialFromRecipe(index)}
                        className="p-2.5 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors mb-0.5"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-500" /> Mano de Obra (Horas)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Costura</label>
                    <input
                      type="number"
                      step="0.1"
                      value={costConfig.sewing_hours}
                      onChange={(e) => setCostConfig({ ...costConfig, sewing_hours: parseFloat(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patronaje</label>
                    <input
                      type="number"
                      step="0.1"
                      value={costConfig.pattern_hours}
                      onChange={(e) => setCostConfig({ ...costConfig, pattern_hours: parseFloat(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Insumos Fijos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costConfig.fixed_supply_cost}
                    onChange={(e) => setCostConfig({ ...costConfig, fixed_supply_cost: parseFloat(e.target.value) })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                    placeholder="Hilos, etiquetas, etc."
                  />
                </div>
              </div>

              <div className="space-y-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Márgenes de Utilidad</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Margen Operativo</label>
                      <span className="text-xs font-bold text-indigo-600">{(costConfig.operation_margin * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={costConfig.operation_margin}
                      onChange={(e) => setCostConfig({ ...costConfig, operation_margin: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Margen de Ganancia</label>
                      <span className="text-xs font-bold text-indigo-600">{(costConfig.profit_margin * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={costConfig.profit_margin}
                      onChange={(e) => setCostConfig({ ...costConfig, profit_margin: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
                <div className="mt-8 p-4 bg-indigo-600 rounded-2xl text-white">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Precio sugerido basado en config</p>
                   <p className="text-2xl font-black italic">Auto-Calculado en Guardado</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Guardar Prenda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
