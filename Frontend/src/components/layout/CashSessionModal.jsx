import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle, Ban, AlertTriangle, Layers } from 'lucide-react';
import cashService from '../../api/cashService';

const MOVEMENT_LABELS = {
  INCOME: { label: 'Ingreso', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  EXPENSE: { label: 'Gasto', icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
  WITHDRAWAL: { label: 'Retiro', icon: Ban, color: 'text-amber-600 bg-amber-50' },
  REFUND: { label: 'Reembolso', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
};

const CashSessionModal = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [openingAmount, setOpeningAmount] = useState('0');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cashService.getCurrentSession();
      const data = res.data?.data || res.data;
      setSessionData(data);
      if (data?.has_open_session) {
        setClosingAmount(data.expected_closing_amount?.toString() || '0');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener sesión de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await cashService.openSession({
        opening_amount: parseFloat(openingAmount) || 0,
      });
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir caja');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await cashService.closeSession({
        actual_closing_amount: parseFloat(closingAmount) || 0,
        closing_notes: closingNotes || undefined,
      });
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setActionLoading(false);
    }
  };

  const hasSession = sessionData?.has_open_session;
  const totals = sessionData?.totals || {};
  const movements = sessionData?.movements || { active: [], cancelled: [] };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${hasSession ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Wallet size={22} className={hasSession ? 'text-emerald-600' : 'text-slate-400'} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Sesión de Caja</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {loading ? 'Cargando...' : hasSession ? 'Sesión abierta' : 'Sin sesión activa'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : !hasSession ? (
            /* Open Session Form */
            <form onSubmit={handleOpen} className="space-y-6">
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <h3 className="font-black text-amber-800 mb-2 flex items-center gap-2">
                  <Clock size={18} />
                  Abrir Caja
                </h3>
                <p className="text-xs text-amber-600 font-medium mb-4">
                  Registra el monto inicial en caja para comenzar la sesión.
                </p>
                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                    Monto inicial ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-2xl pl-10 pr-4 py-3 font-black text-slate-900 outline-none focus:ring-4 ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full px-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Abrir Caja
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Session Active - Summary & Close */
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle size={16} className="text-emerald-600" />
                </div>
                <span className="font-bold text-emerald-700 text-sm">Caja abierta</span>
                {sessionData?.session?.opened_at && (
                  <span className="text-[10px] text-emerald-500 font-mono ml-auto">
                    {new Date(sessionData.session.opened_at).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apertura</p>
                  <p className="font-black text-2xl text-slate-900 mt-1">${parseFloat(totals.opening_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Esperado</p>
                  <p className="font-black text-2xl text-slate-900 mt-1">${parseFloat(totals.expected_closing_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ingresos</p>
                  <p className="font-black text-2xl text-emerald-700 mt-1">+${parseFloat(totals.income || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Egresos</p>
                  <p className="font-black text-2xl text-rose-700 mt-1">-${parseFloat(totals.expense || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Recent Movements */}
              {movements.active?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Movimientos recientes</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {movements.active.map((m, idx) => {
                      const cfg = MOVEMENT_LABELS[m.movement_type] || { label: m.movement_type, icon: Layers, color: 'text-slate-600 bg-slate-50' };
                      const Icon = cfg.icon;
                      return (
                        <div key={m.id || idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-700">{cfg.label}</p>
                              {m.description && <p className="text-[10px] text-slate-400">{m.description}</p>}
                            </div>
                          </div>
                          <span className={`font-black text-sm ${m.movement_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.movement_type === 'INCOME' ? '+' : '-'}${parseFloat(m.amount).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Close Session Form */}
              <form onSubmit={handleClose} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <h3 className="font-black text-slate-700 flex items-center gap-2">
                  <Ban size={18} />
                  Cerrar Caja
                </h3>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Monto final ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 font-black text-slate-900 outline-none focus:ring-4 ring-slate-500/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    rows={2}
                    placeholder="Notas al cierre..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm resize-none"
                  />
                </div>
                {closingAmount && parseFloat(closingAmount) !== parseFloat(totals.expected_closing_amount || 0) && (
                  <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2 text-xs text-amber-700 font-bold">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    El monto final difiere del monto esperado (${parseFloat(totals.expected_closing_amount || 0).toLocaleString()}). Se registrará una diferencia.
                  </div>
                )}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full px-6 py-3.5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Cerrar Caja'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashSessionModal;
