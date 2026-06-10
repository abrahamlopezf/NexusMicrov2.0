import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Play, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import productionService from '../../api/productionService';

const OperationalGarments = () => {
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    production_status: '',
    delivery_status: '',
    urgent: '',
    client: ''
  });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    fetchGarments();
  }, [filters]);

  const fetchGarments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.production_status) params.production_status = filters.production_status;
      if (filters.delivery_status) params.delivery_status = filters.delivery_status;
      if (filters.urgent) params.urgent = filters.urgent;
      if (filters.client) params.client = filters.client;

      const res = await productionService.getGarments(params);
      if (isMounted.current && res?.success) {
        setGarments(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching garments:', err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const getProdBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const map = {
      'PENDING': { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      'IN_PROGRESS': { label: 'En Proceso', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Play },
      'DONE': { label: 'Terminado', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    };
    const c = map[s] || map['PENDING'];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[10px] font-black uppercase`}>
        <Icon size={10} /> {c.label}
      </span>
    );
  };

  const getDelBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const map = {
      'PENDING': { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600' },
      'READY': { label: 'Listo', bg: 'bg-emerald-50', text: 'text-emerald-600' },
      'DELIVERED': { label: 'Entregado', bg: 'bg-blue-50', text: 'text-blue-600' },
    };
    const c = map[s] || { label: s, bg: 'bg-slate-50', text: 'text-slate-600' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[10px] font-black uppercase`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-50 rounded-2xl items-center">
        <Filter size={16} className="text-slate-400" />
        <select
          value={filters.production_status}
          onChange={(e) => setFilters(f => ({ ...f, production_status: e.target.value }))}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="DONE">Terminado</option>
        </select>
        <select
          value={filters.delivery_status}
          onChange={(e) => setFilters(f => ({ ...f, delivery_status: e.target.value }))}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="">Entrega: Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="READY">Listo</option>
          <option value="DELIVERED">Entregado</option>
        </select>
        <select
          value={filters.urgent}
          onChange={(e) => setFilters(f => ({ ...f, urgent: e.target.value }))}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="">Urgencia: Todas</option>
          <option value="true">Urgente</option>
          <option value="">Normal</option>
        </select>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filters.client}
            onChange={(e) => setFilters(f => ({ ...f, client: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Prenda / Cliente</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Cant.</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Producción</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Entrega</th>
              <th className="text-center py-4 px-6 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando...</td></tr>
            ) : garments.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No hay prendas en operación.</td></tr>
            ) : (
              garments.map((item) => {
                const sale = item.sale || {};
                const client = sale.client || {};
                return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          #{item.id}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm leading-none">{item.product?.name || 'Prenda'}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{client.name || 'Cliente N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-black text-slate-700">{item.quantity}</td>
                    <td className="py-4 px-6 text-center">{getProdBadge(item.production_status)}</td>
                    <td className="py-4 px-6 text-center">{getDelBadge(item.delivery_status)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-[10px] font-bold text-slate-400">#{sale.id}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperationalGarments;