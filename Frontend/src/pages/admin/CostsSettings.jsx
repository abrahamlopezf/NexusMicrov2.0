import { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../api/axios";

export default function CostsSettings() {
    const [settings, setSettings] = useState({
        operational_factor: 0.14,
        profit_margin: 0.20,
        labor_rate_pattern: 50.50,
        labor_rate_sewing: 44.38,
        fixed_supplies_costs: {
            SENCILLO: 30,
            REGULAR: 40,
            ESPECIAL: 50,
            SASTRERIA: 60
        }
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/pricing/settings");
            if (res.data.data) {
                setSettings(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await api.put("/pricing/settings", settings);
            setMessage({ type: "success", text: "Configuración guardada exitosamente." });
        } catch (err) {
            setMessage({ type: "error", text: "Error al guardar la configuración." });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleSupplyChange = (tier, value) => {
        setSettings(prev => ({
            ...prev,
            fixed_supplies_costs: {
                ...prev.fixed_supplies_costs,
                [tier]: parseFloat(value) || 0
            }
        }));
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500 font-medium">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Configurador de Costos</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Estas variables afectan instantáneamente los precios sugeridos en todo el sistema.
                    </p>
                </div>
                <button 
                    disabled={isSaving} 
                    onClick={handleSave} 
                    className="bg-[#C9A14A] hover:bg-[#b58f3f] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[#C9A14A]/20 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
                >
                    <Save size={18} /> {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle /> : <AlertCircle />} {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GLOBAL MARGINS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 border-b pb-3">1. Factores Globales</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Margen de Ganancia (%)</label>
                            <div className="relative">
                                <input 
                                    type="number" step="0.01" 
                                    value={settings.profit_margin * 100} 
                                    onChange={(e) => handleChange('profit_margin', e.target.value / 100)}
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C9A14A] outline-none font-bold" 
                                />
                                <span className="absolute right-4 top-3.5 text-gray-400 font-black">%</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Refleja la utilidad deseada tras cubrir la prenda y la operación. (Ej. 20%)</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Costo Operativo Fijo (%)</label>
                            <div className="relative">
                                <input 
                                    type="number" step="0.01" 
                                    value={settings.operational_factor * 100} 
                                    onChange={(e) => handleChange('operational_factor', e.target.value / 100)}
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C9A14A] outline-none font-bold" 
                                />
                                <span className="absolute right-4 top-3.5 text-gray-400 font-black">%</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Porcentaje del costo bruto que se aparta para Renta, Luz, Sueldos Admin, etc. (Ej. 14%)</p>
                        </div>
                    </div>
                </div>

                {/* LABOR METRICS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 border-b pb-3">2. Mano de Obra (Hora)</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Tarifa Patronista ($/hr)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-black">$</span>
                                <input 
                                    type="number" step="0.5" 
                                    value={settings.labor_rate_pattern} 
                                    onChange={(e) => handleChange('labor_rate_pattern', e.target.value)}
                                    className="w-full p-3 pl-8 text-right border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C9A14A] outline-none font-bold text-[#C9A14A]" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">Tarifa Confección ($/hr)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-black">$</span>
                                <input 
                                    type="number" step="0.5" 
                                    value={settings.labor_rate_sewing} 
                                    onChange={(e) => handleChange('labor_rate_sewing', e.target.value)}
                                    className="w-full p-3 pl-8 text-right border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C9A14A] outline-none font-bold text-[#C9A14A]" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FIXED SUPPLIES */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 border-b pb-3">3. Insumos Fijos según Dificultad (Tiers)</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(settings.fixed_supplies_costs).map(([tier, cost]) => (
                            <div key={tier}>
                                <label className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider block">{tier}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400 font-black">$</span>
                                    <input 
                                        type="number" 
                                        value={cost} 
                                        onChange={(e) => handleSupplyChange(tier, e.target.value)}
                                        className="w-full p-2.5 pl-7 text-right border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#C9A14A] outline-none font-bold text-gray-700" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                        <button className="text-sm font-bold text-[#C9A14A] hover:underline">+ Agregar Nivel de Dificultad</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
