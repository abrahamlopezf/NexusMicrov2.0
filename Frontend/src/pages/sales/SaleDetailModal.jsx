import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Banknote, History, CheckCircle, Package, Settings, Truck, PieChart } from 'lucide-react';
import api from '../../api/axios';
import { ProductionTab } from './tabs/ProductionTab';
import { ServicesTab } from './tabs/ServicesTab';
import { CostsTab } from './tabs/CostsTab';

const SaleDetailModal = ({ saleId, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('FINANZAS');
  const [sale, setSale] = useState(null);
  const [posSummary, setPosSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  
  // Formulario de Abono
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');

  useEffect(() => {
    fetchSaleData();
  }, [saleId]);

  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const [saleRes, accRes] = await Promise.all([
        api.get(`/sales/${saleId}/pos-summary`),
        api.get('/finance/accounts').catch(() => ({ data: { data: [] } }))
      ]);
      
      const summary = saleRes.data.data;
      setPosSummary(summary);
      
      // Adapt summary to the old sale structure for the Finance tab
      setSale({
        ...summary.sale,
        client: summary.client,
        items: summary.items,
        payments: summary.payments?.active || [], // EL BACKEND DEVUELVE UN OBJETO CON active y cancelled
        total: summary.financial_summary?.total || summary.sale?.total,
        paid_amount: summary.financial_summary?.paid_amount || summary.sale?.paid_amount,
        balance: summary.financial_summary?.balance || summary.sale?.balance
      });
      
      setAccounts(accRes.data?.data || []);
      
      // Auto-rellenar con el saldo restante
      const balance = summary.financial_summary?.balance || summary.sale.balance;
      if (parseFloat(balance) > 0) {
        setAmount(parseFloat(balance).toString());
      } else {
        setAmount('');
      }
    } catch (err) {
      console.error(err);
      alert('Error cargando la venta');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Ingrese una cantidad válida");
      return;
    }
    
    if (parseFloat(amount) > parseFloat(sale.balance) + 0.01) {
      alert("El abono no puede ser mayor al saldo restante");
      return;
    }

    try {
      setPaying(true);
      
      let targetAccount = null;
      if (paymentMethod === 'EFECTIVO') {
        targetAccount = accounts.find(a => a.type === 'CAJA');
      } else {
        targetAccount = accounts.find(a => a.type === 'BANCO');
      }
      const accountId = targetAccount?.id || 1;

      await api.post('/payments', {
        sale_id: saleId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        account_id: accountId,
        type: 'ABONO'
      });

      alert("¡Abono registrado con éxito!");
      if (onSuccess) onSuccess();
      
      setAmount(''); // Limpiar el input
      fetchSaleData(); // Recargar los datos para mostrar el nuevo saldo
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error registrando abono');
    } finally {
      setPaying(false);
    }
  };

  if (loading || !sale) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
         <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* HEADER & TABS */}
        <div className="px-10 pt-10 pb-0 border-b border-slate-100 flex flex-col bg-white z-10 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                {sale.sale_number}
                {sale.is_paid ? <span className="text-[10px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">Liquidado</span> : <span className="text-[10px] bg-amber-100 text-amber-600 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200">Con Saldo</span>}
              </h2>
              <p className="text-slate-500 font-bold mt-2">{sale.client?.name}</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm border border-slate-100">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('FINANZAS')}
              className={`pb-4 font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'FINANZAS' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <DollarSign size={16}/> Finanzas
            </button>
            <button 
              onClick={() => setActiveTab('PRODUCCION')}
              className={`pb-4 font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'PRODUCCION' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Settings size={16}/> Producción
            </button>
            <button 
              onClick={() => setActiveTab('SERVICIOS')}
              className={`pb-4 font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'SERVICIOS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Truck size={16}/> Servicios Externos
            </button>
            <button 
              onClick={() => setActiveTab('COSTOS')}
              className={`pb-4 font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'COSTOS' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <PieChart size={16}/> Resumen de Costos
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50/50">
          
          {/* FINANZAS - Left Column */}
          <div className={`flex-1 overflow-y-auto p-10 ${activeTab === 'FINANZAS' ? '' : 'hidden'}`}>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={14}/> Productos
              </h3>
              <div className="space-y-4">
                {sale.items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{item.product_name || item.custom_description || 'Producto Desconocido'}</p>
                      <p className="text-xs text-slate-400 font-bold">{item.quantity} unds. x ${parseFloat(item.unit_price).toLocaleString()}</p>
                    </div>
                    <p className="font-black text-slate-900">${parseFloat(item.total).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History size={14}/> Historial de Pagos
              </h3>
              {sale.payments?.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No hay pagos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {sale.payments?.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {payment.payment_method === 'EFECTIVO' ? <Banknote size={16} className="text-emerald-500"/> : <CreditCard size={16} className="text-indigo-500"/>}
                        <div>
                          <p className="text-xs font-black text-slate-700">{payment.payment_method}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(payment.payment_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="font-black text-emerald-600">+ ${parseFloat(payment.amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FINANZAS - Right Panel */}
          <div className={`w-full md:w-96 bg-white p-10 border-l border-slate-100 flex flex-col overflow-y-auto shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] z-10 ${activeTab === 'FINANZAS' ? '' : 'hidden'}`}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Estado Financiero</h3>
            
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-slate-500">Total Venta</p>
                <p className="font-black text-slate-900">${parseFloat(sale.total).toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-slate-500">Abonado</p>
                <p className="font-black text-emerald-600">${parseFloat(sale.paid_amount).toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <p className="text-sm font-black text-slate-700">Saldo Restante</p>
                <p className={`font-black text-2xl ${parseFloat(sale.balance) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ${parseFloat(sale.balance).toLocaleString()}
                </p>
              </div>
            </div>

            {parseFloat(sale.balance) > 0 ? (
              <form onSubmit={handleAddPayment} className="mt-auto space-y-6">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                  <h4 className="font-black text-emerald-800 mb-4 flex items-center gap-2">
                    <DollarSign size={18} />
                    Registrar Abono
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Método de Pago</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setPaymentMethod('EFECTIVO')} className={`p-3 rounded-2xl font-black text-xs transition-all border ${paymentMethod === 'EFECTIVO' ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-white text-slate-500 border-emerald-100 hover:bg-emerald-50'}`}>Efectivo</button>
                        <button type="button" onClick={() => setPaymentMethod('TARJETA')} className={`p-3 rounded-2xl font-black text-xs transition-all border ${paymentMethod === 'TARJETA' ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-white text-slate-500 border-indigo-100 hover:bg-indigo-50'}`}>Tarjeta</button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Monto a abonar</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                        <input 
                          type="number"
                          step="0.01"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-white border border-emerald-100 rounded-2xl pl-10 pr-4 py-3 font-black text-emerald-900 focus:outline-none focus:ring-4 ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={paying}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paying ? 'Procesando...' : 'Aplicar Abono'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-auto bg-emerald-50 p-8 rounded-3xl border border-emerald-100 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h4 className="font-black text-emerald-800 text-xl">Venta Liquidada</h4>
                <p className="text-emerald-600/70 text-sm font-bold mt-2">Esta venta no presenta saldos pendientes.</p>
              </div>
            )}
          </div>

          <div className={`flex-1 flex overflow-hidden ${activeTab === 'PRODUCCION' ? '' : 'hidden'}`}>
            <ProductionTab posSummary={posSummary} saleId={saleId} onReload={fetchSaleData} />
          </div>
          <div className={`flex-1 flex overflow-hidden ${activeTab === 'SERVICIOS' ? '' : 'hidden'}`}>
            <ServicesTab posSummary={posSummary} saleId={saleId} onReload={fetchSaleData} />
          </div>
          <div className={`flex-1 flex overflow-hidden ${activeTab === 'COSTOS' ? '' : 'hidden'}`}>
            <CostsTab saleId={saleId} />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
