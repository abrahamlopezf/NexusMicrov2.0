import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

export const ProductForm = ({ productId, onBack }) => {
    const [formData, setFormData] = useState({
        name: '', category: '', description: '', is_custom: false
    });
    
    const [costConfig, setCostConfig] = useState({
        sewing_hours: 0, pattern_hours: 0, fixed_supply_cost: 0,
        operation_margin: '', profit_margin: '', allow_manual_price: false
    });

    const [materials, setMaterials] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    
    const [livePrice, setLivePrice] = useState({ base_cost: 0, operational_cost: 0, final_price: 0 });

    useEffect(() => {
        api.get('/inventory').then(res => setInventoryItems(res.data.data.inventory || []));
        
        if (productId) {
            api.get(`/products/${productId}/full`).then(res => {
                const { snapshot } = res.data.data;
                const prod = res.data.data;
                // Basic binding logic goes here...
            });
        }
    }, [productId]);

    // Live Calculation Simulation
    useEffect(() => {
        const matCost = materials.reduce((acc, m) => {
            const inv = inventoryItems.find(i => i.id == m.material_id);
            if (!inv) return acc;
            const cost = Number(inv.cost || 0);
            const effQty = Number(m.quantity) * (1 + (Number(m.waste_percentage)/100 || 0));
            return acc + (effQty * cost);
        }, 0);

        const labor = (Number(costConfig.sewing_hours) * 44.38) + (Number(costConfig.pattern_hours) * 50.50);
        const base = matCost + labor + Number(costConfig.fixed_supply_cost);
        const opCost = base * (Number(costConfig.operation_margin) || 0.14);
        const finalP = (base + opCost) * (1 + (Number(costConfig.profit_margin) || 0.20));

        setLivePrice({ base_cost: base, operational_cost: opCost, final_price: finalP });
    }, [materials, costConfig, inventoryItems]);

    const handleSave = async () => {
        const payload = { data: formData, materials, costConfig };
        try {
            if (productId) await api.put(`/products/${productId}`, payload);
            else await api.post('/products', payload);
            alert('Configuración guardada exitosamente');
            onBack();
        } catch (e) {
            alert('Error guardando producto');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto flex gap-6">
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"><ArrowLeft className="w-5 h-5"/></button>
                    <h1 className="text-2xl font-bold">{productId ? 'Editar Producto' : 'Nuevo Producto'}</h1>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-gray-800 border-b pb-2">Datos Base</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="border p-2 rounded" placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input className="border p-2 rounded" placeholder="Categoría" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-gray-800 border-b pb-2">Lista de Materiales (BOM)</h2>
                    {materials.map((m, idx) => (
                        <div key={idx} className="flex gap-2">
                            <select className="border p-2 rounded flex-1" value={m.material_id} onChange={e => { const nm = [...materials]; nm[idx].material_id = e.target.value; setMaterials(nm); }}>
                                <option value="">Seleccione Insumo</option>
                                {inventoryItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (${inv.cost})</option>)}
                            </select>
                            <input type="number" placeholder="Cant." className="border p-2 rounded w-24" value={m.quantity} onChange={e => { const nm = [...materials]; nm[idx].quantity = e.target.value; setMaterials(nm); }} />
                            <input type="number" placeholder="% Merma" className="border p-2 rounded w-24" value={m.waste_percentage} onChange={e => { const nm = [...materials]; nm[idx].waste_percentage = e.target.value; setMaterials(nm); }} />
                            <button onClick={() => setMaterials(materials.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 className="w-5 h-5"/></button>
                        </div>
                    ))}
                    <button onClick={() => setMaterials([...materials, { material_id: '', quantity: 1, waste_percentage: 0 }])} className="text-blue-600 text-sm font-bold flex gap-1"><Plus className="w-4 h-4"/> Agregar Insumo</button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-gray-800 border-b pb-2">Costos Fijos y Horas</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" placeholder="Horas Costura" className="border p-2 rounded" value={costConfig.sewing_hours} onChange={e => setCostConfig({...costConfig, sewing_hours: e.target.value})} />
                        <input type="number" placeholder="Horas Patronaje" className="border p-2 rounded" value={costConfig.pattern_hours} onChange={e => setCostConfig({...costConfig, pattern_hours: e.target.value})} />
                        <input type="number" placeholder="Insumos Fijos ($)" className="border p-2 rounded" value={costConfig.fixed_supply_cost} onChange={e => setCostConfig({...costConfig, fixed_supply_cost: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="w-[300px] flex flex-col gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-6">
                    <h2 className="font-bold text-gray-800 border-b pb-2 mb-4">Cálculo en Vivo</h2>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Costo Base</span><span>${livePrice.base_cost.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Costo Operativo</span><span>${livePrice.operational_cost.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="text-blue-600">Precio Final</span><span className="text-blue-600">${livePrice.final_price.toFixed(2)}</span></div>
                    
                    <button onClick={handleSave} className="w-full mt-6 bg-gray-900 text-white py-2 rounded-lg font-bold flex justify-center gap-2 hover:bg-gray-800"><Save className="w-5 h-5"/> Guardar Configuración</button>
                </div>
            </div>
        </div>
    );
};
