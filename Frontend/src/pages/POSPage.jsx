import React, { useState, useEffect, useCallback } from 'react';
import { usePosStore } from '../../store/posStore';
import { POSTable } from '../../components/POS/POSTable';
import { POSSummary } from '../../components/POS/POSSummary';
import api from '../../api/axios';
import { Plus, X, Loader2, AlertCircle, Wifi, Activity } from 'lucide-react';

export const POSPage = () => {
  const { 
    sessions, 
    activeSessionId, 
    createSession, 
    switchSession, 
    closeSession,
    updateSessionState,
    connectionState,
    setConnectionState
  } = usePosStore();

  const [pollingJobs, setPollingJobs] = useState({}); // { [jobId]: { sessionId, retries } }

  // Extract active session
  const activeSession = sessions[activeSessionId];

  // 1. Polling Logic for Async Jobs
  const pollJobStatus = useCallback(async (jobId, sessionId, currentRetries = 0) => {
    if (currentRetries > 15) {
      updateSessionState(sessionId, { status: 'timeout' });
      setConnectionState({ queue: 'delayed' });
      return;
    }

    try {
      const response = await api.get(`/sales/job/${jobId}`);
      const { status, sale_id, error } = response.data;

      if (status === 'completed') {
        updateSessionState(sessionId, { status: 'valid', jobId: null, isDirty: false });
        setConnectionState({ queue: 'ok' });
        // Optional: show toast notification
      } else if (status === 'failed') {
        updateSessionState(sessionId, { status: 'error', error });
      } else {
        // 'processing'
        setTimeout(() => pollJobStatus(jobId, sessionId, currentRetries + 1), 2000);
      }
    } catch (error) {
      console.error("Polling error:", error);
      setTimeout(() => pollJobStatus(jobId, sessionId, currentRetries + 1), 2000);
    }
  }, [updateSessionState, setConnectionState]);

  // Handle Confirm
  const handleConfirmSession = async (sessionId) => {
    const session = sessions[sessionId];
    if (session.items.length === 0) return alert('La sesión está vacía');

    try {
      updateSessionState(sessionId, { status: 'processing' });

      // Build payload
      const payload = {
        client_id: session.client || 1, // Fallback dummy
        items: session.items,
        payment: { amount: session.totals.advance, type: 'ANTICIPO' }
      };

      const res = await api.post('/sales', payload);
      
      const { processing } = res.data;
      if (processing?.mode === 'async' && processing.jobId) {
        updateSessionState(sessionId, { jobId: processing.jobId });
        
        // Optimistic UI: Create new session and switch to it immediately so user can keep working
        const newSessionId = createSession();
        switchSession(newSessionId);

        // Start polling in background
        pollJobStatus(processing.jobId, sessionId, 0);
      } else {
        updateSessionState(sessionId, { status: 'valid', isDirty: false });
      }

    } catch (err) {
      updateSessionState(sessionId, { status: 'error', error: err.response?.data?.message || 'Error confirmando venta' });
      setConnectionState({ api: 'offline' });
    }
  };

  if (!activeSession) return <div>Cargando Terminal...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50/50">
      
      {/* GLOBAL CONNECTION INDICATORS */}
      <div className="flex justify-end px-4 py-2 gap-4 text-xs font-medium">
        <div className={`flex items-center gap-1 ${connectionState.api === 'online' ? 'text-green-600' : 'text-red-500'}`}>
          <Wifi className="w-3 h-3" /> API: {connectionState.api}
        </div>
        <div className={`flex items-center gap-1 ${connectionState.queue === 'ok' ? 'text-blue-600' : 'text-yellow-600'}`}>
          <Activity className="w-3 h-3" /> Cola: {connectionState.queue}
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-end px-4 gap-1 border-b border-gray-200 overflow-x-auto pt-2">
        {Object.values(sessions).map(sess => (
          <div 
            key={sess.id}
            onClick={() => switchSession(sess.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-t border-x cursor-pointer transition-colors ${
              activeSessionId === sess.id 
                ? 'bg-white border-gray-200 shadow-[0_4px_0_0_white] relative z-10' 
                : 'bg-gray-100 border-transparent hover:bg-gray-200 text-gray-500'
            }`}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {sess.name} {sess.isDirty && '*'}
            </span>
            
            {sess.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            {sess.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
            
            <button 
              onClick={(e) => { e.stopPropagation(); closeSession(sess.id); }}
              className={`p-0.5 rounded-full hover:bg-gray-300 ${activeSessionId === sess.id ? 'text-gray-500' : 'text-gray-400'}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button 
          onClick={() => createSession()}
          className="px-3 py-2 text-gray-500 hover:text-gray-800 transition-colors ml-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 overflow-auto p-4 flex gap-6">
        
        {/* Left: Table */}
        <div className="flex-1 min-w-[800px] flex flex-col gap-4">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                placeholder="Nombre del Cliente..."
                value={activeSession.client}
                onChange={(e) => updateSessionState(activeSession.id, { client: e.target.value, name: `${e.target.value || 'Nueva Venta'} - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` })}
                className="px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none w-64"
                disabled={activeSession.status === 'processing'}
              />
            </div>
            
            <div className="flex items-center gap-3">
              {activeSession.status === 'processing' && (
                <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando en Cola...
                </span>
              )}
              {activeSession.status === 'timeout' && (
                <span className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-md text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> Cola Demorada (Reintentar)
                </span>
              )}
              <button 
                onClick={() => handleConfirmSession(activeSession.id)}
                disabled={activeSession.status === 'processing' || activeSession.items.length === 0}
                className="px-6 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 rounded-lg shadow-md transition-all"
              >
                Confirmar Venta
              </button>
            </div>
          </div>

          <POSTable sessionId={activeSession.id} />
        </div>

        {/* Right: Summary Panel */}
        <div className="w-[320px] flex-shrink-0">
          <POSSummary sessionId={activeSession.id} />
        </div>

      </div>
    </div>
  );
};
