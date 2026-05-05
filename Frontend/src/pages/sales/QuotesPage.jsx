import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Eye, RefreshCw, CheckCircle2, Clock, XCircle, ChevronRight, Filter } from 'lucide-react';
import quoteService from '../../api/quoteService';
import OrderFormModal from './OrderFormModal';

const QuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await quoteService.getQuotes();
      // El backend devuelve { data: { quotes: [...] } }
      setQuotes(response.data?.quotes || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuotes([]); // Fallback a lista vacía
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('¿Aprobar esta cotización?')) {
      try {
        await quoteService.approveQuote(id);
        fetchQuotes();
      } catch (error) {
        alert('Error al aprobar: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleConvert = async (id) => {
    if (window.confirm('¿Deseas convertir esta cotización en una VENTA REAL? Esto generará un folio de venta y permitirá iniciar la producción.')) {
      try {
        await quoteService.convertToSale(id);
        alert('Cotización convertida en Venta con éxito.');
        fetchQuotes();
      } catch (error) {
        alert('Error al convertir: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CONVERTED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'EXPIRED': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Cotizaciones
            <span className="bg-amber-100 text-amber-600 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-200">Presupuestos</span>
          </h1>
          <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-wider">Gestión de propuestas comerciales para clientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl shadow-amber-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
        >
          <div className="bg-white/20 p-1.5 rounded-full group-hover:rotate-90 transition-transform duration-300">
            <Plus size={18} />
          </div>
          NUEVA COTIZACIÓN
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 items-center border border-slate-100">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none focus:ring-4 ring-amber-500/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
            <Filter size={20} />
          </button>
          <button onClick={fetchQuotes} className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid of Quotes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Cargando propuesta comercial...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No hay cotizaciones registradas</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto font-bold mb-8">Empieza creando un presupuesto para tus clientes y dales seguimiento hasta la venta.</p>
          <button onClick={() => setShowForm(true)} className="text-amber-600 font-black text-xs uppercase tracking-widest hover:underline">Crear mi primera cotización</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className="group bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-amber-200 transition-all hover:scale-[1.02] flex flex-col h-full">
              
              <div className="flex justify-between items-start mb-6">
                <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(quote.status)}`}>
                  {quote.status}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Folio</p>
                  <p className="font-black text-slate-900">{quote.quote_number}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Cliente</p>
                  <h3 className="text-lg font-black text-slate-900 truncate">
                    {quote.client ? `${quote.client.name} ${quote.client.last_name || ''}` : 'Cliente Desconocido'}
                  </h3>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-slate-900">${parseFloat(quote.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 text-right">Items</p>
                    <p className="text-2xl font-black text-slate-400 text-right">{quote.items?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex gap-2">
                {quote.status === 'DRAFT' && (
                  <button 
                    onClick={() => handleApprove(quote.id)}
                    className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                )}
                {quote.status === 'APPROVED' && (
                  <button 
                    onClick={() => handleConvert(quote.id)}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Convertir a Venta
                  </button>
                )}
                <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <OrderFormModal 
          mode="QUOTE"
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchQuotes();
          }}
        />
      )}
    </div>
  );
};

export default QuotesPage;
