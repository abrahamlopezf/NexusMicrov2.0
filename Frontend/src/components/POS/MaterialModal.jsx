import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export const MaterialModal = ({ isOpen, onClose, onSave, initialMaterials }) => {
  const [materials, setMaterials] = useState(initialMaterials || []);

  if (!isOpen) return null;

  const addMaterial = () => {
    setMaterials([...materials, { name: '', quantity: 1, unit_price: 0 }]);
  };

  const updateMaterial = (index, field, value) => {
    const newMats = [...materials];
    newMats[index][field] = value;
    setMaterials(newMats);
  };

  const removeMaterial = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validMats = materials.filter(m => m.name.trim() !== '' && m.quantity > 0 && m.unit_price >= 0);
    onSave(validMats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-4">Materiales Extra</h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {materials.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay materiales extra. Agrega uno.</p>
          )}
          
          {materials.map((mat, index) => (
            <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Insumo</label>
                <input
                  type="text"
                  value={mat.name}
                  onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Encaje especial"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">Cant.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mat.quantity}
                  onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Costo Unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mat.unit_price}
                  onChange={(e) => updateMaterial(index, 'unit_price', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={() => removeMaterial(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center border-t pt-4">
          <button
            onClick={addMaterial}
            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Agregar Insumo
          </button>
          
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 rounded-lg shadow-md"
            >
              Guardar Materiales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
