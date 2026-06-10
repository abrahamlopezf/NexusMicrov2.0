import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import productionService from '../../api/productionService';

const ProductionStats = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, doneRes] = await Promise.all([
          productionService.getWorkOrders(),
          productionService.getWorkOrders({ status: 'DONE' })
        ]);
        if (isMounted.current) {
          setOrders(Array.isArray(allRes?.data) ? allRes.data : []);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  const total = orders.length;
  const done = orders.filter(o => o.status === 'DONE').length;
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const cards = [
    { label: 'Órdenes Totales', value: total, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completadas', value: done, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En Proceso', value: inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Tasa de Finalización', value: `${completionRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-5 bg-white rounded-2xl border border-slate-100">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-black text-slate-900">{card.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-100">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Distribución de Estados</h3>
        <div className="space-y-3">
          {[
            { label: 'Pendientes', value: pending, color: 'bg-amber-400', total },
            { label: 'En Proceso', value: inProgress, color: 'bg-indigo-500', total },
            { label: 'Completadas', value: done, color: 'bg-emerald-500', total },
          ].map((item) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-600">{item.label}</span>
                  <span className="font-black text-slate-700">{item.value} ({Math.round(pct)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionStats;