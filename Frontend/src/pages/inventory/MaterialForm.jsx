import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Truck, Layers, Package, Wrench, Briefcase } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import supplierService from '../../api/supplierService';

const DEFAULTS_BY_TYPE = {
  CONSUMABLE: { tracking_method: 'STOCK', affects_product_cost: true, costing_method: 'LAST_COST' },
  FABRIC: { tracking_method: 'STOCK', affects_product_cost: true, costing_method: 'LAST_COST' },
  TOOL: { tracking_method: 'ASSET', affects_product_cost: false, costing_method: 'NONE' },
  SERVICE: { tracking_method: 'EXPENSE_ONLY', affects_product_cost: false, costing_method: 'NONE' }
};

const MaterialForm = ({ material, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(() => {
    if (material) {
      return {
        name: material.name || '',
        description: material.description || '',
        unit: material.unit || 'm',
        min_stock: material.min_stock || 0,
        cost: material.cost || 0,
        supplier_id: material.supplier_id || '',
        inventory_type: material.inventory_type || 'CONSUMABLE',
        tracking_method: material.tracking_method || 'STOCK',
        costing_method: material.costing_method || 'LAST_COST',
        affects_product_cost: material.affects_product_cost !== undefined ? material.affects_product_cost : true,
        category_id: material.category_id || '',
        subcategory_id: material.subcategory_id || '',
        color: material.color || '',
        size: material.size || '',
        brand: material.brand || '',
        status: material.status || 'ACTIVE'
      };
    }
    return {
      name: '',
      description: '',
      unit: 'm',
      min_stock: 0,
      cost: 0,
      supplier_id: '',
      inventory_type: 'CONSUMABLE',
      tracking_method: 'STOCK',
      costing_method: 'LAST_COST',
      affects_product_cost: true,
      category_id: '',
      subcategory_id: '',
      color: '',
      size: '',
      brand: '',
      status: 'ACTIVE'
    };
  });

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const selectedCategory = categories.find(c => c.id === Number(formData.category_id));
  const subcategories = selectedCategory?.subcategories || [];

  useEffect(() => {
    isMounted.current = true;
    fetchSuppliers();
    fetchCategories();
    return () => { isMounted.current = false; };
  }, []);

  const handleTypeChange = (type) => {
    const defaults = DEFAULTS_BY_TYPE[type] || DEFAULTS_BY_TYPE.CONSUMABLE;
    setFormData(prev => ({
      ...prev,
      inventory_type: type,
      tracking_method: prev.tracking_method || defaults.tracking_method,
      costing_method: prev.costing_method || defaults.costing_method,
      affects_product_cost: prev.affects_product_cost !== undefined ? prev.affects_product_cost : defaults.affects_product_cost
    }));
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers();
      if (isMounted.current && response && response.success) {
        setSuppliers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      if (isMounted.current) setLoadingSuppliers(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await inventoryService.getCategories();
      if (isMounted.current && response && response.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      if (isMounted.current) setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isMounted.current) setLoading(true);
      setError(null);

      const dataToSave = {
        ...formData,
        supplier_id: formData.supplier_id || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null
      };

      if (!formData.name?.trim()) {
        setError('El nombre del material es obligatorio');
        setLoading(false);
        return;
      }

      if (material?.id) {
        await inventoryService.updateMaterial(material.id, dataToSave);
      } else {
        await inventoryService.createMaterial(dataToSave);
      }
      if (isMounted.current) {
        onSuccess();
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error al guardar el material');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {material ? 'Editar Insumo' : 'Nuevo Insumo'}
            </h2>
            {material?.sku && (
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {material.sku}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Tipo de inventario */}
            <div className="mb-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tipo de inventario</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'CONSUMABLE', label: 'Consumible', icon: Package, desc: 'Hilos, botones, cierres' },
                  { value: 'FABRIC', label: 'Tela', icon: Layers, desc: 'Telas para sastrería' },
                  { value: 'TOOL', label: 'Herramienta', icon: Wrench, desc: 'Equipo y activos' },
                  { value: 'SERVICE', label: 'Servicio', icon: Briefcase, desc: 'Gasto, no físico' }
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = formData.inventory_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTypeChange(opt.value)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <p className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre del Material</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. Tela Mezclilla 12oz"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. Algodón premium 100%"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Categoría</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">-- Sin categoría --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {loadingCategories && <p className="text-[10px] text-indigo-500 mt-1 font-bold animate-pulse">Cargando categorías...</p>}
              </div>

              {/* Subcategoría */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Subcategoría</label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                  disabled={!formData.category_id}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Sin subcategoría --</option>
                  {subcategories.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. Azul marino"
                />
              </div>

              {/* Tamaño */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tamaño</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. 1.5m x 2m"
                />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Marca</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej. Singer, Prym"
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="m">Metros (m)</option>
                  <option value="pz">Piezas (pz)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="l">Litros (l)</option>
                  <option value="un">Unidades (un)</option>
                  <option value="rll">Rollos (rll)</option>
                </select>
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                  <Truck size={14} className="text-indigo-500" />
                  Proveedor
                </label>
                <select
                  value={formData.supplier_id || ''}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">-- Sin Proveedor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {loadingSuppliers && <p className="text-[10px] text-indigo-500 mt-1 font-bold animate-pulse">Cargando proveedores...</p>}
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Stock Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              {/* Costo Unitario */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              {/* Seguimiento */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Método de seguimiento</label>
                <select
                  value={formData.tracking_method}
                  onChange={(e) => setFormData({ ...formData, tracking_method: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="STOCK">Stock (control de existencias)</option>
                  <option value="ASSET">Activo (control de equipo)</option>
                  <option value="EXPENSE_ONLY">Gasto (no afecta inventario)</option>
                </select>
              </div>

              {/* Costeo */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Método de costeo</label>
                <select
                  value={formData.costing_method}
                  onChange={(e) => setFormData({ ...formData, costing_method: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="LAST_COST">Último costo (LAST_COST)</option>
                  <option value="NONE">No afecta costo (NONE)</option>
                </select>
              </div>

              {/* Afecta costo de producto */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Afecta costo de producto</label>
                <div className="flex items-center gap-3 h-full">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, affects_product_cost: !formData.affects_product_cost })}
                    className={`relative w-12 h-7 rounded-full transition-all ${
                      formData.affects_product_cost ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`absolute w-5 h-5 bg-white rounded-full top-1 shadow-sm transition-all ${
                      formData.affects_product_cost ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-sm font-bold text-slate-600">
                    {formData.affects_product_cost ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Info de stock para edición */}
            {material && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Inventario actual</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Stock actual</span>
                    <p className="font-black text-slate-700">{parseFloat(material.current_stock || 0).toFixed(2)} {material.unit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Reservado</span>
                    <p className="font-black text-slate-700">{parseFloat(material.reserved_stock || 0).toFixed(2)} {material.unit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Disponible</span>
                    <p className="font-black text-emerald-600">{parseFloat(material.available_stock || 0).toFixed(2)} {material.unit}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-6 flex gap-3 flex-shrink-0 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  {material ? 'Guardar Cambios' : 'Crear Insumo'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;
