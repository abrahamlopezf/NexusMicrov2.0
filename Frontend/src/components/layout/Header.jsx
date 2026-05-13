import { useState, useEffect } from "react";
import { Bell, Search, User, AlertTriangle, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useInventoryStore } from "../../store/inventoryStore";

const Header = () => {
  const user = useAuthStore((state) => state.user);
  const { alerts, fetchAlerts, resolveAlert } = useInventoryStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Poll for alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30 sticky top-0">
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96 border border-transparent focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Buscar clientes, productos, u órdenes..."
          className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors group ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell size={20} className="group-hover:text-indigo-600 transition-colors" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-800">Notificaciones</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  {alerts.length} nuevas
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Check className="mx-auto mb-2 opacity-20" size={32} />
                    <p className="text-sm">No tienes alertas pendientes</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group relative">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg ${alert.level === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                          <AlertTriangle size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">Stock Bajo: {alert.material?.name || 'Material'}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                          <p className="text-[10px] text-indigo-400 mt-2 font-medium">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded border border-gray-200 text-gray-400 hover:text-green-600 transition-all shadow-sm self-start"
                          title="Marcar como resuelto"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {alerts.length > 0 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Ver todas las alertas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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

      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
