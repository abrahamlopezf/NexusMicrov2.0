import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Phone, Mail, MapPin, Edit2, Trash2, Filter, Building2, FileText } from 'lucide-react';
import supplierService from '../../api/supplierService';
import SupplierForm from './SupplierForm';

const TYPE_CONFIG = {
  MATERIAL_SUPPLIER: { label: 'Materiales', color: 'text-blue-600 bg-blue-50' },
  SERVICE_SUPPLIER: { label: 'Servicios', color: 'text-amber-600 bg-amber-50' },
  MIXED: { label: 'Mixto', color: 'text-emerald-600 bg-emerald-50' }
};

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await supplierService.getSuppliers();
        if (isMounted && response?.success) {
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

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = !searchTerm ||
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rfc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || s.supplier_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await supplierService.deleteSupplier(id);
        setSuppliers(suppliers.filter(s => s.id !== id));
      } catch (error) {
        alert('Error al eliminar: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getTypeBadge = (type) => {
    const config = TYPE_CONFIG[type] || { label: type, color: 'text-slate-400 bg-slate-50' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') return (
      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">Activo</span>
    );
    return (
      <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">Inactivo</span>
    );
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
            placeholder="Buscar por nombre, razón social o RFC..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium transition-all"
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
            <option value="MATERIAL_SUPPLIER">Materiales</option>
            <option value="SERVICE_SUPPLIER">Servicios</option>
            <option value="MIXED">Mixto</option>
          </select>
          <button
            onClick={() => { setSelectedSupplier(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Proveedor</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Contacto</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Tipo</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Estado</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando proveedores...</td></tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No se encontraron proveedores.</td></tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-black">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{s.name}</p>
                        {s.business_name && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Building2 size={10} /> {s.business_name}
                          </p>
                        )}
                        {s.rfc && (
                          <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
                            <FileText size={10} /> {s.rfc}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {s.contact_name && (
                        <p className="text-xs font-bold text-slate-600">{s.contact_name}</p>
                      )}
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
                      {s.address && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin size={12} />
                          <span className="truncate max-w-[200px]">{s.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">{getTypeBadge(s.supplier_type)}</td>
                  <td className="py-4 px-6 text-center">{getStatusBadge(s.status)}</td>
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
          onClose={() => { setShowModal(false); setSelectedSupplier(null); }}
          onSuccess={() => {
            const fetchSuppliers = async () => {
              const response = await supplierService.getSuppliers();
              if (response?.success) {
                setSuppliers(Array.isArray(response.data) ? response.data : []);
              }
            };
            fetchSuppliers();
          }}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
