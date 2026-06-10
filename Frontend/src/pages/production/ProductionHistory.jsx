import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Hammer, Calendar } from 'lucide-react';
import productionService from '../../api/productionService';

const ProductionHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await productionService.getWorkOrders({ status: 'DONE' });
        if (isMounted.current && res?.success) {
          setOrders(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted.current = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando historial...</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-20 text-center">
        <Clock size={40} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-black text-slate-900">Sin Historial</h2>
        <p className="text-slate-500">Aún no hay órdenes de producción finalizadas.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
        {orders.length} {orders.length === 1 ? 'orden finalizada' : 'órdenes finalizadas'}
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Orden</th>
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Producto</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Cant.</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Estado</th>
              <th className="text-right py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Completado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => {
              const mainTask = order.tasks?.[0];
              return (
                <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                      <span className="font-black text-slate-700">#{order.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-700 text-sm">{mainTask?.product?.name || 'Producto N/A'}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.notes || ''}</p>
                  </td>
                  <td className="py-4 px-6 text-center font-black text-slate-700">{mainTask?.quantity || 0}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                      <CheckCircle2 size={10} /> Finalizado
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold text-slate-400">
                      {order.end_date ? new Date(order.end_date).toLocaleDateString() : '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionHistory;