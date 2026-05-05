import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ShoppingBag, AlertCircle, Save } from 'lucide-react';
import supplierService from '../../api/supplierService';
import inventoryService from '../../api/inventoryService';
import purchaseService from '../../api/purchaseService';

const PurchaseOrderForm = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState([{ materialId: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async () => {
    try {
      const [suppRes, matRes] = await Promise.all([
        supplierService.getSuppliers(),
        inventoryService.getMaterials()
      ]);
      if (isMounted.current) {
        setSuppliers(suppRes.data || []);
        setMaterials(matRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isMounted.current) setLoadingData(false);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 1, unitCost: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill cost if material is selected
    if (field === 'materialId') {
      const material = materials.find(m => m.id === parseInt(value));
      if (material) {
        newItems[index].unitCost = parseFloat(material.cost || 0);
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitCost || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) return setError('Selecciona un proveedor');
    if (items.some(i => !i.materialId)) return setError('Todos los items deben tener un material');

    try {
      setLoading(true);
      setError(null);
      const payload = {
        supplierId: parseInt(selectedSupplierId),
        items: items.map(i => ({
          materialId: parseInt(i.materialId),
          quantity: parseFloat(i.quantity),
          unitCost: parseFloat(i.unitCost)
        })),
        notes
      };

      await purchaseService.createPurchaseOrder(payload);
      alert('Orden de compra creada correctamente.');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la orden');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Nueva Orden de Compra</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Abastecimiento de Almacén</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-black uppercase tracking-tight">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Proveedor */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seleccionar Proveedor</label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
              >
                <option value="">Elegir proveedor...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Notas */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notas / Observaciones</label>
              <input
                type="text"
                placeholder="Instrucciones de entrega, etc."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Materiales a Comprar</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Agregar Material
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="col-span-5 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1">Insumo</label>
                    <select
                      required
                      value={item.materialId}
                      onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">Selecciona...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1">Cant.</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="block text-[9px] font-black text-slate-300 uppercase px-1">Costo U.</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2 text-center pb-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-tighter">Subtotal</p>
                    <p className="font-black text-slate-900 text-xs">${(item.quantity * item.unitCost).toLocaleString()}</p>
                  </div>
                  <div className="col-span-1 flex justify-end pb-3">
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimado</p>
              <p className="text-3xl font-black text-indigo-600 tracking-tighter">${calculateTotal().toLocaleString()}</p>
            </div>
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
              className="flex-1 md:flex-none px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
            >
              {loading ? "Guardando..." : (
                <>
                  <Save size={16} />
                  Generar Orden
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
