import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';

export const CostsTab = ({ saleId }) => {
  const [costSummary, setCostSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCostSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales/${saleId}/cost-summary`);
      setCostSummary(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostSummary();
  }, [saleId]);

  if (loading) return <div className="p-10 flex items-center gap-2 text-slate-500 font-bold"><RefreshCw className="animate-spin w-5 h-5"/> Cargando rentabilidad...</div>;
  if (!costSummary) return <div className="p-10 text-rose-500 font-bold">Error cargando resumen de costos</div>;

  const { totals, pricing_rules } = costSummary;
  const profit = totals?.committed_services_profitability?.profit || 0;
  const margin = totals?.committed_services_profitability?.margin_percentage || 0;
  const suggestedPrice = (totals?.real_cost_with_committed_services || 0) * (1 + (pricing_rules?.profit_margin || 0.2));
  const isLoss = profit < 0;

  return (
    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <PieChart size={24} className="text-teal-500" />
          Resumen de Costo Real
        </h2>
        <button onClick={fetchCostSummary} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ingresos</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600 font-bold">Precio Vendido</span>
            <span className="text-xl font-black text-slate-900">${parseFloat(totals.sold_total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Precio Sugerido (Ideal)</span>
            <span className="font-mono text-slate-500">${parseFloat(suggestedPrice).toLocaleString()}</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-sm border ${isLoss ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
            Rentabilidad Real
          </h3>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-bold ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>Utilidad Neta</span>
            <span className={`text-xl font-black flex items-center gap-1 ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isLoss ? <TrendingDown size={20}/> : <TrendingUp size={20}/>}
              ${parseFloat(profit).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className={isLoss ? 'text-rose-600/70' : 'text-emerald-600/70'}>Margen</span>
            <span className={`font-black ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
              {parseFloat(margin).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Desglose de Costos (Costo Real: ${parseFloat(totals.real_cost_with_received_services).toLocaleString()})</h3>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
          <span className="text-slate-600 font-bold text-sm">Materiales Reales</span>
          <span className="font-mono font-bold text-slate-800">${parseFloat(totals.material_real_cost).toLocaleString()}</span>
        </div>
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
          <span className="text-slate-600 font-bold text-sm">Mano de Obra (Operativa)</span>
          <span className="font-mono font-bold text-slate-800">${parseFloat(totals.labor_cost).toLocaleString()}</span>
        </div>
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
          <span className="text-slate-600 font-bold text-sm">Insumos Indirectos</span>
          <span className="font-mono font-bold text-slate-800">${parseFloat(totals.supply_cost).toLocaleString()}</span>
        </div>
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
          <span className="text-slate-600 font-bold text-sm">Costo Operativo Fijo</span>
          <span className="font-mono font-bold text-slate-800">${parseFloat(totals.operational_cost).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-slate-50 flex justify-between items-center">
          <span className="text-slate-700 font-black text-sm">Servicios Externos (Recibidos)</span>
          <span className="font-mono font-black text-indigo-600">${parseFloat(totals.external_service_received_cost).toLocaleString()}</span>
        </div>
      </div>

    </div>
  );
};
