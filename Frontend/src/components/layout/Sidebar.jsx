import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Users,
  Truck,
  ShoppingBag,
  PieChart,
  Settings,
  LogOut,
  FileText,
  UserCheck,
  Landmark
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "Ventas", path: "/sales" },
  { icon: FileText, label: "Cotizaciones", path: "/quotes" },
  { icon: UserCheck, label: "Clientes", path: "/clients" },
  { icon: Package, label: "Inventario", path: "/inventory" },
  { icon: Truck, label: "Proveedores", path: "/suppliers" },
  { icon: ShoppingBag, label: "Compras", path: "/purchases" },
  { icon: Wrench, label: "Producción", path: "/production" },
  { icon: Users, label: "Personal", path: "/payroll" },
  { icon: Landmark, label: "Finanzas / Caja", path: "/finance" },
  { icon: PieChart, label: "Reportes", path: "/reports" },
];

const managerItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "Ventas", path: "/sales" },
  { icon: FileText, label: "Cotizaciones", path: "/quotes" },
  { icon: UserCheck, label: "Clientes", path: "/clients" },
  { icon: Package, label: "Inventario", path: "/inventory" },
  { icon: Truck, label: "Proveedores", path: "/suppliers" },
  { icon: Wrench, label: "Producción", path: "/production" },
  { icon: Landmark, label: "Caja", path: "/finance" },
  { icon: PieChart, label: "Reportes", path: "/reports" },
];

const employeeItems = [
  { icon: LayoutDashboard, label: "Panel Principal", path: "/dashboard" },
  { icon: ShoppingCart, label: "Ventas", path: "/sales" },
  { icon: FileText, label: "Cotizaciones", path: "/quotes" },
  { icon: UserCheck, label: "Clientes", path: "/clients" },
  { icon: Truck, label: "Proveedores", path: "/suppliers" },
  { icon: ShoppingBag, label: "Compras", path: "/purchases" },
  { icon: Wrench, label: "Producción", path: "/production" },
  { icon: Package, label: "Inventario", path: "/inventory" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const role = user?.role?.toUpperCase();
  
  let activeNavItems = adminItems;
  if (role === 'MANAGER') activeNavItems = managerItems;
  if (role === 'EMPLOYEE') activeNavItems = employeeItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-xl transition-all">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-xl">H</span>
        </div>
        <h1 className="font-bold text-lg text-white tracking-wide">Hekka ERP</h1>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {activeNavItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all group ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 font-medium"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon
                size={20}
                className={`mr-3 transition-colors ${
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button className="flex items-center w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all group">
          <Settings size={20} className="mr-3 text-slate-500 group-hover:text-slate-300" />
          Configuración
        </button>
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all mt-1 group"
        >
          <LogOut size={20} className="mr-3 text-rose-500 group-hover:text-rose-400" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
