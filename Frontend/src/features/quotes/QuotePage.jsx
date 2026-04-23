import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { usePosStore } from '../../store/posStore'; // Reusing store structure for UI matrix
import { POSTable } from '../../components/POS/POSTable';
import { POSSummary } from '../../components/POS/POSSummary';
import { Loader2, Save, Download, CheckCircle, FileText, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const QuotePage = () => {
    const { sessions, activeSessionId, updateSessionState, createSession } = usePosStore();
    const activeSession = sessions[activeSessionId];
    const { user } = useAuthStore();
    
    // Status management: DRAFT, SAVED, APPROVED
    const [quoteMeta, setQuoteMeta] = useState({ id: null, status: 'DRAFT' });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSaveDraft = async () => {
        setIsProcessing(true);
        try {
            const payload = {
                client_id: activeSession.client || 1,
                items: activeSession.items,
                discount: activeSession.totals.discount,
                notes: "Cotización guardada vía sistema."
            };

            const res = await api.post('/quotes', payload);
            setQuoteMeta({ id: res.data.data.quote.id, status: res.data.data.quote.status });
            updateSessionState(activeSession.id, { isDirty: false });
            alert('Cotización Guardada Exitosamente');
        } catch (err) {
            console.error(err);
            alert('Error al guardar la cotización');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!quoteMeta.id) return alert('Debes guardar la cotización primero');
        window.open(`http://localhost:5000/api/v1/quotes/${quoteMeta.id}/pdf`, '_blank');
    };

    const handleApprove = async () => {
        if (!quoteMeta.id) return;
        setIsProcessing(true);
        try {
            const res = await api.post(`/quotes/${quoteMeta.id}/approve`);
            setQuoteMeta({ ...quoteMeta, status: 'APPROVED' });
        } catch (err) {
            alert('Error aprobando');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConvertToSale = async () => {
        if (quoteMeta.status !== 'APPROVED') return alert('Solo cotizaciones aprobadas se pueden convertir.');
        setIsProcessing(true);
        try {
            const res = await api.post(`/quotes/${quoteMeta.id}/convert`, { payment: { amount: activeSession.totals.advance || 0 } });
            alert('¡Conversión exitosa a Venta! \nJob en cola: ' + res.data.data.processing.jobId);
            createSession(); // Reset view
            setQuoteMeta({ id: null, status: 'DRAFT' });
        } catch (err) {
            alert(err.response?.data?.message || 'Error en conversión');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!activeSession) return <div>Cargando...</div>;

    const StatusBadge = () => {
        const styles = {
            DRAFT: 'bg-gray-100 text-gray-700',
            SENT: 'bg-blue-100 text-blue-700',
            APPROVED: 'bg-green-100 text-green-700',
            EXPIRED: 'bg-red-100 text-red-700',
            CONVERTED: 'bg-purple-100 text-purple-700'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[quoteMeta.status] || styles.DRAFT}`}>{quoteMeta.status}</span>;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50/50 p-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/> Creador de Cotizaciones</h1>
                    <StatusBadge />
                </div>
                
                <div className="flex items-center gap-3">
                    {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                    
                    {!quoteMeta.id && (
                        <button onClick={handleSaveDraft} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                            <Save className="w-4 h-4"/> Guardar Borrador
                        </button>
                    )}
                    
                    {quoteMeta.id && (
                        <>
                            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100">
                                <Download className="w-4 h-4"/> PDF
                            </button>
                            
                            {quoteMeta.status !== 'APPROVED' && quoteMeta.status !== 'CONVERTED' && (
                                <button onClick={handleApprove} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                    <CheckCircle className="w-4 h-4"/> Aprobar Manual
                                </button>
                            )}

                            {quoteMeta.status === 'APPROVED' && (
                                <button onClick={handleConvertToSale} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md">
                                    <Play className="w-4 h-4"/> Convertir a Venta
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto flex gap-6">
                <div className="flex-1 min-w-[800px]">
                    <POSTable sessionId={activeSession.id} />
                </div>
                <div className="w-[320px] flex-shrink-0">
                    <POSSummary sessionId={activeSession.id} />
                </div>
            </div>
        </div>
    );
};
