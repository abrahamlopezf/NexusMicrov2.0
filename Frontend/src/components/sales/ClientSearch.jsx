import { useState, useEffect, useRef } from "react";
import { Search, UserPlus } from "lucide-react";
import api from "../../api/axios";

export default function ClientSearch({ onSelect, selectedClient, onClear }) {
    const [clients, setClients] = useState([]);
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        api.get("/customers").then(res => {
            const payload = res.data?.data;
            setClients(Array.isArray(payload) ? payload : (payload?.rows || payload?.clients || []));
        }).catch(console.error);

        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const safeClients = Array.isArray(clients) ? clients : [];
    const filtered = safeClients.filter(c => c?.name?.toLowerCase()?.includes(query?.toLowerCase() || '') || (c?.phone && c.phone.includes(query)));

    if (selectedClient) {
        return (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center group">
              <div>
                <p className="font-bold text-emerald-900 text-lg">{selectedClient.name}</p>
                <p className="text-sm text-emerald-700">{selectedClient.phone || 'Sin teléfono'}</p>
              </div>
              <button onClick={onClear} className="text-sm font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors">
                Cambiar Cliente
              </button>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar por nombre o teléfono..." 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#C9A14A]/30 focus:border-[#C9A14A] outline-none transition-all shadow-inner font-medium text-gray-800" 
                />
              </div>
              <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold tracking-wide transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg">
                <UserPlus size={18} /> Nuevo Cliente
              </button>
            </div>

            {showDropdown && query && (
                <div className="absolute z-20 top-[60px] left-0 w-full sm:w-[calc(100%-180px)] bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto">
                    {filtered.length > 0 ? (
                        filtered.map(c => (
                            <div key={c.id} onClick={() => { onSelect(c); setQuery(''); setShowDropdown(false); }} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{c?.name || 'Cliente'}</p>
                                    <p className="text-sm text-gray-500">{c.phone || 'Sin teléfono'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 font-medium">No se encontraron clientes.</div>
                    )}
                </div>
            )}
        </div>
    );
}
