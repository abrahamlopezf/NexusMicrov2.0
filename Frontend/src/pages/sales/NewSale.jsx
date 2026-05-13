import { useState, useEffect } from "react";
import { ShoppingBag, Ruler, CheckCircle, ArrowRight, Trash2, Award, Sparkles, Calendar } from "lucide-react";
import ClientSearch from "../../components/sales/ClientSearch";
import ProductSearch from "../../components/sales/ProductSearch";
import api from "../../api/axios";

export default function NewSale() {
  const [cart, setCart] = useState([]);
  const [client, setClient] = useState(null);
  const [isRewardSale, setIsRewardSale] = useState(false);

  const [tempProduct, setTempProduct] = useState(null);
  const [measurements, setMeasurements] = useState({ length: '', waist: '', sleeves: '', notes: '' });
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset reward if client changes or becomes null
  useEffect(() => {
    setIsRewardSale(false);
  }, [client]);

  const rawTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const total = isRewardSale ? 0 : rawTotal;

  const handleCobrar = async () => {
    if (!client) return alert("Por favor selecciona un cliente de la lista.");
    if (cart.length === 0) return alert("Tu ticket está vacío. Agrega al menos un producto.");
    if (isRewardSale && cart.length > 1) return alert("La recompensa de prenda gratis solo se puede aplicar a una prenda por venta.");

    setIsSubmitting(true);
    try {
        const payload = {
            saleData: { 
                client_id: client.id, 
                type: isRewardSale ? 'REWARD' : 'NORMAL',
                loyalty_applied: isRewardSale 
            },
            itemsData: cart.map(item => {
                const parts = [];
                if (item.measurements.length) parts.push(`Largo: ${item.measurements.length}cm`);
                if (item.measurements.waist) parts.push(`Cintura: ${item.measurements.waist}cm`);
                if (item.measurements.sleeves) parts.push(`Manga: ${item.measurements.sleeves}cm`);
                if (item.notes) parts.push(`Notas: ${item.notes}`);
                
                return {
                    product_id: item.id,
                    quantity: item.qty,
                    unit_price: isRewardSale ? 0 : item.price,
                    custom_description: parts.length > 0 ? parts.join(" | ") : item.name
                };
            }),
            paymentData: { 
                method: isRewardSale ? 'GRATIS' : paymentMethod, 
                amount: total 
            }
        };

        await api.post("/sales", payload);
        alert(isRewardSale ? "¡Felicidades! Se ha procesado el regalo. Los puntos del cliente han sido reseteados." : "¡Venta completada exitosamente!");
        
        // Reset POS
        setCart([]);
        setClient(null);
        setTempProduct(null);
        setIsRewardSale(false);
    } catch (err) {
      console.error("Error creating sale:", err);
      alert("Error: " + (err.response?.data?.message || "No se pudo procesar la venta."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setTempProduct(product);
    setMeasurements({ length: '', waist: '', sleeves: '', notes: '' });
    setPricingBreakdown(null);
    setIsCalculating(true);

    try {
        const res = await api.post("/pricing/calculate", { product_id: product.id });
        if (res.data.success) {
            setPricingBreakdown(res.data.data);
        }
    } catch (err) {
        console.error("No se pudo calcular el precio dinamico:", err);
    } finally {
        setIsCalculating(false);
    }
  };

  const commitToCart = () => {
    if (!tempProduct || isCalculating) return;
    const finalPrice = pricingBreakdown?.suggested_price ? parseFloat(pricingBreakdown.suggested_price) : parseFloat(tempProduct.base_price || 0);
    
    setCart([...cart, {
        ...tempProduct,
        qty: 1,
        price: finalPrice,
        rawPricing: pricingBreakdown,
        measurements: { ...measurements },
        notes: measurements.notes
    }]);
    setTempProduct(null);
    setPricingBreakdown(null);
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const canApplyReward = client && (parseInt(client.loyalty_points) || 0) >= 9;

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* LEFT COLUMN: BUSCADOR Y FORMULARIOS */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* BUSCAR CLIENTE */}
        <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 relative z-[100]">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#C9A14A]/10 text-[#C9A14A] flex items-center justify-center text-xs">1</span> 
            Paso 1: Identificar Cliente
          </h2>
          <ClientSearch 
            selectedClient={client} 
            onSelect={setClient} 
            onClear={() => setClient(null)} 
          />
        </div>

        {/* BUSCAR PRODUCTO Y SASTRERÍA */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex-1 relative z-[50] flex flex-col">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#C9A14A]/10 text-[#C9A14A] flex items-center justify-center text-xs">2</span> 
            Paso 2: Selección de Prenda
          </h2>
          
          <div className="mb-6">
             <ProductSearch onSelect={handleSelectProduct} />
          </div>

          {tempProduct ? (
            <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 relative overflow-hidden group shadow-inner mb-4 flex-1">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#C9A14A]"></div>
                
                <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-6">
                    <div>
                        <h3 className="font-black text-2xl text-slate-900 leading-none">{tempProduct.name}</h3>
                        
                        {isCalculating ? (
                            <p className="text-sm font-bold text-slate-400 mt-2 animate-pulse">Consultando algoritmos de precio...</p>
                        ) : pricingBreakdown ? (
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio Calculado</span>
                                <span className="text-[#C9A14A] text-2xl font-black">${parseFloat(pricingBreakdown.suggested_price).toFixed(2)}</span>
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-slate-500 mt-2">Precio Base: <span className="text-slate-800">${parseFloat(tempProduct.base_price).toFixed(2)}</span></p>
                        )}
                    </div>
                    <button onClick={() => { setTempProduct(null); setPricingBreakdown(null); }} className="text-xs font-black text-slate-400 hover:text-rose-500 px-4 py-2 border-2 border-slate-200 rounded-xl bg-white transition-all uppercase tracking-widest">Cancelar</button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                    <Ruler size={18} className="text-[#C9A14A]" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Personalización de Medidas</span>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {['length', 'waist', 'sleeves'].map((field) => (
                        <div key={field}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">{field === 'length' ? 'Largo' : field === 'waist' ? 'Cintura' : 'Manga'}</label>
                            <div className="relative">
                                <input 
                                    value={measurements[field]} 
                                    onChange={e=>setMeasurements({...measurements, [field]: e.target.value})} 
                                    type="number" 
                                    placeholder="0.0" 
                                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-[1.2rem] focus:border-[#C9A14A] outline-none transition-all font-bold text-slate-700" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-black uppercase">cm</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mb-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Instrucciones Especiales</label>
                    <textarea value={measurements.notes} onChange={e=>setMeasurements({...measurements, notes: e.target.value})} placeholder="Ej: Ajuste entallado, puños dobles..." className="w-full p-5 bg-white border-2 border-slate-100 rounded-[1.2rem] text-sm font-bold focus:border-[#C9A14A] outline-none transition-all resize-none" rows="2"></textarea>
                </div>
                
                <button onClick={commitToCart} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                    Agregar al Ticket <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[2.5rem] bg-slate-50/30 p-12 text-center group transition-colors hover:border-slate-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={40} className="text-slate-200" />
                </div>
                <p className="font-black text-xl text-slate-400 uppercase tracking-widest">Esperando Prenda</p>
                <p className="text-sm font-bold text-slate-300 mt-2 max-w-xs">Busca un producto arriba para configurar las medidas de sastrería.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: TICKET DE COBRO */}
      <div className="w-full lg:w-[450px] flex flex-col gap-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden border border-slate-50">
          <div className="h-2 bg-gradient-to-r from-slate-900 via-[#C9A14A] to-slate-900"></div>
          
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Caja de Cobro</h2>
                <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-widest">
                    Ticket #{Math.floor(Math.random()*9000)+1000}
                </div>
            </div>

            {/* LOYALTY ALERT IN TICKET */}
            {canApplyReward && (
                <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isRewardSale ? 'bg-amber-500 border-amber-600 text-white shadow-lg' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <div className="flex items-center gap-3">
                        <Sparkles size={24} className={isRewardSale ? 'text-white' : 'text-amber-500'} />
                        <div>
                            <p className="font-black text-xs uppercase leading-none">¡Fidelidad Nexus!</p>
                            <p className="text-[10px] font-bold opacity-80 mt-0.5">El cliente tiene 10 prendas acumuladas.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsRewardSale(!isRewardSale)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isRewardSale ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}
                    >
                        {isRewardSale ? 'CANCELAR REGALO' : 'APLICAR REGALO'}
                    </button>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 space-y-4 pr-1">
               {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                       <ShoppingBag size={60} className="text-slate-400 mb-2" />
                       <p className="font-black text-sm uppercase tracking-[0.3em] text-slate-500">Ticket Vacío</p>
                   </div>
               ) : (
                   cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 rounded-2xl relative group border border-transparent hover:border-slate-200 transition-all">
                          <div className="pr-10">
                              <p className="font-black text-slate-900 leading-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.qty} un • ${item.price.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                              <p className={`font-black ${isRewardSale ? 'text-slate-300 line-through' : 'text-[#C9A14A]'}`}>${(item.qty * item.price).toFixed(2)}</p>
                              <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                      </div>
                   ))
               )}
            </div>

            <div className="bg-slate-50 -mx-8 -mb-8 p-8 border-t border-slate-100">
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-slate-400"><span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span><span className="font-bold">${rawTotal.toFixed(2)}</span></div>
                    {isRewardSale && (
                        <div className="flex justify-between text-emerald-500"><span className="text-[10px] font-black uppercase tracking-widest">Descuento Fidelidad</span><span className="font-bold">-${rawTotal.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between items-end pt-2">
                        <span className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Total Final</span>
                        <span className={`text-4xl font-black tracking-tighter ${isRewardSale ? 'text-emerald-500 animate-bounce' : 'text-slate-900'}`}>${total.toFixed(2)}</span>
                    </div>
                </div>

                {!isRewardSale && (
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].map((m) => (
                            <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 ${paymentMethod === m ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-[#C9A14A] hover:text-[#C9A14A]'}`}>{m.substring(0, 5)}</button>
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={() => { setCart([]); setClient(null); setIsRewardSale(false); }} className="px-6 py-4 rounded-2xl font-black text-xs bg-slate-200 text-slate-500 hover:bg-slate-300 transition-all uppercase tracking-widest">Anular</button>
                    <button 
                        disabled={isSubmitting || cart.length === 0 || !client} 
                        onClick={handleCobrar} 
                        className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-2xl ${isRewardSale ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-[#C9A14A] text-white shadow-[#C9A14A]/20 hover:bg-[#b58f3f]'}`}
                    >
                         {isSubmitting ? 'Procesando...' : <><CheckCircle size={22} /> {isRewardSale ? 'REGALAR PRENDA' : 'FINALIZAR COBRO'}</>}
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
