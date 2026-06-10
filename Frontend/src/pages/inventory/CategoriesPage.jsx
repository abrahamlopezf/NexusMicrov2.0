import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronRight, FolderTree, Tag, Layers, AlertCircle } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const CategoryFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await inventoryService.createCategory(formData);
      alert('Categoría creada con éxito.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-[32px]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><FolderTree size={20} /></div>
            <h2 className="text-xl font-black text-slate-900">Nueva Categoría</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre *</label>
              <input required type="text" placeholder="Ej. Telas, Hilos, Botones"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código</label>
              <input type="text" placeholder="Ej. TELAS, HILOS (opcional, se genera automático)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
              <textarea rows={3} placeholder="Descripción opcional de la categoría..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-xl shadow-slate-900/20">
              {loading ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubcategoryFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', code: '', description: '', category_id: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    inventoryService.getCategories().then(res => {
      if (res?.success) setCategories(Array.isArray(res.data) ? res.data : []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await inventoryService.createSubcategory(formData);
      alert('Subcategoría creada con éxito.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la subcategoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-[32px]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Tag size={20} /></div>
            <h2 className="text-xl font-black text-slate-900">Nueva Subcategoría</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoría *</label>
              <select required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                <option value="">Seleccionar categoría...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre *</label>
              <input required type="text" placeholder="Ej. Oxford, Gabardina, Forro"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código</label>
              <input type="text" placeholder="Ej. OXFORD, GABARDINA (opcional)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
              <textarea rows={2} placeholder="Descripción opcional..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-xl shadow-slate-900/20">
              {loading ? 'Guardando...' : 'Crear Subcategoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getCategories();
      if (response?.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filteredCategories = categories.filter(c =>
    !searchTerm ||
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.subcategories || []).some(s =>
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><FolderTree size={24} /></div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categorías y Subcategorías</h1>
        </div>
        <p className="text-slate-500 font-medium">Clasificación de materiales para inventario de sastrería.</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar por nombre o código..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSubcategoryModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95 text-[10px] uppercase tracking-widest">
            <Tag size={16} /> Nueva Subcategoría
          </button>
          <button onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-[10px] uppercase tracking-widest">
            <Plus size={18} /> Nueva Categoría
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Categoría</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Código</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Subcategorías</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando categorías...</td></tr>
            ) : filteredCategories.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">No se encontraron categorías. Crea la primera.</td></tr>
            ) : (
              filteredCategories.map((cat) => (
                <React.Fragment key={cat.id}>
                  <tr className="group hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                          {expandedIds.has(cat.id) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-xs"><FolderTree size={16} /></div>
                        <div>
                          <p className="font-bold text-slate-700">{cat.name}</p>
                          {cat.description && <p className="text-[11px] text-slate-400 mt-0.5">{cat.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{cat.code}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-slate-300" />
                        <span className="text-sm font-bold text-slate-500">{cat.subcategories?.length || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {cat.active ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Activo</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">Inactivo</span>
                      )}
                    </td>
                  </tr>
                  {expandedIds.has(cat.id) && (cat.subcategories || []).length > 0 && (
                    (cat.subcategories || []).map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors bg-slate-50/30">
                        <td className="py-3 px-6 pl-16">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center font-black text-[10px]"><Tag size={12} /></div>
                            <div>
                              <p className="font-bold text-slate-600 text-sm">{sub.name}</p>
                              {sub.description && <p className="text-[10px] text-slate-400">{sub.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="font-mono text-[10px] font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-lg">{sub.code}</span>
                        </td>
                        <td className="py-3 px-6 text-xs text-slate-300">-</td>
                        <td className="py-3 px-6 text-center">
                          {sub.active ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Activo</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">Inactivo</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  {expandedIds.has(cat.id) && (!cat.subcategories || cat.subcategories.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-300 font-medium">
                        Sin subcategorías. <button onClick={() => setShowSubcategoryModal(true)}
                          className="text-indigo-500 hover:text-indigo-700 font-bold underline underline-offset-2">Agregar primera</button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCategoryModal && (
        <CategoryFormModal onClose={() => setShowCategoryModal(false)} onSuccess={fetchCategories} />
      )}
      {showSubcategoryModal && (
        <SubcategoryFormModal onClose={() => setShowSubcategoryModal(false)} onSuccess={fetchCategories} />
      )}
    </div>
  );
};

export default CategoriesPage;
