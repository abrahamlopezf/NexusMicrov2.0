import React, { useState } from 'react';
import { Wrench, ClipboardList, TrendingUp, History } from 'lucide-react';
import WorkOrdersPage from './WorkOrdersPage';

const ProductionLayout = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { id: 'orders', label: 'Órdenes Activas', icon: ClipboardList, description: 'Seguimiento de producción' },
    { id: 'stats', label: 'Rendimiento', icon: TrendingUp, description: 'Eficiencia y tiempos' },
    { id: 'history', label: 'Historial', icon: History, description: 'Órdenes finalizadas' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Wrench size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Producción</h1>
        </div>
        <p className="text-slate-500 font-medium">Control de manufactura, órdenes de trabajo y eficiencia operativa.</p>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-4 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] p-4 rounded-2xl border transition-all text-left group ${
                isActive
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                }`}>
                  <Icon size={20} />
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </div>
              <h3 className={`font-bold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                {tab.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[600px]">
        {activeTab === 'orders' && <WorkOrdersPage />}
        {activeTab === 'stats' && (
          <div className="p-20 text-center">
            <div className="p-6 bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-slate-300">
               <TrendingUp size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Módulo de Estadísticas</h2>
            <p className="text-slate-500">Próximamente: Análisis de productividad y tiempos por empleado.</p>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="p-20 text-center">
            <div className="p-6 bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-slate-300">
               <History size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Historial de Producción</h2>
            <p className="text-slate-500">Próximamente: Consulta de órdenes finalizadas y consumos reales.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionLayout;
