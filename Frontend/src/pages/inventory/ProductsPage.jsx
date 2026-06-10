import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Hammer, Edit2, Trash2, ChevronRight, Calculator, BookOpen } from 'lucide-react';
import inventoryService from '../../api/inventoryService';
import ProductForm from './ProductForm';
import RecipeViewModal from './RecipeViewModal';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState(null);

  const handleSuccess = () => {
    alert('Producto guardado con éxito.');
    window.location.reload();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProducts();
      if (response && response.status === 'success' && response.data && response.data.products) {
        setProducts(response.data.products);
      } else if (response && response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (products || []).filter(p => {
    const name = p?.name || "";
    const category = p?.category || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8">
      {/* Actions Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Producto / Prenda</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Categoría</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Precio Base</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando catálogo...</p>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                      <Hammer size={40} />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">No se encontraron productos.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-black">
                        <Hammer size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{product.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{product.description || 'Sin descripción.'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {product.category || 'Sin Categoría'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <p className="font-black text-slate-700">
                      ${parseFloat(product.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setRecipeProduct(product); setShowRecipe(true); }}
                        className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver Receta"
                      >
                        <BookOpen size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedProduct(product); setShowModal(true); }}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Producto"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Producto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductForm 
          key={selectedProduct ? `edit-prod-${selectedProduct.id}` : 'new-product'}
          product={selectedProduct} 
          onClose={() => setShowModal(false)} 
          onSuccess={handleSuccess} 
        />
      )}

      {showRecipe && recipeProduct && (
        <RecipeViewModal
          product={recipeProduct}
          onClose={() => setShowRecipe(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
