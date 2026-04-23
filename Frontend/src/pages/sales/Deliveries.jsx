import { Truck, CheckCircle, Search, MapPin } from "lucide-react";

export default function Deliveries() {
    const deliveries = [
        { id: 'V-10255', client: 'Juan Pérez Automático', item: 'Traje a la Medida (Bespoke)', phone: '555-123-4567', total: '$6,200', balance: '$0.00' },
        { id: 'V-10212', client: 'Sastrería Mayorista SA', item: 'Ajuste de Saco (Sastrería)', phone: '555-987-6543', total: '$450', balance: '$450.00' }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-10 animate-fade-in mt-4 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Truck className="text-emerald-500" size={36} /> Entregas Programadas
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Pedidos que ya están <span className="text-emerald-600 font-bold">LISTOS</span> para ser entregados al cliente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deliveries.map((d, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-100 transition-all flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[100%] flex items-start justify-end p-3 text-emerald-500">
                        <CheckCircle size={24} />
                    </div>
                    
                    <div className="mb-4">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-3 inline-block">Listo para entrega</span>
                        <h3 className="font-black text-2xl text-slate-900 leading-tight">{d.client}</h3>
                        <p className="text-slate-500 font-medium mt-1">{d.phone}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                        <p className="font-bold text-slate-800 mb-2">{d.item}</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total: <span className="font-bold text-slate-700">{d.total}</span></span>
                            <span className="text-slate-500">Saldo pendiente: <span className={`font-bold ${d.balance === '$0.00' ? 'text-emerald-600' : 'text-rose-500'}`}>{d.balance}</span></span>
                        </div>
                    </div>

                    <button className="mt-auto w-full bg-slate-900 text-white hover:bg-emerald-600 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
                        <CheckCircle size={20} /> Marcar como Entregado
                    </button>
                </div>
                ))}
            </div>
        </div>
    );
}
