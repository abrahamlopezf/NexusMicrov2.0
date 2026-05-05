import { useState } from "react";
import { ShoppingBag, Ruler, CheckCircle, ArrowRight, Trash2 } from "lucide-react";
import ClientSearch from "../../components/sales/ClientSearch";
import ProductSearch from "../../components/sales/ProductSearch";
import api from "../../api/axios";

export default function NewSale() {
  const [cart, setCart] = useState([]);
  const [client, setClient] = useState(null);

  const [tempProduct, setTempProduct] = useState(null);
  const [measurements, setMeasurements] = useState({ length: '', waist: '', sleeves: '', notes: '' });
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce((acc, i) => acc + ((i?.price || 0) * (i?.qty || 1)), 0);

  const handleCobrar = async () => {
    if (!client) return alert("Por favor selecciona un cliente de la lista.");
    if (cart.length === 0) return alert("Tu ticket está vacío. Agrega al menos un producto.");

    setIsSubmitting(true);
    try {
        const payload = {
            saleData: { client_id: client.id, type: 'NORMAL' },
            itemsData: cart.map(item => {
                const parts = [];
                if (item?.measurements?.length) parts.push(`Largo: ${item.measurements.length}cm`);
                if (item?.measurements?.waist) parts.push(`Cintura: ${item.measurements.waist}cm`);
                if (item?.measurements?.sleeves) parts.push(`Manga: ${item.measurements.sleeves}cm`);
                if (item?.notes) parts.push(`Notas: ${item.notes}`);
                
                return {
                    product_id: item.id,
                    quantity: item.qty || 1,
                    unit_price: item.price || 0,
                    custom_description: parts.length > 0 ? parts.join(" | ") : (item.name || 'Producto')
                };
            }),
            paymentData: { method: paymentMethod, amount: total }
        };

        await api.post("/sales", payload);
        alert("¡Venta completada exitosamente! Se ha enviado la orden de trabajo a Producción.");
        
        // Reset POS
        setCart([]);
        setClient(null);
        setTempProduct(null);
    } catch (err) {
        console.error("Error creating sale:", err);
        alert("Hubo un error de conexión al procesar la venta.");
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
        if (res?.data?.success) {
            setPricingBreakdown(res.data.data);
        } else {
            // Fallback en caso de que la respuesta no sea exitosa pero no lance error
            setPricingBreakdown({ suggested_price: product.base_price });
        }
    } catch (err) {
        console.error("No se pudo calcular el precio dinamico:", err);
        // Fallback a precio base en caso de error 500
        setPricingBreakdown({ suggested_price: product.base_price });
    } finally {
        setIsCalculating(false);
    }
  };

  const commitToCart = () => {
    if (!tempProduct || isCalculating) return;
    
    // Si no se pudo obtener sugerido, fallback al viejo base_price
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* LEFT COLUMN: BUSCADOR Y FORMULARIOS */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* BUSCAR CLIENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative z-20">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A14A]/10 text-[#C9A14A] flex items-center justify-center text-sm">1</span> 
            Datos del Cliente
          </h2>
          <ClientSearch 
            selectedClient={client} 
            onSelect={setClient} 
            onClear={() => setClient(null)} 
          />
        </div>

        {/* BUSCAR PRODUCTO Y SASTRERÍA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 relative z-10 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A14A]/10 text-[#C9A14A] flex items-center justify-center text-sm">2</span> 
            Agregar Productos
          </h2>
          
          <div className="mb-6">
             <ProductSearch onSelect={handleSelectProduct} />
          </div>

          {tempProduct ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 relative overflow-hidden group shadow-inner mb-4 flex-1">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A14A]"></div>
                
                <div className="flex justify-between items-start mb-5 border-b border-gray-200 pb-4">
                    <div>
                        <h3 className="font-black text-xl text-gray-900">{tempProduct.name}</h3>
                        
                        {isCalculating ? (
                            <p className="text-sm font-medium text-gray-400 mt-1 animate-pulse">Calculando fórmula base...</p>
                        ) : pricingBreakdown ? (
                            <>
                                <p className="text-sm text-gray-800 font-bold mt-2 tracking-tight">Precio Calculado: <span className="text-[#C9A14A] text-xl">${parseFloat(pricingBreakdown?.suggested_price || 0).toFixed(2)}</span></p>
                                
                                {/* Modo Transparente (Manager / Admin) */}
                                {pricingBreakdown.breakdown && (
                                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg text-xs grid grid-cols-2 gap-2 shadow-sm">
                                        <div className="text-gray-500">Insumos Fijos:</div><div className="text-right font-medium">${pricingBreakdown.breakdown.supply_cost}</div>
                                        <div className="text-gray-500">Mano Obra Patronista ({pricingBreakdown.breakdown.hours_pattern}h):</div><div className="text-right font-medium">${pricingBreakdown.breakdown.labor_cost_pattern}</div>
                                        <div className="text-gray-500">Mano Obra Confección ({pricingBreakdown.breakdown.hours_sewing}h):</div><div className="text-right font-medium">${pricingBreakdown.breakdown.labor_cost_sewing}</div>
                                        <div className="text-gray-500 font-bold border-t pt-1 mt-1">Costo Bruto:</div><div className="text-right font-bold border-t pt-1 mt-1">${pricingBreakdown.gross_cost}</div>
                                        <div className="text-gray-500">Factor Operacional:</div><div className="text-right font-medium text-orange-500">+ ${pricingBreakdown.operational_cost}</div>
                                    </div>
                                )}
                                {pricingBreakdown.is_mixed_legacy && (
                                     <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 inline-block bg-gray-200 px-2 rounded-full">Precio Antiguo + Margen Operativo Aplicado</span>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-medium text-gray-500 mt-1">Precio Base DB: <span className="text-gray-600 font-bold">${parseFloat(tempProduct?.base_price || 0).toFixed(2)}</span></p>
                        )}
                    </div>
                    <button onClick={() => { setTempProduct(null); setPricingBreakdown(null); }} className="text-xs font-bold text-gray-400 hover:text-gray-600 p-2 border border-gray-200 rounded-lg bg-gray-50/50">Cancelar</button>
                </div>

                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                <Ruler size={18} className="text-[#C9A14A]" /> Medidas de Sastrería (Opcional)
                </h4>
                
                <div className="grid grid-cols-3 gap-6 mb-5">
                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Largo</label>
                    <div className="relative"><input value={measurements.length} onChange={e=>setMeasurements({...measurements, length: e.target.value})} type="number" placeholder="00.0" className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#C9A14A]/20 focus:border-[#C9A14A] outline-none" /><span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold select-none">cm</span></div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Cintura</label>
                    <div className="relative"><input value={measurements.waist} onChange={e=>setMeasurements({...measurements, waist: e.target.value})} type="number" placeholder="00.0" className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#C9A14A]/20 focus:border-[#C9A14A] outline-none" /><span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold select-none">cm</span></div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Manga</label>
                    <div className="relative"><input value={measurements.sleeves} onChange={e=>setMeasurements({...measurements, sleeves: e.target.value})} type="number" placeholder="00.0" className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#C9A14A]/20 focus:border-[#C9A14A] outline-none" /><span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold select-none">cm</span></div>
                </div>
                </div>
                <div>
                <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Instrucciones Especiales</label>
                <textarea value={measurements.notes} onChange={e=>setMeasurements({...measurements, notes: e.target.value})} placeholder="Ej: Entallar más en la espalda..." className="w-full p-3 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-[#C9A14A]/20 focus:border-[#C9A14A] outline-none" rows="2"></textarea>
                </div>
                
                <div className="flex justify-end mt-6">
                <button onClick={commitToCart} className="w-full sm:w-auto bg-[#C9A14A] hover:bg-[#b58f3f] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#C9A14A]/20 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                    Añadir al Ticket <ArrowRight size={18} />
                </button>
                </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-6">
                <ShoppingBag size={48} className="text-gray-300 mb-3" />
                <p className="font-medium text-lg text-gray-500">Busca y selecciona un producto</p>
                <p className="text-sm">para configurar sus medidas de sastrería.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: TICKET DE COBRO */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col h-full relative overflow-hidden border border-gray-100">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-900 to-[#C9A14A]"></div>
          
          <h2 className="text-xl font-black text-gray-900 mb-4 border-b pb-4 mt-2 tracking-tight">Ticket de Compra</h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pb-4">
             {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                     <p className="font-bold text-xl uppercase tracking-widest text-gray-300">Vacío</p>
                 </div>
             ) : (
                 cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-4 relative group">
                        <div className="pr-10">
                            <p className="font-bold text-sm text-gray-800 leading-tight">{item?.name}</p>
                            {/* Render Measurements Summary */}
                            {(item?.measurements?.length || item?.measurements?.waist || item?.measurements?.sleeves) && (
                                <p className="text-xs text-gray-400 mt-1 font-medium">L:{item.measurements.length||'-'} C:{item.measurements.waist||'-'} M:{item.measurements.sleeves||'-'}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 font-medium">{item?.qty || 1} un x ${(item?.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className="font-black text-[#C9A14A]">${((item?.qty || 1) * (item?.price || 0)).toFixed(2)}</p>
                            <button onClick={() => removeFromCart(idx)} className="text-rose-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={16} /></button>
                        </div>
                    </div>
                 ))
             )}
          </div>

          <div className="mt-auto bg-gray-50 -mx-6 -mb-6 p-6 border-t border-gray-100">
              <div className="flex justify-between text-gray-500 mb-2"><span className="text-sm font-bold uppercase tracking-wider">Subtotal</span><span className="font-bold text-gray-700">${total.toFixed(2)}</span></div>
              <div className="flex justify-between items-end mb-6">
                  <span className="font-black text-gray-900 uppercase">Total Final</span>
                  <span className="text-4xl font-black text-[#C9A14A] tracking-tighter">${total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                  <button onClick={() => setPaymentMethod('EFECTIVO')} className={`py-3 border-2 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'EFECTIVO' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#C9A14A]'}`}>Efectivo</button>
                  <button onClick={() => setPaymentMethod('TRANSFERENCIA')} className={`py-3 border-2 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'TRANSFERENCIA' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#C9A14A]'}`}>Transf</button>
                  <button onClick={() => setPaymentMethod('TARJETA')} className={`py-3 border-2 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'TARJETA' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-[#C9A14A]'}`}>Tarjeta</button>
              </div>

              <div className="flex gap-3">
                  <button onClick={() => { setCart([]); setTempProduct(null); setClient(null); }} className="px-5 py-4 rounded-xl font-bold bg-gray-200/60 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors">Cancelar</button>
                  <button disabled={isSubmitting || cart.length === 0} onClick={handleCobrar} className="flex-1 py-4 rounded-xl font-black text-lg bg-[#C9A14A] hover:bg-[#b58f3f] disabled:bg-gray-300 disabled:shadow-none text-white shadow-xl shadow-[#C9A14A]/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                       {isSubmitting ? 'Procesando...' : <><CheckCircle size={22} /> Cobrar</>}
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
