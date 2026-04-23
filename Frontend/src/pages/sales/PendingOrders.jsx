import { Clock, CheckCircle, ArrowRight, Search, Filter } from "lucide-react";
import { useState } from "react";

export default function PendingOrders() {
    // Dummy Data for visual display while Backend API is connected later.
    const [orders] = useState([
        { id: 'V-10291', client: 'María López', item: 'Traje a la Medida', status: 'EN_PRODUCCION', date: 'Hace 2 horas' },
        { id: 'V-10283', client: 'Carlos Slim', item: 'Ajuste de Saco', status: 'PENDIENTE', date: 'Ayer' },
        { id: 'V-10271', client: 'Sastrería Mayorista SA', item: 'Camisa Oxford Blanca (x5)', status: 'EN_PRODUCCION', date: 'Hace 3 días' }
    ]);

    return (
        <div className="max-w-6xl mx-auto pb-10 animate-fade-in mt-4 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Clock className="text-[#C9A14A]" size={32} /> Pedidos en Proceso
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Órdenes que aún no están listas para entrega.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar pedido..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C9A14A]/30 outline-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">ID Pedido</th>
                                <th className="p-4">Cliente / Fecha</th>
                                <th className="p-4">Producto(s)</th>
                                <th className="p-4">Estado Actual</th>
                                <th className="p-4 text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((o, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 pl-6 font-bold text-slate-700">{o.id}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-900">{o.client}</p>
                                    <p className="text-xs text-slate-500">{o.date}</p>
                                </td>
                                <td className="p-4 text-slate-600 font-medium">{o.item}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${o.status === 'EN_PRODUCCION' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {o.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button className="text-[#C9A14A] font-bold hover:text-[#b58f3f] flex items-center justify-end gap-1 w-full bg-[#C9A14A]/10 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ver Detalle <ArrowRight size={16}/>
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
