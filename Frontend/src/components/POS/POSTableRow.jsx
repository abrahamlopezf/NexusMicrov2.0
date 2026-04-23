import React, { useState, useEffect, useCallback, memo } from 'react';
import { usePricing } from '../../hooks/usePricing';
import { usePosStore } from '../../store/posStore';
import { MaterialModal } from './MaterialModal';
import { Settings, Trash2 } from 'lucide-react';

const POSTableRowComponent = ({ row, sessionId, index }) => {
  const { calculateRow, isAdminOrManager } = usePricing();
  const updateRow = usePosStore(state => state.updateRow);
  const removeRow = usePosStore(state => state.removeRow);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localRow, setLocalRow] = useState(row);

  // Snapshot fetching on product selection
  useEffect(() => {
    if (localRow.product_id && localRow.product_id !== row.product_id) {
        import('../../api/axios').then(api => {
            api.default.get(`/products/${localRow.product_id}/full`).then(res => {
                const { snapshot } = res.data.data;
                setLocalRow(prev => ({
                    ...prev,
                    hours_sewing: snapshot.hours.sewing,
                    hours_pattern: snapshot.hours.pattern,
                    supply_level: 'CUSTOM',
                    extra_materials: snapshot.materials.map(m => ({
                        material_id: m.material_id,
                        quantity: m.quantity,
                        unit_price: m.unit_price,
                        waste_percentage: m.waste_percentage
                    })),
                    snapshot_margins: snapshot.margins,
                    recalculating: true
                }));
            }).catch(console.error);
        });
    }
  }, [localRow.product_id, row.product_id]);

  // Debounce Recalculation
  useEffect(() => {
    const handler = setTimeout(() => {
      // Calculate real-time pricing
      const manualPrice = localRow.manual_price_override || null;
      const pricing = calculateRow(localRow, manualPrice);
      
      const isDirty = JSON.stringify(localRow) !== JSON.stringify(row);
      
      if (isDirty || row.total !== pricing.total) {
        updateRow(sessionId, row.id, {
          ...localRow,
          cost: pricing.cost,
          suggested_price: pricing.suggestedPrice,
          unit_price: pricing.finalUnitPrice,
          total: pricing.total,
          recalculating: false
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localRow, calculateRow, sessionId, row.id, updateRow, row.total]);

  const handleLocalChange = (field, value) => {
    setLocalRow(prev => ({ ...prev, [field]: value, recalculating: true }));
  };

  const handleMaterialsSave = (materials) => {
    setLocalRow(prev => ({ ...prev, extra_materials: materials, recalculating: true }));
  };

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 group">
        <td className="p-3 text-sm text-gray-500 font-mono">{index + 1}</td>
        
        {/* Custom Description */}
        <td className="p-3">
          <input 
            type="text" 
            value={localRow.custom_description}
            onChange={(e) => handleLocalChange('custom_description', e.target.value)}
            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white outline-none px-2 py-1 transition-all"
            placeholder="Descripción del trabajo..."
          />
        </td>

        {/* Quantity */}
        <td className="p-3 w-24">
          <input 
            type="number" min="1"
            value={localRow.quantity}
            onChange={(e) => handleLocalChange('quantity', Number(e.target.value))}
            className="w-full text-center bg-transparent border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none px-2 py-1"
          />
        </td>

        {/* Production Variables */}
        <td className="p-3 w-24">
          <input 
            type="number" step="0.5" min="0"
            value={localRow.hours_sewing}
            onChange={(e) => handleLocalChange('hours_sewing', e.target.value)}
            className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
            placeholder="Hrs"
            disabled={!isAdminOrManager}
          />
        </td>
        <td className="p-3 w-24">
          <input 
            type="number" step="0.5" min="0"
            value={localRow.hours_pattern}
            onChange={(e) => handleLocalChange('hours_pattern', e.target.value)}
            className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
            placeholder="Hrs"
            disabled={!isAdminOrManager}
          />
        </td>
        
        <td className="p-3 w-32">
          <select 
            value={localRow.supply_level}
            onChange={(e) => handleLocalChange('supply_level', e.target.value)}
            className="w-full bg-transparent border border-gray-200 rounded-md outline-none px-2 py-1"
            disabled={!isAdminOrManager}
          >
            <option value="SENCILLO">Sencillo</option>
            <option value="MEDIO">Medio</option>
            <option value="COMPLEJO">Complejo</option>
          </select>
        </td>

        {/* Extra Materials Modal Trigger */}
        <td className="p-3 text-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" /> 
            {localRow.extra_materials?.length || 0}
          </button>
        </td>

        {/* Role Enforcement: Cost View */}
        {isAdminOrManager && (
          <td className="p-3 text-right font-mono text-sm text-gray-500">
            ${row.cost}
          </td>
        )}

        {/* Unit Price (Editable only by Admin) */}
        <td className="p-3 w-32 relative">
          <input 
            type="number" step="0.01"
            value={localRow.manual_price_override !== undefined ? localRow.manual_price_override : row.unit_price}
            onChange={(e) => handleLocalChange('manual_price_override', e.target.value)}
            className={`w-full text-right bg-transparent outline-none px-2 py-1 font-medium ${isAdminOrManager ? 'border-b border-dashed border-gray-400 focus:border-blue-500' : 'cursor-not-allowed'}`}
            disabled={!isAdminOrManager}
          />
          {row.recalculating && <div className="absolute right-2 top-3 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
        </td>

        {/* Total */}
        <td className="p-3 text-right font-mono font-bold text-gray-800">
          ${row.total}
        </td>

        <td className="p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => removeRow(sessionId, row.id)} className="text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-5 h-5" />
          </button>
        </td>
      </tr>

      <MaterialModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleMaterialsSave}
        initialMaterials={localRow.extra_materials}
      />
    </>
  );
};

export const POSTableRow = memo(POSTableRowComponent, (prevProps, nextProps) => {
  return prevProps.row === nextProps.row && prevProps.sessionId === nextProps.sessionId;
});
