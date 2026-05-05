import { useEffect, useState } from "react";
import api from "../api/axios";
import KpiCard from "../components/KpiCard";
import { TrendingUp, PieChart, Info, AlertTriangle, Settings, ShoppingBag, Package, FileText, BarChart2, Briefcase, Scissors } from "lucide-react";
import { Link } from "react-router-dom";
import StockAlertsWidget from "../components/dashboard/StockAlertsWidget";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7days");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdvanced = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/dashboard/advanced?range=${range}`);
        setData(res.data.data);
      } catch (err) {
        console.error("Error cargando dashboard avanzado", err);
        setError("Error al cargar los datos del dashboard. Reinténtelo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvanced();
  }, [range]);

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#C9A14A]/30 border-t-[#C9A14A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Calculando inteligencia de negocio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center pt-20">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl font-medium border border-red-100 flex items-center">
          <AlertTriangle className="mr-3" /> {error}
        </div>
      </div>
    );
  }

  // Soft opacity during refresh
  const isRefreshing = loading && data;

  return (
    <div className={`space-y-8 pb-10 animate-fade-in ${isRefreshing ? 'opacity-60 transition-opacity' : 'opacity-100 transition-opacity'}`}>
      
      {/* QUICK ACCESS GRID (ADMIN / MANAGER) */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Módulos del Sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/sales/new" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><ShoppingBag size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Nueva Venta</span>
          </Link>
          <Link to="/sales/pending" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Pedidos</span>
          </Link>
          <Link to="/quotes/new" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Cotizaciones</span>
          </Link>
          <Link to="/inventory" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Package size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Inventario</span>
          </Link>
          <Link to="/reports" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><BarChart2 size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Reportes</span>
          </Link>
          <Link to="/admin/settings" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-[#C9A14A] hover:bg-orange-50/20 transition-all group flex flex-col items-center justify-center text-center ring-2 ring-transparent hover:ring-[#C9A14A] ring-offset-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Settings size={24} /></div>
            <span className="font-bold text-sm text-gray-800">Configuración</span>
          </Link>
        </div>
      </div>

      {/* HEADER DIVIDER & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0A0A] tracking-tight">
            Dashboard Estratégico
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Inteligencia de negocio para <span className="text-[#C9A14A] font-semibold">Hekka Sastrería</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Periodo:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border border-gray-200 text-gray-700 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/50 focus:border-[#C9A14A] shadow-sm font-medium cursor-pointer transition-all"
          >
            <option value="today">Día de Hoy</option>
            <option value="7days">Última Semana</option>
            <option value="month">Último Mes</option>
          </select>
        </div>
      </div>

      {/* FINANCIAL KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Ingresos"
          value={`$${Number(data.financials.revenue).toLocaleString()}`}
          subtitle="Total facturado"
        />

        <KpiCard
          title="Costos Directos"
          value={`$${Number(data.financials.costs).toLocaleString()}`}
          subtitle="Material estimado"
        />

        <KpiCard
          title="Utilidad Operativa"
          value={`$${Number(data.financials.profit).toLocaleString()}`}
          subtitle="Ganancia bruta"
        />

        <KpiCard
          title="Margen de Rentabilidad"
          value={`${Number(data.financials.margin).toFixed(1)}%`}
          subtitle="Sobre ingresos"
        />
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ALERTAS INTELIGENTES */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-xl font-semibold text-[#0A0A0A] mb-6 flex items-center">
            <AlertTriangle className="mr-2 text-[#C9A14A]" size={22} /> Alertas Inteligentes
          </h2>

          <div className="space-y-4">
            {Number(data.financials.margin) < 30 && Number(data.financials.revenue) > 0 ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-start group hover:bg-red-100 transition-colors">
                <span className="flex-shrink-0 mr-3 text-red-500 font-bold text-lg leading-none mt-0.5">⚠</span>
                <div>
                  <h4 className="font-bold text-red-800 mb-1">Margen Crítico ({Number(data.financials.margin).toFixed(1)}%)</h4>
                  <p className="text-sm">La rentabilidad del negocio está por debajo de la meta del 30%. Revisa los costos de producción y materiales para este periodo.</p>
                </div>
              </div>
            ) : Number(data.financials.revenue) > 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-start">
                <span className="flex-shrink-0 mr-3 text-emerald-500 font-bold text-lg leading-none mt-0.5">✓</span>
                <div>
                  <h4 className="font-bold text-emerald-800 mb-1">Margen Saludable</h4>
                  <p className="text-sm">La rentabilidad supera la meta base y se mantiene positiva.</p>
                </div>
              </div>
            ) : null}

            {data.topProducts.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 flex items-start">
                <Info className="flex-shrink-0 mr-3 text-blue-500 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-blue-800 mb-1">Sin información</h4>
                  <p className="text-sm">No hay ventas registradas en el periodo seleccionado.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TOP PRODUCTOS */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-xl font-semibold text-[#0A0A0A] mb-6 flex items-center">
            <PieChart className="mr-2 text-[#C9A14A]" size={22} /> Estrellas de Venta
          </h2>

          {data.topProducts.length > 0 ? (
            <div className="space-y-1">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0 group">
                  <div className="flex items-center flex-1 min-w-0 pr-4">
                    <span className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold mr-3 group-hover:bg-[#C9A14A] group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-[15px] font-medium text-gray-700 capitalize group-hover:text-gray-900 transition-colors truncate">{p.name || "Servicio Especial"}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[#C9A14A] font-bold text-lg bg-[#C9A14A]/10 px-3 py-1 rounded-lg">
                      {p.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Selecciona otro rango de fecha.</p>
          )}
        </div>

        {/* CLIENTES TOP */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-xl font-semibold text-[#0A0A0A] mb-6 flex items-center">
            <TrendingUp className="mr-2 text-[#C9A14A]" size={22} /> Clientes Destacados
          </h2>

          {data.topClients.length > 0 ? (
            <div className="space-y-1">
              {data.topClients.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-[15px] font-medium text-gray-800 capitalize flex-1 truncate pr-4">{c.customer_name}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                      {c.orders} <span className="text-xs font-normal text-gray-500 ml-1">pedidos</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Selecciona otro rango de fecha.</p>
          )}
        </div>

        {/* WIDGET DE INVENTARIO (MANAGER/ADMIN) */}
        <div className="lg:col-span-3">
           <StockAlertsWidget />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
