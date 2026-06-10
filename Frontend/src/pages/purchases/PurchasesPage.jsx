import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Plus, Search, Eye, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import purchaseService from '../../api/purchaseService';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseDetailModal from './PurchaseDetailModal';
import ErrorBoundary from '../../components/ErrorBoundary';

const PurchasesPage = () => {
  const { pathname } = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getPurchaseOrders();
      if (response && response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, pathname]);

  const prevShowModal = useRef(showModal);
  useEffect(() => {
    if (prevShowModal.current && !showModal) {
      fetchOrders();
    }
    prevShowModal.current = showModal;
  }, [showModal, fetchOrders]);

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
              <th className="text-left py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Materiales</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Total</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Estado</th>
              <th className="text-center py-5 px-6 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Fecha</th>
              <th className="text-right py-5 px-8 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
              {loading ? (
              <tr><td colSpan={6} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Consultando historial de compras...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-medium">No hay órdenes de compra registradas.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-8">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{order.purchase_number || `OC-${String(order.id).padStart(5, '0')}`}</p>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">{order.supplier?.name || 'Proveedor N/A'}</p>
                      {order.reference && <p className="text-[10px] text-slate-400 font-mono">Ref: {order.reference}</p>}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <Package size={12} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{order.items?.length || 0} material(es)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {order.items?.slice(0, 2).map(i => i.material?.name).filter(Boolean).join(', ')}
                      {(order.items?.length || 0) > 2 ? '...' : ''}
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
                      {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedPurchaseId(order.id)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                        title="Ver detalle"
                      >
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
        <ErrorBoundary>
          <PurchaseOrderForm 
            onClose={() => setShowModal(false)}
          />
        </ErrorBoundary>
      )}

      {selectedPurchaseId && (
        <PurchaseDetailModal
          purchaseId={selectedPurchaseId}
          onClose={() => setSelectedPurchaseId(null)}
        />
      )}
    </div>
  );
};

export default PurchasesPage;
