import React, { useState, useEffect } from 'react';
import { Plus, Hammer, Play, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import productionService from '../../api/productionService';
import ProductionModal from './ProductionModal';

const WorkOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await productionService.getWorkOrders();
        if (isMounted && response && response.success) {
          // Garantizar que sea un array
          setOrders(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  const handleAction = async (id, type) => {
    const msg = type === 'start' ? '¿Iniciar producción?' : '¿Finalizar producción? Se actualizarán inventarios.';
    if (!window.confirm(msg)) return;

    try {
      const response = type === 'start' 
        ? await productionService.startProduction(id)
        : await productionService.completeProduction(id);
      
      if (response && response.success) {
        alert('Operación exitosa.');
        window.location.reload();
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const configs = {
      'PENDING': { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      'IN_PROGRESS': { label: 'En Proceso', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Play },
      'DONE': { label: 'Finalizado', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    };
    const config = configs[s] || configs['PENDING'];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.text} text-[10px] font-black uppercase`}>
        <Icon size={10} />
        {config.label}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-8">
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} />
          Nueva Orden
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Orden / Producto</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Cant.</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Estado</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">No hay órdenes registradas.</td></tr>
            ) : (
              orders.map((order) => {
                if (!order) return null;
                const mainTask = order.tasks && order.tasks.length > 0 ? order.tasks[0] : null;
                const product = mainTask ? mainTask.product : null;
                
                return (
                  <tr key={order.id || Math.random()} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          #{order.id}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm leading-none">{product?.name || 'Producto N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">
                            {order.notes || 'Sin especificaciones'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-700">{mainTask?.quantity || 0}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {order.status === 'PENDING' && (
                          <button onClick={() => handleAction(order.id, 'start')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Iniciar">
                            <Play size={16} fill="currentColor" />
                          </button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleAction(order.id, 'complete')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Finalizar">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button className="p-2 text-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductionModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {}} 
        />
      )}
    </div>
  );
};

export default WorkOrdersPage;
