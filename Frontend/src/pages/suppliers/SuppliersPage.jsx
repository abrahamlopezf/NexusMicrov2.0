import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import supplierService from '../../api/supplierService';
import SupplierForm from './SupplierForm';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await supplierService.getSuppliers();
        if (isMounted && response && response.success) {
          setSuppliers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSuppliers();
    return () => { isMounted = false; };
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await supplierService.deleteSupplier(id);
        alert('Proveedor eliminado.');
        window.location.reload();
      } catch (error) {
        alert('Error al eliminar: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Truck size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Proveedores</h1>
        </div>
        <p className="text-slate-500 font-medium">Gestiona tus contactos de suministro y materias primas.</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setSelectedSupplier(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Proveedor</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Contacto</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Dirección</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando proveedores...</td></tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">No se encontraron proveedores.</td></tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-black">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-slate-700">{s.name}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {s.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={12} className="text-slate-300" />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={12} className="text-slate-300" />
                          {s.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xs flex items-center gap-2">
                      <MapPin size={12} />
                      {s.address || 'Sin dirección registrada'}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedSupplier(s); setShowModal(true); }}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
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
        <SupplierForm 
          supplier={selectedSupplier}
          onClose={() => setShowModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
