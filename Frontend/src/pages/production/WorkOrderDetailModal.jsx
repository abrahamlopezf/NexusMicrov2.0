import React, { useState, useEffect, useRef } from 'react';
import { X, Play, CheckCircle2, Clock, User, AlertCircle, Eye, Hammer } from 'lucide-react';
import productionService from '../../api/productionService';
import axios from '../../api/axios';

const WorkOrderDetailModal = ({ workOrderId, onClose, onSuccess }) => {
  const [order, setOrder] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, usersRes] = await Promise.all([
          productionService.getWorkOrderById(workOrderId),
          axios.get('/users')
        ]);
        if (isMounted.current) {
          if (orderRes?.success) setOrder(orderRes.data);
          const allUsers = usersRes.data?.data || usersRes.data?.users || [];
          setEmployees(allUsers.filter(u => u.role === 'EMPLOYEE' || u.role === 'MANAGER'));
        }
      } catch (err) {
        console.error('Error fetching detail:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted.current = false; };
  }, [workOrderId]);

  const handleStatus = async (newStatus) => {
    try {
      setError(null);
      const res = await productionService.updateWorkOrderStatus(workOrderId, newStatus);
      if (res?.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployee) return;
    try {
      setError(null);
      const res = await productionService.assignWorkOrder(workOrderId, selectedEmployee);
      if (res?.success) {
        alert('Tareas asignadas correctamente');
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asignar');
    }
  };

  const handleProduction = async (type) => {
    try {
      setError(null);
      const res = type === 'start'
        ? await productionService.startProduction(workOrderId)
        : await productionService.completeProduction(workOrderId);
      if (res?.success) {
        setOrder(prev => ({
          ...prev,
          status: type === 'start' ? 'IN_PROGRESS' : 'DONE'
        }));
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error en producción');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const map = {
      'PENDING': { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      'IN_PROGRESS': { label: 'En Proceso', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Play },
      'DONE': { label: 'Finalizado', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    };
    const c = map[s] || map['PENDING'];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[10px] font-black uppercase`}>
        <Icon size={10} /> {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-20 text-center text-slate-400 font-bold text-[10px] tracking-widest">Cargando...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-20 text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-bold">No se pudo cargar la orden</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-100 rounded-xl font-bold text-slate-500">Cerrar</button>
        </div>
      </div>
    );
  }

  const mainTask = order.tasks?.[0];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Hammer size={20} className="text-slate-900" />
            <h2 className="text-xl font-black text-slate-900">Orden #{order.id}</h2>
            {getStatusBadge(order.status)}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-tight">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto</p>
              <p className="font-bold text-slate-700">{mainTask?.product?.name || 'N/A'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad</p>
              <p className="font-bold text-slate-700">{mainTask?.quantity || 0} unidades</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Creación</p>
              <p className="font-bold text-slate-700 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas</p>
              <p className="font-bold text-slate-700 text-sm truncate">{order.notes || 'Sin notas'}</p>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tareas</h3>
            <div className="space-y-2">
              {(order.tasks || []).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Eye size={16} className="text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{task.task_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {task.quantity} × {task.product?.name || ''}
                        {task.employee_id ? ` | Asignado a #${task.employee_id}` : ''}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</h3>
            <div className="flex flex-wrap gap-3">
              {order.status === 'PENDING' && (
                <button onClick={() => handleProduction('start')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  <Play size={16} fill="currentColor" /> Iniciar Producción
                </button>
              )}
              {order.status === 'IN_PROGRESS' && (
                <button onClick={() => handleProduction('complete')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">
                  <CheckCircle2 size={16} /> Completar Producción
                </button>
              )}
              <button onClick={() => handleStatus('PENDING')} className={`px-4 py-2.5 rounded-xl font-bold transition-all ${order.status === 'DONE' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Clock size={14} className="inline mr-1" /> Marcar Pendiente
              </button>
              <button onClick={() => handleStatus('IN_PROGRESS')} className={`px-4 py-2.5 rounded-xl font-bold transition-all ${order.status === 'PENDING' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Play size={14} className="inline mr-1" /> Marcar En Proceso
              </button>
              <button onClick={() => handleStatus('DONE')} className={`px-4 py-2.5 rounded-xl font-bold transition-all ${order.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <CheckCircle2 size={14} className="inline mr-1" /> Marcar Finalizado
              </button>
            </div>

            {/* Assign */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
              <User size={16} className="text-slate-400" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="">Asignar a empleado...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedEmployee}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailModal;