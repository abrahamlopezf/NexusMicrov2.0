import React, { useState, useEffect, useRef } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import supplierService from '../../api/supplierService';

const SUPPLIER_TYPES = [
  { value: 'MATERIAL_SUPPLIER', label: 'Materiales' },
  { value: 'SERVICE_SUPPLIER', label: 'Servicios' },
  { value: 'MIXED', label: 'Mixto' }
];

const SupplierForm = ({ supplier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    rfc: '',
    supplier_type: 'MATERIAL_SUPPLIER',
    phone: '',
    email: '',
    address: '',
    contact_name: '',
    payment_terms: '',
    notes: '',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        business_name: supplier.business_name || '',
        rfc: supplier.rfc || '',
        supplier_type: supplier.supplier_type || 'MATERIAL_SUPPLIER',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contact_name: supplier.contact_name || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
        status: supplier.status || 'ACTIVE'
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
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Error al guardar el proveedor');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 bg-white z-10">
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

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre comercial</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Textiles del Norte"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Razón social</label>
                <input
                  type="text"
                  placeholder="Ej. Textiles del Norte S.A. de C.V."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">RFC</label>
                <input
                  type="text"
                  placeholder="XAXX010101000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de proveedor</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.supplier_type}
                  onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
                >
                  {SUPPLIER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Persona de contacto</label>
                <input
                  type="text"
                  placeholder="Nombre del contacto"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                <input
                  type="text"
                  placeholder="55-1234-5678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="contacto@empresa.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condiciones de pago</label>
                <input
                  type="text"
                  placeholder="Ej. 30 días"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dirección</label>
              <textarea
                placeholder="Calle, Número, Colonia, Ciudad..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</label>
              <textarea
                placeholder="Información adicional..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {supplier && (
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                <select
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            )}
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
