import { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Award, CheckCircle } from "lucide-react";
import api from "../../api/axios";

export default function ClientSearch({ onSelect, selectedClient, onClear }) {
    const [clients, setClients] = useState([]);
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        api.get("/customers").then(res => setClients(res.data.data || [])).catch(console.error);

        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = clients.filter(c => 
        (c?.name || '').toLowerCase().includes(query.toLowerCase()) || 
        (c?.phone && c.phone.includes(query))
    );

    if (selectedClient) {
        const points = parseInt(selectedClient.loyalty_points) || 0;
        const progress = points % 10;
        const isReadyForReward = points >= 9;

        return (
            <div className={`p-5 rounded-2xl border-2 transition-all ${isReadyForReward ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'} flex flex-col sm:flex-row justify-between items-center gap-4`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isReadyForReward ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {isReadyForReward ? <Award size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                    <p className={`font-black text-xl leading-none ${isReadyForReward ? 'text-amber-900' : 'text-emerald-900'}`}>{selectedClient.name}</p>
                    <p className={`text-sm font-bold mt-1 ${isReadyForReward ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {selectedClient.phone || 'Sin teléfono'} • {progress}/10 puntos
                    </p>
                </div>
              </div>

              {isReadyForReward && (
                <div className="bg-amber-200 text-amber-900 px-4 py-2 rounded-xl font-black text-xs animate-pulse shadow-sm uppercase tracking-widest">
                    ¡10ª PRENDA GRATIS!
                </div>
              )}

              <button onClick={onClear} className={`text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-md ${isReadyForReward ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                CAMBIAR CLIENTE
              </button>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar cliente por nombre o teléfono..." 
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] focus:bg-white focus:border-[#C9A14A] outline-none transition-all shadow-inner font-bold text-slate-700 placeholder:text-slate-300" 
                />
              </div>
              <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[1.2rem] font-black tracking-wide transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xl shadow-slate-900/10 active:scale-95">
                <UserPlus size={20} className="text-[#C9A14A]" /> NUEVO
              </button>
            </div>

            {showDropdown && query && (
                <div className="absolute z-50 top-[70px] left-0 w-full bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 max-h-80 overflow-y-auto overflow-x-hidden p-2">
                    {filtered.length > 0 ? (
                        filtered.map(c => {
                            const p = (parseInt(c.loyalty_points) || 0) % 10;
                            const isVip = (parseInt(c.loyalty_points) || 0) >= 9;
                            return (
                                <div key={c.id} onClick={() => { onSelect(c); setQuery(''); setShowDropdown(false); }} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-all flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-all ${isVip ? 'bg-amber-500 scale-110 shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-[#C9A14A] group-hover:text-white'}`}>
                                            {isVip ? <Award size={18} /> : (c.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight">{c.name}</p>
                                            <p className="text-xs text-slate-400 font-bold">{c.phone || 'Sin teléfono'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[10px] font-black uppercase ${isVip ? 'text-amber-600' : 'text-slate-300'}`}>Puntos</p>
                                        <p className={`text-lg font-black ${isVip ? 'text-amber-500' : 'text-slate-700'}`}>{p}/10</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">Sin resultados</div>
                    )}
                </div>
            )}
        </div>
    );
}
