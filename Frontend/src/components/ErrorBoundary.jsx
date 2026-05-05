import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-20 text-center flex flex-col items-center gap-6 bg-rose-50 rounded-[40px] border-2 border-dashed border-rose-200 m-6">
          <div className="p-6 bg-rose-100 rounded-full text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-rose-900 mb-2">¡Ups! Algo salió mal</h2>
            <p className="text-rose-600 font-medium max-w-md mx-auto mb-6">
              Ocurrió un error inesperado en este módulo. Intenta refrescar la página.
            </p>
            <div className="bg-white p-4 rounded-2xl border border-rose-100 text-left overflow-auto max-w-xl mx-auto">
              <code className="text-xs text-rose-800 break-all">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
            >
              Refrescar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
