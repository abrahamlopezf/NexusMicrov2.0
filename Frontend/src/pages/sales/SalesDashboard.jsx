import { useAuthStore } from "../../store/authStore";
import { PlusCircle, FileText, Clock, Truck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const SalesDashboard = () => {
  const user = useAuthStore(state => state.user);
  const firstName = user?.name?.split(' ')[0] || 'Vendedor';

  return (
    <div className="space-y-8 pb-10 animate-fade-in max-w-5xl mx-auto mt-4 px-4 sm:px-0">
      {/* HEADER */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-4xl font-bold text-[#0A0A0A] tracking-tight">
          Hola, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-2 font-medium text-lg">
          Bienvenido a <span className="text-[#C9A14A] font-semibold">Hekka Sastrería</span>. ¿Qué haremos hoy?
        </p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link to="/sales/new" className="bg-[#C9A14A] hover:bg-[#b58f3f] text-white p-8 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-4 group">
          <PlusCircle size={36} className="text-white/80 group-hover:text-white transition-colors" />
          <span className="text-2xl font-bold tracking-wide">Nueva Venta</span>
        </Link>
        <Link to="/quotes/new" className="bg-slate-900 hover:bg-slate-800 text-white p-8 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-4 group">
          <FileText size={36} className="text-[#C9A14A] group-hover:text-[#E5C97B] transition-colors" />
          <span className="text-2xl font-bold tracking-wide">Cotización Rápida</span>
        </Link>
      </div>

      {/* OPERATION SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Widget 1 */}
        <Link to="/sales/pending" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:bg-gray-50 transition-colors group cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Pedidos</p>
            <h3 className="text-3xl font-bold text-gray-900 leading-none">5 <span className="text-lg font-medium text-gray-400">pendientes</span></h3>
          </div>
        </Link>

        {/* Widget 2 */}
        <Link to="/sales/deliveries" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:bg-gray-50 transition-colors group cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            <Truck size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Entregas</p>
            <h3 className="text-3xl font-bold text-gray-900 leading-none">2 <span className="text-lg font-medium text-gray-400">para hoy</span></h3>
          </div>
        </Link>

        {/* Widget 3 */}
        <div className="bg-[#0A0A0A] p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/10 text-[#C9A14A] flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={32} />
          </div>
          <div>
            <p className="text-gray-400 font-medium text-sm mb-1 uppercase tracking-wider">Tus Ventas</p>
            <h3 className="text-3xl font-bold text-white leading-none">3 <span className="text-lg font-medium text-gray-500">hoy</span></h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesDashboard;
