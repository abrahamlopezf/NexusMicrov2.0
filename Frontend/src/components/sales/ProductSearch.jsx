import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";

export default function ProductSearch({ onSelect }) {
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        api.get("/products")
           .then(res => {
               const payload = res.data?.data;
               setProducts(Array.isArray(payload) ? payload : (payload?.products || []));
           })
           .catch(err => console.error("Error fetching products", err));
           
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const safeProducts = Array.isArray(products) ? products : [];
    const filtered = safeProducts.filter(p => p?.name?.toLowerCase()?.includes(query?.toLowerCase() || '') && p?.is_active);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A14A]" size={22} />
            <input 
                type="text" 
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Ej: Traje Slim Fit..." 
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C9A14A]/10 focus:border-[#C9A14A] outline-none transition-all text-lg font-medium shadow-sm hover:border-gray-300" 
            />
            
            {showDropdown && query && (
                <div className="absolute z-20 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-72 overflow-y-auto">
                    {filtered.length > 0 ? (
                        filtered.map(p => (
                            <div key={p.id} onClick={() => { onSelect(p); setQuery(''); setShowDropdown(false); }} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group">
                                <span className="font-bold text-gray-900 group-hover:text-[#C9A14A] transition-colors">{p?.name || 'Producto'}</span>
                                <span className="font-bold text-[#C9A14A] bg-[#C9A14A]/10 px-3 py-1 rounded-lg">${parseFloat(p?.base_price || 0).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 font-medium">No se encontraron productos.</div>
                    )}
                </div>
            )}
        </div>
    );
}
