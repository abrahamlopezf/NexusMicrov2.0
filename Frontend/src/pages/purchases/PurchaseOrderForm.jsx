import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ShoppingBag, AlertCircle, Save } from 'lucide-react';
import supplierService from '../../api/supplierService';
import inventoryService from '../../api/inventoryService';
import purchaseService from '../../api/purchaseService';

const SCOPE_OPTIONS = [
  { value: 'GENERAL', label: 'General', desc: 'Disponible para cualquier venta' },
  { value: 'SALE', label: 'Venta', desc: 'Reservado para una venta específica' },
  { value: 'SALE_ITEM', label: 'Prenda', desc: 'Ligado a una prenda específica' }
];

const PurchaseOrderForm = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [items, setItems] = useState([{ materialId: '', quantity: 1, unitCost: 0, scopeType: 'GENERAL', notes: '' }]);
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
        const allSuppliers = suppRes.data || [];
        setSuppliers(allSuppliers.filter(s =>
          s.supplier_type === 'MATERIAL_SUPPLIER' || s.supplier_type === 'MIXED'
        ));
        setMaterials(matRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isMounted.current) setLoadingData(false);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: 1, unitCost: 0, scopeType: 'GENERAL', notes: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'materialId') {
        const material = materials.find(m => m.id === parseInt(value));
        if (material) {
          updated.unitCost = parseFloat(material.cost) || 0;
        }
      }
      return updated;
    });
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
        supplier_id: parseInt(selectedSupplierId),
        reference: reference || null,
        notes: notes || null,
        items: items.map(i => ({
          material_id: parseInt(i.materialId),
          quantity: parseFloat(i.quantity),
          unit_cost: parseFloat(i.unitCost),
          scope_type: i.scopeType,
          notes: i.notes || null
        }))
      };

      await purchaseService.createPurchaseOrder(payload);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la compra');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Registrar Compra de Materiales</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Abastecimiento de Almacén</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-black uppercase tracking-tight">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedSupplierId && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Solo proveedores de tipo Material o Mixto pueden registrar compras.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia</label>
              <input
                type="text"
                placeholder="Ej. FACT-001, TICKET-002"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas</label>
              <input
                type="text"
                placeholder="Observaciones generales"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Materiales a Comprar</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Agregar Material
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Material</label>
                      <select
                        required
                        value={item.materialId}
                        onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 text-xs"
                      >
                        <option value="">Selecciona...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Cantidad</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500 text-xs text-center"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Costo unit.</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        placeholder="0.00"
                        onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                        className={`w-full p-3 bg-white border rounded-xl font-black text-xs text-center outline-none transition-all ${
                          item.materialId && !parseFloat(item.unitCost)
                            ? 'border-amber-300 text-amber-700 focus:border-amber-500'
                            : 'border-slate-200 text-slate-700 focus:border-indigo-500'
                        }`}
                      />
                      {item.materialId && !parseFloat(item.unitCost) && (
                        <p className="text-[8px] font-bold text-amber-500 uppercase tracking-wider">Sin precio - ingrésalo manualmente</p>
                      )}
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Alcance</label>
                      <select
                        value={item.scopeType}
                        onChange={(e) => updateItem(index, 'scopeType', e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 text-xs"
                      >
                        {SCOPE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 text-center pb-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Subtotal</p>
                      <p className={`font-black text-sm ${parseFloat(item.unitCost) ? 'text-slate-900' : 'text-slate-300'}`}>
                        {parseFloat(item.unitCost) ? `$${(item.quantity * item.unitCost).toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div className="col-span-1 flex justify-end pb-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Notas del item (opcional)"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
              <p className={`text-3xl font-black tracking-tighter ${
                calculateTotal() > 0 ? 'text-indigo-600' : 'text-slate-300'
              }`}>
                {calculateTotal() > 0 ? `$${calculateTotal().toLocaleString()}` : '-'}
              </p>
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
                  Registrar Compra
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
