import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { AlertTriangle, Package, CheckCircle, RefreshCcw, Bell } from "lucide-react";

let alertsCache = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async (force = false) => {
    const now = Date.now();
    if (!force && alertsCache && (now - lastFetch < CACHE_TTL)) {
      setAlerts(alertsCache);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/inventory/alerts");
      const data = res.data.data || [];
      alertsCache = data;
      lastFetch = Date.now();
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching inventory alerts", err);
      setError("No se pudo conectar con el servidor para obtener las alertas. Reintente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const criticalAlerts = alerts.filter(a => a.level === "CRITICAL");
  const lowAlerts = alerts.filter(a => a.level === "LOW");

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0A0A] tracking-tight">Panel de Inventario</h1>
          <p className="text-gray-500 mt-1 font-medium">Control total de stock y alertas del sistema</p>
        </div>
        <button 
          onClick={() => fetchAlerts(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
            <Bell size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Alertas</p>
            <h3 className="text-2xl font-bold text-gray-900">{alerts.length}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mr-4">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Críticas</p>
            <h3 className="text-2xl font-bold text-gray-900">{criticalAlerts.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mr-4">
            <Package size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
            <h3 className="text-2xl font-bold text-gray-900">{lowAlerts.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Alertas Activas</h2>
        </div>
        
        {error ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-red-800">Error de conexión</h3>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : loading && alerts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Cargando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckCircle size={48} className="text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Inventario Saludable</h3>
            <p className="text-gray-500">No hay alertas de stock bajo en este momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-semibold">Material</th>
                  <th className="p-4 font-semibold">Mensaje</th>
                  <th className="p-4 font-semibold">Nivel</th>
                  <th className="p-4 font-semibold text-center">Stock Actual</th>
                  <th className="p-4 font-semibold text-center">Mínimo</th>
                  <th className="p-4 font-semibold text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-gray-800">{alert.material?.name || `ID: ${alert.material_id}`}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{alert.message}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alert.level === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {alert.level}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-900">{alert.current_stock}</td>
                    <td className="p-4 text-center text-gray-500">{alert.min_stock}</td>
                    <td className="p-4 text-right text-sm text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;
