import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { AlertTriangle, Package } from "lucide-react";

const StockAlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/inventory/alerts");
        setAlerts(res.data.data || []);
        setError(false);
      } catch (err) {
        console.error("Widget error fetching alerts", err);
        setError(true);
      }
    };

    fetchAlerts();
    // Auto-refresh every 10 seconds for manager operative reaction
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col h-full items-center justify-center text-center text-red-600">
        <AlertTriangle size={32} className="mb-2 opacity-80" />
        <p className="font-medium text-sm">Error conectando con alertas de inventario</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      <h2 className="text-lg font-bold text-[#0A0A0A] mb-4 flex items-center">
        <AlertTriangle className="mr-2 text-orange-500" size={20} /> 
        Alertas de Inventario
      </h2>
      
      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-emerald-600 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="font-bold text-sm">Inventario Saludable ✓</p>
          <p className="text-xs opacity-80 mt-1">Niveles de stock óptimos.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-xl border flex items-center justify-between ${
              alert.level === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-orange-50 border-orange-100 text-orange-900'
            }`}
          >
            <div className="flex items-center min-w-0">
              <Package size={16} className={`mr-2 flex-shrink-0 ${alert.level === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} />
              <div className="truncate">
                <p className="font-bold text-sm truncate">{alert.material?.name || `Mat ID: ${alert.material_id}`}</p>
                <p className="text-xs opacity-80">Disp: {alert.current_stock} / Mín: {alert.min_stock}</p>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <span className={`w-3 h-3 rounded-full inline-block ${alert.level === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default StockAlertsWidget;
