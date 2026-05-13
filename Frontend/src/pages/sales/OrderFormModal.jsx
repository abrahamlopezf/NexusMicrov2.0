import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingCart, FileText, User, Trash2, Save, AlertCircle, ChevronDown, CreditCard, Banknote, Landmark, Calculator, Zap, Plus } from 'lucide-react';
import saleService from '../../api/saleService';
import api from '../../api/axios';

const OrderFormModal = ({ mode = 'QUOTE', onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [saleType, setSaleType] = useState('CONTADO'); // 'CONTADO' o 'CREDITO'
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isRewardSale, setIsRewardSale] = useState(false);
  
  const [manualTotal, setManualTotal] = useState(null);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [searchClient, setSearchClient] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const clientDropRef = useRef(null);
  const productDropRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    const handleClickOutside = (e) => {
      if (clientDropRef.current && !clientDropRef.current.contains(e.target)) setShowClientDrop(false);
      if (productDropRef.current && !productDropRef.current.contains(e.target)) setShowProductDrop(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [cRes, pRes, aRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/finance/accounts').catch(() => ({ data: { data: [] } }))
      ]);
      
      setClients(cRes.data?.data || []);
      const pData = pRes.data?.data?.products || pRes.data?.data || [];
      setProducts(Array.isArray(pData) ? pData : []);
      
      const accs = aRes.data?.data || [];
      setAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccount(accs.find(a => a.type === 'CAJA') || accs[0]);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar datos base. Verifica tu conexión.');
    } finally {
      setLoadingData(false);
    }
  };

  const addItem = (product) => {
    if (!product) return;
    const exists = items.find(i => i.id === product.id);
    if (exists) {
      setItems(items.map(i => i.id === product.id ? { ...i, quantity: (parseInt(i.quantity) || 0) + 1 } : i));
    } else {
      setItems([...items, { 
        id: product.id, 
        name: product.name || 'Sin nombre', 
        quantity: 1, 
        price: parseFloat(product.base_price || 0) 
      }]);
    }
    setShowProductDrop(false);
    setSearchProduct("");
    setManualTotal(null);
  };

  const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
  const finalTotal = isRewardSale ? 0 : (manualTotal !== null ? manualTotal : calculatedTotal);
  
  useEffect(() => {
    if (isRewardSale) {
        setPaymentAmount(0);
    } else if (saleType === 'CONTADO') {
        setPaymentAmount(finalTotal);
    }
  }, [finalTotal, isRewardSale, saleType]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setShowClientDrop(false);
    setSearchClient("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return setError('Selecciona un cliente');
    if (items.length === 0) return setError('Agrega al menos una prenda');
    // Se eliminó la validación estricta de cuenta para permitir el flujo automatizado a Caja

    try {
      setLoading(true);
      setError(null);
      
      // Ruteo inteligente de cuentas basado en el método de pago
      let targetAccount = null;
      if (paymentMethod === 'EFECTIVO') {
        targetAccount = accounts.find(a => a.type === 'CAJA');
      } else {
        targetAccount = accounts.find(a => a.type === 'BANCO');
      }
      // Fallback seguro a la caja principal (ID 1) si no se encuentra
      const finalAccountId = targetAccount?.id || 1;

      const payload = {
        saleData: {
          sale_number: `VTA-${Date.now().toString().slice(-8)}`,
          client_id: selectedClient.id,
          type: isRewardSale ? 'REWARD' : 'NORMAL',
          loyalty_applied: isRewardSale,
          is_urgent: isUrgent,
          delivery_date: deliveryDate || null,
          notes: notes,
          total: parseFloat(finalTotal) || 0,
          balance: parseFloat(finalTotal) || 0
        },
        itemsData: items.map(i => {
          const priceVal = isRewardSale ? 0 : (parseFloat(i.price) || 0);
          return {
            product_id: i.id,
            quantity: Math.max(1, parseInt(i.quantity) || 1),
            manual_price: priceVal,
            unit_price: priceVal // Agregado para satisfacer la validación estricta del backend
          };
        }),
        paymentData: mode === 'QUOTE' ? null : {
          payment_method: isRewardSale ? 'GRATIS' : paymentMethod,
          amount: parseFloat(paymentAmount) || 0,
          account_id: finalAccountId, 
          type: parseFloat(paymentAmount) >= finalTotal ? 'LIQUIDACION' : 'ANTICIPO'
        }
      };

      if (mode === 'QUOTE') {
          await api.post('/quotes', {
              client_id: selectedClient.id,
              items: items.map(i => ({ productId: i.id, quantity: i.quantity, manual_price: i.price })),
              notes
          });
      } else {
          await saleService.createSale(payload);
      }

      alert('¡Orden registrada con éxito!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving sale:', err);
      const serverError = err.response?.data?.message || err.response?.data?.errors || err.response?.data || err.message;
      setError(`ERROR DEL SERVIDOR: ${typeof serverError === 'object' ? JSON.stringify(serverError) : serverError}`);
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c?.name || '').toLowerCase().includes((searchClient || '').toLowerCase()) || 
    (c?.phone && c.phone.includes(searchClient))
  );

  const filteredProducts = products.filter(p => 
    (p?.name || '').toLowerCase().includes((searchProduct || '').toLowerCase())
  );

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9A14A]/20 border-t-[#C9A14A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-black tracking-widest text-xs uppercase">Cargando Sistema POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mode === 'QUOTE' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-[#C9A14A] shadow-[#C9A14A]/40'} shadow-lg`}>
              {mode === 'QUOTE' ? <FileText size={24} /> : <ShoppingCart size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">
                {mode === 'QUOTE' ? 'Nueva Cotización' : 'Punto de Venta (POS)'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">NexusMicro ERP System v2.0</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-rose-500 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/50 custom-scrollbar">
          
          {/* CLIENTE */}
          <div className="lg:col-span-4 space-y-6">
            {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-black text-xs">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative" ref={clientDropRef}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14} /> Datos del Cliente</h3>
              {selectedClient ? (
                  <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
                            {(selectedClient.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{selectedClient.name || 'Sin nombre'}</p>
                            <p className="text-[10px] font-bold text-slate-400">{selectedClient.phone || 'Sin teléfono'}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="text-slate-300 hover:text-rose-500 transition-all"><X size={20} /></button>
                  </div>
              ) : (
                  <div className="relative">
                      <div onClick={() => setShowClientDrop(!showClientDrop)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 flex justify-between items-center cursor-pointer hover:border-[#C9A14A]/30 transition-all">
                          <span className="text-sm">{searchClient || 'Buscar cliente...'}</span>
                          <ChevronDown size={20} className="text-slate-400" />
                      </div>
                      {showClientDrop && (
                          <div className="absolute z-50 top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                              <div className="p-3 bg-slate-50 border-b"><input autoFocus className="w-full p-3 bg-white rounded-xl border-2 border-slate-100 text-sm font-bold" placeholder="Escribe nombre o folio..." value={searchClient} onChange={e => setSearchClient(e.target.value)} /></div>
                              <div className="max-h-52 overflow-y-auto">
                                  {filteredClients.map(c => (
                                      <div key={c.id} onClick={() => handleSelectClient(c)} className="p-4 hover:bg-[#C9A14A]/10 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors">
                                          <div>
                                            <p className="text-sm font-black text-slate-900">{c.name || 'Sin nombre'}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Puntos: {c.loyalty_points || 0}</p>
                                          </div>
                                          <Plus size={16} className="text-[#C9A14A]" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calculator size={14} /> Configuración</h3>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 ml-2">FECHA DE ENTREGA</label>
                    <input type="date" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-[#C9A14A]/30 transition-all" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
                <button type="button" onClick={() => setIsUrgent(!isUrgent)} className={`w-full py-4 rounded-2xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-2 ${isUrgent ? 'bg-rose-500 border-rose-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    {isUrgent ? <Zap size={14} /> : null} {isUrgent ? 'PEDIDO URGENTE' : 'PEDIDO NORMAL'}
                </button>
            </div>
          </div>

          {/* PRENDAS */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative flex flex-col h-full min-h-[500px]" ref={productDropRef}>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14} /> Carrito</h3>
                
                <div onClick={() => setShowProductDrop(!showProductDrop)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-all">
                    <span className="text-sm">{searchProduct || 'Seleccionar prenda...'}</span>
                    <ChevronDown size={20} />
                </div>

                {showProductDrop && (
                    <div className="absolute z-50 left-6 right-6 top-[100px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b"><input autoFocus className="w-full p-3 bg-white rounded-xl border-2 border-slate-100 text-sm font-bold" placeholder="Escribe nombre..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} /></div>
                        <div className="max-h-64 overflow-y-auto">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => addItem(p)} className="p-4 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{p.name || 'Sin nombre'}</p>
                                        <p className="text-[10px] font-bold text-slate-400">${parseFloat(p.base_price || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Plus size={16} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="bg-slate-50/50 p-4 rounded-2xl border-2 border-slate-100 flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, quantity: Math.max(1, parseInt(i.quantity) + 1)} : i))} className="p-1"><Plus size={14} /></button>
                        <input type="number" className="w-12 py-1 bg-white border-2 border-slate-200 rounded-xl text-center font-black text-xs" value={item.quantity} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, quantity: e.target.value} : i))} />
                        <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, quantity: Math.max(1, parseInt(i.quantity) - 1)} : i))} className="p-1"><X size={14} /></button>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">${parseFloat(item.price || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-slate-900">${(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toLocaleString()}</p>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-rose-300 hover:text-rose-500 mt-1"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>

          {/* PAGO */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 flex flex-col h-full">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Liquidación</h3>
                
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Condición de Venta</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSaleType('CONTADO')} className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${saleType === 'CONTADO' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}>
                            <span className="font-black text-xs uppercase">Contado</span>
                            <span className="text-[9px] font-bold">Pago completo</span>
                        </button>
                        <button onClick={() => setSaleType('CREDITO')} className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${saleType === 'CREDITO' ? 'border-[#C9A14A] bg-[#C9A14A]/5 text-[#C9A14A] shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}>
                            <span className="font-black text-xs uppercase">Crédito</span>
                            <span className="text-[9px] font-bold">Anticipos / Abonos</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Método</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setPaymentMethod('EFECTIVO')} className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === 'EFECTIVO' ? 'border-[#C9A14A] bg-[#C9A14A]/5 text-[#C9A14A]' : 'border-slate-50 text-slate-400'}`}>
                            <Banknote size={20} /> <span className="text-[9px] font-black uppercase">Efectivo</span>
                        </button>
                        <button onClick={() => setPaymentMethod('TARJETA')} className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === 'TARJETA' ? 'border-[#C9A14A] bg-[#C9A14A]/5 text-[#C9A14A]' : 'border-slate-50 text-slate-400'}`}>
                            <CreditCard size={20} /> <span className="text-[9px] font-black uppercase">Tarjeta</span>
                        </button>
                    </div>
                </div>

                {/* El selector de cuenta fue removido de la UI para simplificar la operación, 
                    pero el sistema sigue auto-seleccionando la 'CAJA' en el background (línea 55) */}

                <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <div className="flex items-center gap-1 font-black text-xl text-slate-900">
                            <span>$</span>
                            <input type="number" className="w-24 bg-transparent text-right outline-none border-b-2 border-slate-200" value={manualTotal !== null ? manualTotal : calculatedTotal} onChange={e => setManualTotal(e.target.value === "" ? null : parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex justify-between items-center">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            {saleType === 'CONTADO' ? 'Pago Completo' : 'Abono (Anticipo)'}
                        </span>
                        <input 
                            type="number" 
                            className={`w-24 bg-transparent text-right font-black text-lg text-emerald-700 outline-none ${saleType === 'CONTADO' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            value={paymentAmount} 
                            onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                            readOnly={saleType === 'CONTADO'}
                        />
                    </div>
                    {saleType === 'CREDITO' && (
                        <div className="flex justify-between items-center p-3 bg-rose-50 rounded-2xl border border-rose-100">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Saldo Deudor</span>
                            <span className="font-black text-lg text-rose-700">${Math.max(0, finalTotal - paymentAmount).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <button onClick={handleSubmit} disabled={loading || items.length === 0} className="w-full py-5 bg-[#C9A14A] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#C9A14A]/30 active:scale-95 transition-all">
                    {loading ? '...' : 'GUARDAR VENTA'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormModal;
