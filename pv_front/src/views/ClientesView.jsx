import React from 'react';
import { useClientesController } from '../controllers/useClientesController';

export default function ClientesView() {
  const {
    items,
    totalCount,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleOpenNew,
    handleOpenEdit,
    handleDelete
  } = useClientesController();

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO DEL MÓDULO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0 }}>
              📁 Clientes
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Gestión centralizada y control de operaciones de clientes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '8px 14px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
              Total: {totalCount}
            </span>
            <button className="btn-quick-add" onClick={handleOpenNew}>
              ＋ Nuevo Registro
            </button>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="search-bar-container" style={{ marginBottom: '20px' }}>
          <div className="search-input-wrapper">
            <span>🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar en clientes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div style={{ maxHeight: '550px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre / Descripción</th>
                <th>Estado</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
                    Cargando información...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#c5221f', padding: '24px' }}>
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No hay registros disponibles.
                  </td>
                </tr>
              )}
              {!loading && !error && items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="code-col">#{item.id || idx + 1}</td>
                  <td><strong>{item.nombre || item.name || 'Sin nombre'}</strong></td>
                  <td>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: item.estado === 'INACTIVO' ? '#fce8e6' : '#e6f4ea',
                      color: item.estado === 'INACTIVO' ? '#c5221f' : '#137333'
                    }}>
                      {item.estado || 'ACTIVO'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleOpenEdit(item)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', fontSize: '1rem' }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
