import React from 'react';
import { History } from 'lucide-react';

const InventoryMovements = () => {
  return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="p-6 bg-slate-50 rounded-full text-slate-300">
        <History size={60} />
      </div>
      <h2 className="text-2xl font-black text-slate-900">Historial de Movimientos</h2>
      <p className="text-slate-500 max-w-md mx-auto">
        Consulta cada entrada, salida y ajuste realizado en el sistema con total transparencia.
      </p>
    </div>
  );
};

export default InventoryMovements;
