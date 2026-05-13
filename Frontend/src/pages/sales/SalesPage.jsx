import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Eye, RefreshCw, DollarSign, Calendar, Filter, Download, ArrowUpRight } from 'lucide-react';
import saleService from '../../api/saleService';
import OrderFormModal from './OrderFormModal';
import SaleDetailModal from './SaleDetailModal';

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await saleService.getSales();
      // El servicio devuelve { success: true, data: [...] }
      const salesArray = response?.data || [];
      setSales(Array.isArray(salesArray) ? salesArray : []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PARTIAL': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100'; // PENDING
    }
  };

  const filteredSales = sales.filter(s => 
    s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Ventas
            <span className="bg-emerald-100 text-emerald-600 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200">Ingresos</span>
          </h1>
          <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-wider">Historial de órdenes y facturación</p>
        </div>
        <div className="flex gap-4">
            <button className="hidden md:flex bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all items-center gap-2">
                <Download size={16} /> Exportar
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              <div className="bg-white/20 p-1.5 rounded-full group-hover:rotate-90 transition-transform duration-300">
                <Plus size={18} />
              </div>
              NUEVA VENTA
            </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Ventas Totales</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                  ${sales.reduce((acc, s) => acc + parseFloat(s.total), 0).toLocaleString()}
              </h4>
              <div className="mt-4 flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                  <ArrowUpRight size={14} /> +12% vs mes anterior
              </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Por Cobrar (Saldos)</p>
              <h4 className="text-3xl font-black text-rose-600 tracking-tighter">
                  ${sales.reduce((acc, s) => acc + parseFloat(s.balance), 0).toLocaleString()}
              </h4>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Órdenes Activas</p>
              <h4 className="text-3xl font-black text-indigo-600 tracking-tighter">
                  {sales.filter(s => s.status !== 'PAID').length}
              </h4>
          </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 group w-full max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar folio o cliente..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-4 ring-emerald-500/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
              <Filter size={20} />
            </button>
            <button onClick={fetchSales} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio de Venta</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando caja...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-bold italic text-sm">No se encontraron ventas con esos criterios.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                          <DollarSign size={16} />
                        </div>
                        <span className="font-black text-slate-900">{sale.sale_number}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-700">{sale.client ? `${sale.client.name} ${sale.client.last_name || ''}` : '---'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {sale.client_id}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                        <Calendar size={14} className="text-slate-300" />
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-lg">${parseFloat(sale.total).toLocaleString()}</p>
                      {parseFloat(sale.balance) > 0 && (
                          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Saldo: ${parseFloat(sale.balance).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(sale.status)}`}>
                          {sale.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelectedSaleId(sale.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors group-hover:text-indigo-600">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <OrderFormModal 
          mode="SALE"
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchSales();
          }}
        />
      )}

      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onSuccess={() => {
            fetchSales();
          }}
        />
      )}
    </div>
  );
};

export default SalesPage;
