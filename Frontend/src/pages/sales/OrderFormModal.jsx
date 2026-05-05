import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ShoppingCart, FileText, User, Package, Save, AlertCircle } from 'lucide-react';
import clientService from '../../api/clientService';
import productService from '../../api/productService';
import quoteService from '../../api/quoteService';
import saleService from '../../api/saleService';

const OrderFormModal = ({ mode = 'QUOTE', onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, manual_price: 0 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchInitialData();
    return () => { isMounted.current = false; };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [clientRes, productRes] = await Promise.all([
        clientService.getClients(),
        productService.getProducts()
      ]);
      
      if (isMounted.current) {
        // Clientes vienen en data: [array]
        setClients(clientRes.data || []);
        
        // Productos vienen en data: { products: [array] }
        const productsArray = productRes.data?.products || (Array.isArray(productRes.data) ? productRes.data : []);
        setProducts(productsArray);
      }
    } catch (err) {
      console.error('Error loading initial modal data:', err);
      if (isMounted.current) {
        setClients([]);
        setProducts([]);
      }
    } finally {
      if (isMounted.current) setLoadingData(false);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, manual_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    
    // Convertir a número si es cantidad o precio, manteniendo el string si está vacío para permitir borrar
    if (field === 'quantity' || field === 'manual_price') {
      newItems[index][field] = value === '' ? '' : value;
    } else {
      newItems[index][field] = value;
    }

    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].manual_price = parseFloat(product.base_price || 0);
      }
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.manual_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const getItemSubtotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.manual_price) || 0;
    return qty * price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return setError('Selecciona un cliente');
    if (items.some(i => !i.productId)) return setError('Todos los renglones deben tener un producto');

    try {
      setLoading(true);
      setError(null);

      if (mode === 'QUOTE') {
        const payload = {
          client_id: parseInt(selectedClientId),
          items: items.map(i => ({
            productId: parseInt(i.productId),
            quantity: parseFloat(i.quantity),
            manual_price: parseFloat(i.manual_price)
          })),
          notes
        };
        await quoteService.createQuote(payload);
        alert('Cotización creada con éxito.');
      } else {
        const payload = {
          saleData: {
            client_id: parseInt(selectedClientId),
            notes: notes
          },
          itemsData: items.map(i => ({
            product_id: parseInt(i.productId),
            quantity: parseFloat(i.quantity),
            manual_price: parseFloat(i.manual_price)
          }))
        };
        await saleService.createSale(payload);
        alert('Venta registrada con éxito. Se ha enviado a producción.');
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la orden');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${mode === 'QUOTE' ? 'bg-amber-500' : 'bg-emerald-600'} text-white rounded-2xl shadow-lg`}>
              {mode === 'QUOTE' ? <FileText size={24} /> : <ShoppingCart size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {mode === 'QUOTE' ? 'Nueva Cotización' : 'Nueva Venta Directa'}
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {mode === 'QUOTE' ? 'Presupuesto para cliente' : 'Registro de orden confirmada'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-black uppercase">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <User size={12} /> Cliente
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
              >
                <option value="">Buscar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.last_name || ''}</option>)}
              </select>
              {loadingData && <p className="text-[10px] text-indigo-500 animate-pulse font-bold">Cargando directorio de clientes...</p>}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notas de la Orden</label>
              <input
                type="text"
                placeholder="Ej. Entrega urgente, empaque especial..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Productos y Cantidades</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Añadir Producto
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50/30 p-4 rounded-3xl border border-slate-100">
                  <div className="col-span-5 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1">Prenda / Modelo</label>
                    <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 text-xs"
                        >
                          <option value="">Selecciona un producto...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1 text-center">Cantidad</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1 text-center">Precio Unit.</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={item.manual_price}
                      onChange={(e) => updateItem(index, 'manual_price', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 text-center pb-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Subtotal</p>
                    <p className="font-black text-slate-900 text-sm">${getItemSubtotal(item).toLocaleString()}</p>
                  </div>
                  <div className="col-span-1 flex justify-end pb-2">
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="p-2.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Total de la Orden</p>
            <p className={`text-4xl font-black tracking-tighter ${mode === 'QUOTE' ? 'text-amber-600' : 'text-emerald-700'}`}>
                ${calculateTotal().toLocaleString()}
                <span className="text-lg ml-2 text-slate-300">MXN</span>
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none px-10 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 md:flex-none px-12 py-4 ${mode === 'QUOTE' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-emerald-600 shadow-emerald-600/20'} text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  {mode === 'QUOTE' ? 'Generar Cotización' : 'Confirmar Venta'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormModal;
