import { create } from 'zustand';

function createEmptySession(clientName = '') {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const name = clientName ? `${clientName} - ${time}` : `Nueva Venta - ${time}`;
  
  return {
    id: Date.now().toString(),
    name,
    status: 'draft', // 'draft' | 'processing' | 'timeout'
    jobId: null,
    items: [],
    client: clientName,
    isDirty: false,
    totals: { subtotal: 0, discount: 0, total: 0, advance: 0, balance: 0 }
  };
}

export const usePosStore = create((set, get) => ({
  sessions: {},
  activeSessionId: null,
  connectionState: { api: 'online', queue: 'ok' }, // api: online/slow/offline, queue: ok/delayed/down

  setConnectionState: (newState) => set(state => ({
    connectionState: { ...state.connectionState, ...newState }
  })),

  createSession: (clientName = '') => {
    const newSession = createEmptySession(clientName);
    set((state) => ({
      sessions: { ...state.sessions, [newSession.id]: newSession },
      activeSessionId: newSession.id
    }));
    return newSession.id;
  },

  switchSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  closeSession: (sessionId) => {
    set((state) => {
      const session = state.sessions[sessionId];
      if (session && session.isDirty) {
        if (!window.confirm(`La sesión "${session.name}" tiene cambios sin guardar. ¿Deseas cerrarla de todos modos?`)) {
          return state;
        }
      }

      const newSessions = { ...state.sessions };
      delete newSessions[sessionId];
      
      const remainingIds = Object.keys(newSessions);
      let newActiveId = state.activeSessionId;
      if (newActiveId === sessionId) {
        newActiveId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
      }
      
      if (!newActiveId) {
        // If no tabs left, create one
        const empty = createEmptySession();
        newSessions[empty.id] = empty;
        newActiveId = empty.id;
      }

      return { sessions: newSessions, activeSessionId: newActiveId };
    });
  },

  updateSessionTotals: (sessionId, totalsObj) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...state.sessions[sessionId], totals: totalsObj }
      }
    }));
  },

  updateSessionState: (sessionId, updates) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...state.sessions[sessionId], ...updates }
      }
    }));
  },

  addRow: (sessionId) => {
    set((state) => {
      const session = state.sessions[sessionId];
      const newItem = {
        id: Date.now().toString() + Math.random().toString(),
        product_id: '',
        custom_description: '',
        quantity: 1,
        unit_price: 0, // final displayed price
        hours_sewing: 0,
        hours_pattern: 0,
        supply_level: 'SENCILLO',
        extra_materials: [],
        cost: 0, // internal cost
        total: 0,
        status: 'draft', // 'draft' | 'valid' | 'error'
        errors: [],
        recalculating: false
      };
      
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: { ...session, items: [...session.items, newItem], isDirty: true }
        }
      };
    });
  },

  removeRow: (sessionId, rowId) => {
    set((state) => {
      const session = state.sessions[sessionId];
      const newItems = session.items.filter(item => item.id !== rowId);
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: { ...session, items: newItems, isDirty: true }
        }
      };
    });
  },

  updateRow: (sessionId, rowId, updates) => {
    set((state) => {
      const session = state.sessions[sessionId];
      const newItems = session.items.map(item => {
        if (item.id === rowId) {
          return { ...item, ...updates };
        }
        return item;
      });
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: { ...session, items: newItems, isDirty: true }
        }
      };
    });
  }
}));

// Initialize store with one default session
usePosStore.getState().createSession();
