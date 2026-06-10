import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle, DollarSign, Hash } from 'lucide-react';
import productionService from '../../api/productionService';

const ProductionQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const res = await productionService.getQueue();
        if (isMounted.current && res?.success) {
          setQueue(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchQueue();
    return () => { isMounted.current = false; };
  }, []);

  const priorityLabel = (p) => {
    const map = {
      1: { label: 'Urgente', class: 'bg-rose-100 text-rose-600' },
      2: { label: 'Pagado', class: 'bg-emerald-100 text-emerald-600' },
      3: { label: 'Parcial', class: 'bg-amber-100 text-amber-600' },
      4: { label: 'Listo Entrega', class: 'bg-indigo-100 text-indigo-600' },
      5: { label: 'Entregado', class: 'bg-slate-100 text-slate-600' },
      6: { label: 'Impago', class: 'bg-rose-50 text-rose-500' },
    };
    return map[p] || { label: 'Baja', class: 'bg-slate-50 text-slate-400' };
  };

  const finStatusColor = (s) => {
    const map = {
      'PAID': 'text-emerald-600',
      'PARTIAL': 'text-amber-600',
      'UNPAID': 'text-rose-600',
      'PENDING': 'text-slate-400',
    };
    return map[s] || 'text-slate-400';
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando cola de producción...</div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="p-20 text-center">
        <Clock size={40} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-black text-slate-900">Cola Vacía</h2>
        <p className="text-slate-500">No hay órdenes pendientes de producción.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
        {queue.length} {queue.length === 1 ? 'orden' : 'órdenes'} en cola
      </p>
      <div className="space-y-3">
        {queue.map((entry) => {
          const pri = priorityLabel(entry.priority);
          return (
            <div key={entry.sale_id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Hash size={16} className="text-slate-400" />
                  <span className="font-black text-slate-700">#{entry.sale_id}</span>
                  <span className="text-slate-400 font-bold text-sm">{entry.sale_number}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${pri.class}`}>
                  {pri.label}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-slate-700">{entry.client?.name || 'Cliente N/A'}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <span className={`font-black ${finStatusColor(entry.financial_status)}`}>
                  <DollarSign size={12} className="inline mr-0.5" />
                  ${Number(entry.total || 0).toFixed(2)}
                </span>
                <span className="text-slate-400 font-medium">
                  {entry.items?.length || 0} prenda{(entry.items?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {entry.items?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                  {entry.items.map((item) => (
                    <span key={item.sale_item_id} className="px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500">
                      {item.product_name || `#${item.sale_item_id}`} × {item.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionQueuePage;