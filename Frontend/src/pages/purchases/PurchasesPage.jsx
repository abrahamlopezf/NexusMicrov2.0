import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import purchaseService from '../../api/purchaseService';
import PurchaseOrderForm from './PurchaseOrderForm';

const PurchasesPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await purchaseService.getPurchaseOrders();
        if (isMounted && response && response.success) {
          setOrders(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  const handleReceive = async (id) => {
    if (window.confirm('¿Confirmas la recepción de esta mercancía? El stock se sumará al inventario automáticamente.')) {
      try {
        await purchaseService.receivePurchaseOrder(id);
        alert('Mercancía recibida e inventario actualizado.');
        window.location.reload();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      'PENDIENTE': { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      'RECIBIDA': { label: 'Recibida', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
      'CANCELADA': { label: 'Cancelada', bg: 'bg-rose-50', text: 'text-rose-600', icon: AlertCircle },
    };
    const config = configs[status] || configs['PENDIENTE'];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.text} text-[10px] font-black uppercase tracking-wider`}>
        <Icon size={12} />
        {config.label}
      </div>
    );
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Órdenes de Compra</h1>
            <p className="text-slate-500 font-medium text-sm">Gestiona el reabastecimiento de materia prima.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por proveedor o folio..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-600 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus size={18} />
          Nueva Compra
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-5 px-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Folio / Proveedor</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Total</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Estado</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Fecha</th>
              <th className="text-right py-5 px-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Consultando historial de compras...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-medium">No hay órdenes de compra registradas.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-8">
                    <div>
                      <p className="font-black text-slate-900 text-sm">OC-{String(order.id).padStart(5, '0')}</p>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">{order.supplier?.name || 'Proveedor N/A'}</p>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="font-black text-slate-900">${parseFloat(order.total || 0).toLocaleString()}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'PENDIENTE' && (
                        <button 
                          onClick={() => handleReceive(order.id)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
                        >
                          Recibir
                        </button>
                      )}
                      <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                        <Eye size={18} />
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
        <PurchaseOrderForm 
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default PurchasesPage;
