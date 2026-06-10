import React, { useState, useEffect } from 'react';
import { X, Package, Layers, CheckSquare, AlertCircle, FileText } from 'lucide-react';
import inventoryService from '../../api/inventoryService';

const ROLE_LABELS = {
  MAIN_FABRIC: { label: 'Tela Principal', color: 'bg-indigo-50 text-indigo-600' },
  THREAD: { label: 'Hilo', color: 'bg-emerald-50 text-emerald-600' },
  SUPPLY: { label: 'Insumo', color: 'bg-amber-50 text-amber-600' }
};

const RecipeViewModal = ({ product, onClose }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product?.id) {
      inventoryService.getProductRecipe(product.id)
        .then(res => {
          if (res.success && res.data) {
            setRules(res.data.materials || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [product?.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <Package size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{product?.name}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receta de materiales</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">
              Cargando receta...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              Este producto no tiene reglas de materiales definidas.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, idx) => {
                const roleInfo = ROLE_LABELS[rule.material_role] || ROLE_LABELS.SUPPLY;
                return (
                  <div key={rule.id || idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">#{rule.id}</span>
                      </div>
                      <div className="flex gap-2">
                        {rule.is_selectable && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                            <CheckSquare size={12} /> Seleccionable
                          </span>
                        )}
                        {rule.auto_add && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                            <AlertCircle size={12} /> Auto
                          </span>
                        )}
                        {rule.is_required === false && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-wider">
                            Opcional
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold">Material:</span>
                        <p className="font-bold text-slate-700 mt-0.5">{rule.material?.name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Cantidad:</span>
                        <p className="font-bold text-slate-700 mt-0.5">{parseFloat(rule.quantity).toFixed(2)} {rule.material?.unit || ''}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">% Merma:</span>
                        <p className="font-bold text-slate-700 mt-0.5">{(parseFloat(rule.waste_percentage || 0) * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Categoría:</span>
                        <p className="font-bold text-slate-700 mt-0.5">{rule.requiredCategory?.name || rule.required_subcategory?.name || '—'}</p>
                      </div>
                    </div>

                    {rule.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-start gap-2 text-xs text-slate-500">
                        <FileText size={12} className="mt-0.5 shrink-0" />
                        <span className="italic">{rule.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeViewModal;
