import { useState } from "react";
import { FileText, Plus, Printer, Trash2, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function QuickQuote() {
    const user = useAuthStore(state => state.user);
    const isEmployee = user?.role === 'EMPLOYEE';
    const [items, setItems] = useState([{ desc: "", qty: 1, price: "" }]);
    
    // Calculates total automatically
    const total = items.reduce((acc, curr) => acc + (curr.qty * (parseFloat(curr.price) || 0)), 0);

    const addItem = () => setItems([...items, { desc: "", qty: 1, price: "" }]);
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-in mt-4 px-4 sm:px-0">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#C9A14A]/10 text-[#C9A14A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cotización Rápida</h1>
                <p className="text-slate-500 font-medium mt-2">Calculadora ultra-rápida. No se guarda en base de datos.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="p-8">
                    <div className="grid grid-cols-12 gap-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                        <div className="col-span-6">Descripción del Servicio / Producto</div>
                        <div className="col-span-2 text-center">Cant.</div>
                        <div className="col-span-3 text-right">Precio Unit.</div>
                        <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {items.map((it, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 transition-all hover:border-[#C9A14A]/50 hover:bg-white shadow-sm hover:shadow-md">
                                <div className="col-span-6">
                                    <input type="text" value={it.desc} onChange={(e) => updateItem(i, 'desc', e.target.value)} placeholder="Ej. Ajuste de mangas saco caballero..." className="w-full bg-transparent border-none focus:outline-none font-medium text-slate-700 px-2 placeholder:text-slate-300" />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} min="1" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center font-bold text-slate-700 focus:outline-none focus:border-[#C9A14A]" />
                                </div>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={it.price} 
                                        readOnly={isEmployee}
                                        onChange={(e) => updateItem(i, 'price', e.target.value)} 
                                        placeholder="0.00" 
                                        className={`w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-right font-bold text-slate-700 focus:outline-none focus:border-[#C9A14A] ${isEmployee ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white'}`} 
                                    />
                                    {isEmployee && <Lock size={12} className="absolute right-3 top-3 text-gray-400" />}
                                </div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => removeItem(i)} className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addItem} className="flex items-center gap-2 text-[#C9A14A] font-bold hover:text-[#b58f3f] bg-[#C9A14A]/10 px-4 py-2 rounded-xl transition-colors">
                        <Plus size={18} /> Añadir otra línea
                    </button>
                    
                </div>
                
                <div className="bg-slate-900 p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-white">
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-sm mb-1">Total Estimado</p>
                        <h2 className="text-5xl font-black text-[#C9A14A] tracking-tighter">${total.toFixed(2)}</h2>
                    </div>
                    <button className="w-full sm:w-auto bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-black text-lg shadow-xl shadow-white/10 transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3">
                        <Printer size={22} className="text-[#C9A14A]" /> Generar PDF Listo
                    </button>
                </div>
            </div>
        </div>
    );
}
