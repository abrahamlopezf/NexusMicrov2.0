import { Bell, Search, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const Header = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96 border border-transparent focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Buscar clientes, productos, u órdenes..."
          className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group">
          <Bell size={20} className="group-hover:text-indigo-600 transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-4 rounded-full border border-transparent hover:border-gray-200 transition-all">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-200 header-avatar">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-700 leading-tight">
              {user?.name || "Usuario"}
            </span>
            <span className="text-xs text-gray-500 font-medium capitalize">
              {user?.role || "Admin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
