import { useState, useEffect } from "react";
import { ShoppingCart, Search, Filter, Eye } from "lucide-react";
import api from "../../api/axios";

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await api.get('/sales');
                const payload = res.data?.data;
                // Defensive programming: safely extract array
                setSales(Array.isArray(payload) ? payload : (payload?.rows || payload?.sales || []));
            } catch (error) {
                console.error("Error fetching sales", error);
                setSales([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    const safeSales = Array.isArray(sales) ? sales : [];
    const filtered = safeSales.filter(s => 
        s?.id?.toString().includes(query) || 
        s?.client?.name?.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto pb-10 animate-fade-in mt-4 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ShoppingCart className="text-[#C9A14A]" size={32} /> Histórico de Ventas
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Consulta y administra todas las ventas registradas.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por folio o cliente..." 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C9A14A]/30 outline-none" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Folio</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-center pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">Cargando histórico...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No se encontraron ventas.</td>
                                </tr>
                            ) : (
                                filtered.map((sale) => (
                                    <tr key={sale?.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-slate-700">#{sale?.id}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-900">{sale?.client?.name || 'Cliente Genérico'}</p>
                                        </td>
                                        <td className="p-4 font-black text-[#C9A14A]">${parseFloat(sale?.total || 0).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                sale?.fulfillment_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                                                sale?.fulfillment_status === 'QUEUED' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {sale?.fulfillment_status || sale?.status || 'REGISTRADO'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">{new Date(sale?.created_at || new Date()).toLocaleDateString()}</td>
                                        <td className="p-4 text-center pr-6">
                                            <button className="text-gray-400 hover:text-[#C9A14A] p-2 bg-gray-50 rounded-lg hover:bg-[#C9A14A]/10 transition-colors inline-flex justify-center">
                                                <Eye size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
