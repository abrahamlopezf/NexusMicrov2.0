import React from 'react';
import { POSTableRow } from './POSTableRow';
import { useAuthStore } from '../../store/authStore';
import { usePosStore } from '../../store/posStore';
import { Plus } from 'lucide-react';

export const POSTable = ({ sessionId }) => {
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const session = usePosStore(state => state.sessions[sessionId]);
  const addRow = usePosStore(state => state.addRow);

  if (!session) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">Descripción Custom / Producto</th>
              <th className="p-3 text-center">Cant.</th>
              <th className="p-3 text-center">Hrs. Cost.</th>
              <th className="p-3 text-center">Hrs. Patr.</th>
              <th className="p-3 text-center">Insumo Base</th>
              <th className="p-3 text-center">Extra Mats</th>
              {isAdminOrManager && <th className="p-3 text-right">Costo Interno</th>}
              <th className="p-3 text-right">Precio Unit.</th>
              <th className="p-3 text-right">Total Línea</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {session.items.map((row, idx) => (
              <POSTableRow key={row.id} row={row} sessionId={sessionId} index={idx} />
            ))}
            
            {session.items.length === 0 && (
              <tr>
                <td colSpan={isAdminOrManager ? 11 : 10} className="p-8 text-center text-gray-400">
                  La cuadrícula está vacía. Añade un producto o fila custom.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button 
          onClick={() => addRow(sessionId)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Fila Custom
        </button>
      </div>
    </div>
  );
};
