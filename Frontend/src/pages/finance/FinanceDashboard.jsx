import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DollarSign, Landmark, CreditCard, ArrowDownRight, ArrowUpRight, Search, FileText } from 'lucide-react';

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, payRes] = await Promise.all([
        api.get('/finance/accounts'),
        api.get('/finance/payments')
      ]);
      setAccounts(accRes.data.data);
      setPayments(payRes.data.data);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError('Error al cargar la información financiera.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sale?.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sale?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCaja = accounts.filter(a => a.type === 'CAJA').reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const totalBancos = accounts.filter(a => a.type === 'BANCO').reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const totalGlobal = totalCaja + totalBancos;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#C9A14A]/30 border-t-[#C9A14A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Bóveda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Caja y Finanzas</h1>
          <p className="text-slate-500 mt-1 font-bold text-sm tracking-widest uppercase">Control de flujo de efectivo y cuentas bancarias</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl font-bold flex items-center gap-3">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20"><DollarSign size={80} /></div>
          <div className="relative z-10">
            <h3 className="text-emerald-100 font-black text-xs uppercase tracking-widest mb-1">Efectivo en Caja</h3>
            <p className="text-4xl font-black tracking-tight">${totalCaja.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} /> Dinero físico disponible
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Landmark size={80} /></div>
          <div className="relative z-10">
            <h3 className="text-blue-100 font-black text-xs uppercase tracking-widest mb-1">Saldo en Bancos</h3>
            <p className="text-4xl font-black tracking-tight">${totalBancos.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              <CreditCard size={14} /> Transferencias y Tarjetas
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Capital Total</h3>
            <p className="text-4xl font-black tracking-tight text-slate-900">${totalGlobal.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              <FileText size={14} /> Suma global del negocio
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE TRANSACCIONES */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            Historial de Ingresos
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar folio o ref..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#C9A14A] focus:ring-1 focus:ring-[#C9A14A] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 border-b border-slate-200">Fecha</th>
                <th className="p-4 border-b border-slate-200">Concepto</th>
                <th className="p-4 border-b border-slate-200">Venta</th>
                <th className="p-4 border-b border-slate-200">Método</th>
                <th className="p-4 border-b border-slate-200">Cuenta</th>
                <th className="p-4 border-b border-slate-200 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="p-4 text-slate-500 font-bold text-xs">
                      {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(p.payment_date))}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider ${
                        p.type === 'ANTICIPO' ? 'bg-[#C9A14A]/10 text-[#C9A14A]' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-700">
                      {p.sale?.sale_number || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        {p.payment_method === 'EFECTIVO' ? <DollarSign size={14} className="text-emerald-500" /> : <CreditCard size={14} className="text-blue-500" />}
                        {p.payment_method}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-xs text-slate-500">
                      {p.account?.name || '-'}
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600">
                      + ${parseFloat(p.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                    No se encontraron movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
