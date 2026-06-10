import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, Send, CheckCircle2, AlertCircle, Clock, Ban, FileText, DollarSign } from 'lucide-react';
import api from '../../../api/axios';

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', icon: Clock, color: 'bg-slate-100 text-slate-600', next: ['SENT', 'CANCELLED'] },
  SENT: { label: 'Enviado', icon: Send, color: 'bg-blue-100 text-blue-600', next: ['IN_PROGRESS', 'CANCELLED'] },
  IN_PROGRESS: { label: 'En Proceso', icon: AlertCircle, color: 'bg-amber-100 text-amber-600', next: ['RECEIVED', 'CANCELLED'] },
  RECEIVED: { label: 'Recibido', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', next: [] },
  CANCELLED: { label: 'Cancelado', icon: Ban, color: 'bg-rose-100 text-rose-600', next: [] }
};

const SERVICE_TYPES = ['BORDADO', 'PLANCHADO', 'MAQUILA', 'AJUSTE', 'ESTAMPADO'];

export const ServicesTab = ({ posSummary, saleId, onReload }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [cancelServiceId, setCancelServiceId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    sale_item_id: '',
    service_type: 'BORDADO',
    description: '',
    quantity: 1,
    unit_cost: 0,
    notes: ''
  });

  useEffect(() => {
    api.get('/suppliers')
      .then(res => {
        const rawData = res.data?.data || res.data || [];
        const valid = Array.isArray(rawData) ? rawData.filter(s => s.supplier_type === 'SERVICE_SUPPLIER' || s.supplier_type === 'MIXED') : [];
        setSuppliers(valid);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post('/suppliers/external-services', {
        ...formData,
        sale_id: saleId,
        supplier_id: parseInt(formData.supplier_id),
        sale_item_id: formData.sale_item_id ? parseInt(formData.sale_item_id) : undefined,
        quantity: parseInt(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost)
      });
      setIsAdding(false);
      setFormData({ supplier_id: '', sale_item_id: '', service_type: 'BORDADO', description: '', quantity: 1, unit_cost: 0, notes: '' });
      onReload();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar servicio externo');
    }
  };

  const updateStatus = async (serviceId, status) => {
    if (status === 'CANCELLED') {
      setCancelServiceId(serviceId);
      setCancelReason('');
      return;
    }
    try {
      await api.patch(`/suppliers/external-services/${serviceId}/status`, { status });
      onReload();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const confirmCancel = async () => {
    if (!cancelServiceId) return;
    try {
      await api.patch(`/suppliers/external-services/${cancelServiceId}/status`, {
        status: 'CANCELLED',
        cancellation_reason: cancelReason || 'Cancelado'
      });
      setCancelServiceId(null);
      setCancelReason('');
      onReload();
    } catch {
      setError('Error al cancelar servicio');
    }
  };

  const items = posSummary?.items || [];
  const allServices = posSummary?.external_services?.all || [];
  const totals = posSummary?.external_services?.summary;
  const showEmpty = allServices.length === 0 && !isAdding;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck size={22} className="text-amber-500" />
            Servicios Externos
          </h2>
          {totals && (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {allServices.length} servicio(s) · Costo comprometido: ${parseFloat(totals.committed_cost || 0).toLocaleString()} · Recibido: ${parseFloat(totals.received_cost || 0).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setError(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            isAdding ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
          }`}
        >
          <span className="inline-flex items-center">
            <X size={16} className={isAdding ? '' : 'hidden'} />
            <Plus size={16} className={isAdding ? 'hidden' : ''} />
          </span>
          <span>{isAdding ? 'Cancelar' : 'Nuevo Servicio'}</span>
        </button>
      </div>

      <div className={`mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold ${error ? '' : 'hidden'}`}>
        <AlertCircle size={18} />
        {error}
      </div>

      <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-3xl shadow-sm border border-amber-100 mb-6 space-y-4 ${isAdding ? '' : 'hidden'}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</label>
            <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
              <option value="">Seleccione...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prenda (opcional)</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.sale_item_id} onChange={e => setFormData({...formData, sale_item_id: e.target.value})}>
              <option value="">Toda la venta</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.product_name || `Item #${i.id}`}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
            <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo unit. ($)</label>
            <input required type="number" min="0" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad</label>
            <input required type="number" min="1" step="1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</label>
          <input required type="text" placeholder="Ej. Bordado de logo en camisa" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <button type="submit" className="px-6 py-2.5 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20">
          Guardar Servicio
        </button>
      </form>

      <div className="space-y-3">
        <div className={`py-16 text-center ${showEmpty ? '' : 'hidden'}`}>
          <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-4">
            <Truck size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold text-sm">No hay servicios externos registrados para esta venta.</p>
        </div>

        {allServices.map(service => {
          const cfg = STATUS_CONFIG[service.status] || STATUS_CONFIG.PENDING;
          const StatusIcon = cfg.icon;
          return (
            <div key={service.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{service.description}</span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md">{service.service_number || `#${service.id}`}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="font-bold">{service.service_type}</span>
                    <span className="flex items-center gap-1">{service.supplier_name || '—'}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} />{parseFloat(service.total_cost || service.unit_cost || 0).toLocaleString()}</span>
                  </div>
                  {service.cancellation_reason && (
                    <div className="mt-2 text-xs text-rose-500 italic flex items-center gap-1">
                      <Ban size={12} /> Motivo: {service.cancellation_reason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                  {cfg.next.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) updateStatus(service.id, e.target.value); }}
                      className="p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 outline-none bg-white cursor-pointer"
                    >
                      <option value="">Cambiar a...</option>
                      {cfg.next.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {service.notes && (
                <div className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1">
                  <FileText size={10} /> {service.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${cancelServiceId ? '' : 'hidden'}`}>
        <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-100 rounded-xl">
              <Ban size={20} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Cancelar Servicio</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Indica el motivo de cancelación</p>
            </div>
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de cancelación..."
            rows={3}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm resize-none"
            autoFocus
          />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setCancelServiceId(null)} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">
              Volver
            </button>
            <button onClick={confirmCancel} className="flex-1 px-6 py-3.5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20">
              Confirmar Cancelación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;
