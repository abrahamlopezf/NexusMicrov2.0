import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, User, Phone, Mail, MapPin, 
  Award, ChevronRight, X, Save, Edit, ExternalLink, Calendar, Trash2
} from 'lucide-react';
import clientService from '../../api/clientService';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', loyalty_points: 0
  });

  const fetchClients = async () => {
    try {
      const data = await clientService.getAllClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({ name: '', phone: '', email: '', address: '', loyalty_points: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (client) => {
    setIsEditing(true);
    setSelectedId(client.id);
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      loyalty_points: client.loyalty_points || 0
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || saving) return;
    
    setSaving(true);
    try {
      if (isEditing) {
        await clientService.updateClient(selectedId, formData);
      } else {
        await clientService.createClient(formData);
      }
      setShowModal(false);
      await fetchClients();
    } catch (error) {
      alert("Error al guardar: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) return;
    try {
      await clientService.deleteClient(id);
      await fetchClients();
    } catch (error) {
      alert("Error al eliminar: " + (error.response?.data?.message || error.message));
    }
  };

  const filteredClients = clients.filter(c => 
    (c?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c?.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Clientes</h1>
          <p className="text-slate-500 font-medium">Control de fidelización y recompensas</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#C9A14A] text-white px-7 py-4 rounded-[1.5rem] font-bold flex items-center gap-2 hover:bg-[#B08A39] transition-all shadow-xl shadow-[#C9A14A]/20 active:scale-95"
        >
          <Plus size={22} /> Registrar Cliente
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Base de Datos</p>
            <p className="text-2xl font-black text-slate-900">{clients.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Award size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recompensas</p>
            <p className="text-2xl font-black text-slate-900">
                {clients.filter(c => (parseInt(c.loyalty_points) || 0) >= 9).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-[#C9A14A]/10 text-[#C9A14A] rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Activos hoy</p>
            <p className="text-2xl font-black text-slate-900">Normal</p>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-lg">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o celular..."
          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-50 rounded-[1.5rem] shadow-sm focus:border-[#C9A14A] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Perfil del Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contacto</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Fidelidad</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Compras</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-300 font-black animate-pulse">CARGANDO DIRECTORIO...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">No se encontraron resultados.</td></tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 text-[#C9A14A] rounded-[1.2rem] flex items-center justify-center font-black text-xl border-2 border-white shadow-sm group-hover:bg-[#C9A14A] group-hover:text-white transition-all uppercase">
                          {(client?.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-tight">{client?.name}</p>
                          {(parseInt(client?.loyalty_points) || 0) >= 9 && (
                            <div className="flex items-center gap-1.5 mt-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/20 w-fit">
                              <Award size={10} /> RECOMPENSA LISTA
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Phone size={14} className="text-slate-300" /> {client?.phone || '-'}</span>
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{client?.email || '-'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex justify-between w-28 text-[10px] font-black">
                          <span className="text-slate-300">PUNTOS</span>
                          <span className="text-[#C9A14A]">{(parseInt(client?.loyalty_points) || 0) % 10}/10</span>
                        </div>
                        <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-700 ${parseInt(client?.loyalty_points) >= 9 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-[#C9A14A]'}`}
                            style={{ width: `${((parseInt(client?.loyalty_points) || 0) % 10) * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="bg-slate-100 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl border border-slate-200">
                        {client?.total_purchases || 0}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenEdit(client)}
                          className="p-3 text-slate-400 hover:text-[#C9A14A] hover:bg-orange-50 rounded-2xl transition-all" 
                          title="Editar Cliente"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all" 
                          title="Eliminar Cliente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 animate-scale-in">
            <div className="bg-gradient-to-br from-[#C9A14A] to-[#B08A39] p-10 text-white relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tight leading-none">
                    {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <p className="text-amber-100/70 font-bold text-sm mt-2">Nexus Loyalty System</p>
                </div>
                <button onClick={() => setShowModal(false)} className="bg-white/20 hover:bg-white/30 p-3 rounded-[1.2rem] transition-all"><X size={24} /></button>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><User size={12} /> Nombre del Cliente</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-[#C9A14A]/30 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="Ej. Antonio López" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Phone size={12} /> Celular</label>
                    <input className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-[#C9A14A]/30 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="33 1234 5678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Award size={12} /> Puntos</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-[#C9A14A]/30 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" value={formData.loyalty_points} onChange={e => setFormData({...formData, loyalty_points: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Mail size={12} /> Correo Electrónico</label>
                  <input type="email" className="w-full px-6 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-[#C9A14A]/30 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="antonio@ejemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  disabled={saving} 
                  type="submit" 
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/30 hover:bg-[#C9A14A] active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {saving ? 'Procesando...' : <><Save size={22} className="text-[#C9A14A] group-hover:text-white transition-colors" /> {isEditing ? 'Actualizar Datos' : 'Guardar Cliente'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
