import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Plus, Edit } from 'lucide-react';

export const ProductList = ({ onEdit, onCreate }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data.data.products);
            } catch (error) {
                console.error("Error fetching products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return <div>Cargando Catálogo...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="text-blue-600"/> Catálogo de Productos</h1>
                <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    <Plus className="w-4 h-4"/> Nuevo Producto
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">¿Es Custom?</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{p.name}</td>
                                <td className="p-4 text-gray-600">{p.category || 'N/A'}</td>
                                <td className="p-4 text-gray-600">{p.is_custom ? 'Sí' : 'No'}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => onEdit(p.id)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
