import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SystemView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');

  // Submódulos del sistema
  const systemSubmodules = [
    { id: 'usuarios', label: 'Usuarios y Cuentas', icon: '👥', desc: 'Gestión de operadores y cajeros' },
    { id: 'roles', label: 'Roles y Permisos (RBAC)', icon: '🛡️', desc: 'Configuración de matriz RBAC' },
    { id: 'cajas', label: 'Terminales y Cajas', icon: '🖥️', desc: 'Puntos de venta físicos y turnos' },
    { id: 'hardware', label: 'Impresoras y Dispositivos', icon: '🖨️', desc: 'Ticketeras fiscales y balanzas' },
    { id: 'auditoria', label: 'Logs de Auditoría', icon: '📋', desc: 'Historial de acciones y seguridad' },
    { id: 'general', label: 'Parámetros del Sistema', icon: '⚙️', desc: 'Moneda, IVA y datos de empresa' }
  ];

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 65px)',
      background: 'var(--bg-dark)',
      padding: '20px 24px',
      gap: '24px',
      maxWidth: '1500px',
      margin: '0 auto',
      width: '100%'
    }}>
      
      {/* ========================================================
          SIDEBAR LATERAL TIPO DASHBOARD (SUBMÓDULOS DE SISTEMA)
         ======================================================== */}
      <aside style={{
        width: '300px',
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '24px 16px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content'
      }}>
        {/* ENCABEZADO DEL SIDEBAR */}
        <div style={{ padding: '0 10px 18px 10px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Módulo Sistema
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Panel de control administrativo y RBAC
          </p>
        </div>

        {/* LISTA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {systemSubmodules.map((sub) => {
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isActive ? '1px solid #c2e7ff' : '1px solid transparent',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  color: isActive ? 'var(--google-blue)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{sub.icon}</span>
                <div style={{ flex: 1 }}>
                  <div>{sub.label}</div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--google-blue-dark)' : 'var(--text-dim)', fontWeight: 400 }}>
                    {sub.desc}
                  </div>
                </div>
                {isActive && (
                  <span style={{ color: 'var(--google-blue)', fontSize: '0.9rem', fontWeight: 900 }}>›</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PIE DEL SIDEBAR (ESTADO RBAC) */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            pos_rbac (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Operando como: <strong>{user?.rol || 'SUPERADMIN'}</strong>
          </div>
        </div>
      </aside>

      {/* ========================================================
          PANEL PRINCIPAL CONTENEDOR SEGÚN EL SUBMÓDULO ACTIVO
         ======================================================== */}
      <main style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-main)',
        minHeight: '600px'
      }}>

        {/* 1. SUBMÓDULO: USUARIOS Y CUENTAS */}
        {activeTab === 'usuarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  👥 Gestión de Usuarios y Operadores
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Usuarios registrados en la base de datos <strong>pos_rbac.usuario</strong> con credenciales activas.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Modal para crear nuevo usuario en pos_rbac')}>
                ＋ Nuevo Usuario
              </button>
            </div>

            <table className="pos-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nombre y Apellido</th>
                  <th>Cédula / RIF</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="code-col">#1</td>
                  <td><strong>Super Administrador</strong></td>
                  <td>V-00000000</td>
                  <td>superadmin@sistema.com</td>
                  <td><span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>SUPERADMIN</span></td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#137333', fontWeight: 700 }}>● Activo</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }} title="Editar">✏️</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Cambiar Contraseña">🔑</button>
                  </td>
                </tr>
                <tr>
                  <td className="code-col">#2</td>
                  <td><strong>Administrador del Sistema</strong></td>
                  <td>V-00000001</td>
                  <td>admin@sistema.com</td>
                  <td><span style={{ background: '#fef7e0', color: '#b06000', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>ADMINISTRADOR</span></td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#137333', fontWeight: 700 }}>● Activo</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }} title="Editar">✏️</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Cambiar Contraseña">🔑</button>
                  </td>
                </tr>
                <tr>
                  <td className="code-col">#3</td>
                  <td><strong>Cajero Principal</strong></td>
                  <td>V-00000002</td>
                  <td>cajero@sistema.com</td>
                  <td><span style={{ background: '#e6f4ea', color: 'var(--google-green)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>CAJERO</span></td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#137333', fontWeight: 700 }}>● Activo</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }} title="Editar">✏️</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Cambiar Contraseña">🔑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 2. SUBMÓDULO: ROLES Y PERMISOS RBAC */}
        {activeTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  🛡️ Matriz de Roles y Autorizaciones (RBAC)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Estructura jerárquica de roles y permisos granulares gobernados por la tabla <strong>pos_rbac.rol</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--google-blue)', margin: 0, fontSize: '1.05rem' }}>👑 SUPERADMIN</h4>
                  <span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>ACCESO TOTAL</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Acceso irrestricto a todas las pantallas, bypass de autorizaciones y control total del sistema.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#137333' }}>
                  ✓ 32/32 Permisos concedidos
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: '#b06000', margin: 0, fontSize: '1.05rem' }}>💼 ADMINISTRADOR</h4>
                  <span style={{ background: '#fef7e0', color: '#b06000', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>OPERACIONAL</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Gestión completa del catálogo de productos, compras, reportes de cierre e inventario.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#137333' }}>
                  ✓ Acceso a 4 Módulos
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: '#9334e6', margin: 0, fontSize: '1.05rem' }}>🔍 SUPERVISOR</h4>
                  <span style={{ background: '#f3e8fd', color: '#9334e6', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>AUTORIZACIONES</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Autorización de anulaciones de venta en caja (F3), descuentos especiales y arqueos de caja.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--google-blue)' }}>
                  ✓ Permisos especiales de caja
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--google-green)', margin: 0, fontSize: '1.05rem' }}>🛒 CAJERO</h4>
                  <span style={{ background: '#e6f4ea', color: 'var(--google-green)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>PUNTO DE VENTA</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Limitado exclusivamente al terminal de facturación y cobro. Sin acceso a reportes ni configuración.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--google-green)' }}>
                  ✓ Acceso único al Módulo POS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SUBMÓDULO: TERMINALES Y CAJAS */}
        {activeTab === 'cajas' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              🖥️ Configuración de Terminal y Caja
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Parámetros de la estación física de trabajo y caja registradora.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Número de Terminal</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--google-blue)', fontFamily: 'Orbitron, monospace' }}>POS-01</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado de Caja</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--google-green)' }}>ABIERTA</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cajero en Turno</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.nombre}</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUBMÓDULO: HARDWARE */}
        {activeTab === 'hardware' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              🖨️ Impresoras y Periféricos
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Conexión de impresoras fiscales de tickets, balanzas de peso y lectores de códigos de barra.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--google-blue)' }}>🖨️ Impresora de Tickets / Facturas</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modelo: Epson TM-T20III (Térmica 80mm)</p>
                <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Puerto: <code>COM1 / /dev/ttyUSB0</code> (9600 baudios)</div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--google-green)' }}>⚖️ Balanza Electrónica de Mostrador</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Para productos pesables (carnes, quesos, verduras)</p>
                <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Protocolo: <code>Toledo / Dibal / CAS</code></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SUBMÓDULO: AUDITORÍA Y LOGS */}
        {activeTab === 'auditoria' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              📋 Registro de Auditoría y Trazabilidad
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Registro de eventos de seguridad capturados en <strong>pos_rbac.auditoria_logs</strong>.
            </p>

            <table className="pos-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Acción Realizada</th>
                  <th>Tabla / Módulo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>12/11/2026 15:20</td>
                  <td><strong>superadmin@sistema.com</strong></td>
                  <td>INICIALIZACION_SISTEMA</td>
                  <td>pos_rbac</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
                <tr>
                  <td>12/11/2026 15:30</td>
                  <td><strong>superadmin@sistema.com</strong></td>
                  <td>CONFIGURACION_MODULO</td>
                  <td>modulo / vistas</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
                <tr>
                  <td>12/11/2026 15:45</td>
                  <td><strong>cajero@sistema.com</strong></td>
                  <td>INICIO_TURNO_CAJA</td>
                  <td>caja / venta</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 6. SUBMÓDULO: GENERAL */}
        {activeTab === 'general' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              ⚙️ Parámetros Generales de Facturación
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Moneda base, tasa de impuesto al valor agregado (IVA) y datos fiscales.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tasa de IVA Predeterminada
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--google-blue)' }}>16.00%</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Moneda Base del Sistema
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--google-green)' }}>Dólar Estadounidense ($ USD)</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
