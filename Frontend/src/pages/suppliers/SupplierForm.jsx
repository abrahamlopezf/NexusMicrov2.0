import React, { useState, useEffect, useRef } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import supplierService from '../../api/supplierService';

const SupplierForm = ({ supplier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      });
    }
    return () => { isMounted.current = false; };
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isMounted.current) setLoading(true);
      setError(null);

      if (supplier?.id) {
        await supplierService.updateSupplier(supplier.id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }

      alert('Proveedor guardado con éxito.');
      window.location.reload();
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error al guardar el proveedor');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Truck size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre de la Empresa / Contacto</label>
              <input
                required
                type="text"
                placeholder="Ej. Textiles del Norte S.A."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="55-1234-5678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="contacto@empresa.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Dirección Física</label>
              <textarea
                placeholder="Calle, Número, Colonia, Ciudad..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-xl shadow-slate-900/20"
            >
              {loading ? "Cargando..." : "Guardar Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
