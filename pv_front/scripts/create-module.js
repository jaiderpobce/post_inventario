#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontRoot = path.resolve(__dirname, '..');

// 1. Obtener argumentos
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
\x1b[33mUso:\x1b[0m node scripts/create-module.js <NombreModulo> [ruta] [titulo]

\x1b[36mEjemplos:\x1b[0m
  node scripts/create-module.js Compras
  node scripts/create-module.js Clientes /clientes "Directorio de Clientes"
  node scripts/create-module.js Proveedores /proveedores "Proveedores y Fabricantes"
`);
  process.exit(1);
}

const rawName = args[0].trim();
const PascalName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
const camelName = PascalName.charAt(0).toLowerCase() + PascalName.slice(1);
const kebabName = rawName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-');
const routePath = (args[1] || `/${kebabName}`).startsWith('/') ? (args[1] || `/${kebabName}`) : `/${args[1]}`;
const title = args[2] || PascalName;

console.log(`\n🚀 \x1b[32mGenerando estructura para módulo:\x1b[0m \x1b[1m${PascalName}\x1b[0m`);
console.log(`   Ruta: \x1b[36m${routePath}\x1b[0m`);
console.log(`   Título: \x1b[36m${title}\x1b[0m\n`);

// Rutas de archivos
const modelPath = path.join(frontRoot, 'src', 'models', `${PascalName}Model.js`);
const controllerPath = path.join(frontRoot, 'src', 'controllers', `use${PascalName}Controller.js`);
const viewPath = path.join(frontRoot, 'src', 'views', `${PascalName}View.jsx`);
const appRoutesPath = path.join(frontRoot, 'src', 'routes', 'AppRoutes.jsx');
const headerPath = path.join(frontRoot, 'src', 'components', 'common', 'Header.jsx');

// ==========================================
// 1. CREAR MODELO (src/models/<Name>Model.js)
// ==========================================
const modelContent = `/**
 * Modelo de negocio y validaciones para: ${PascalName}
 */
export class ${PascalName}Model {
  static filterItems(items, query) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item => 
      Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(q)
      )
    );
  }

  static createEmptyItem() {
    return {
      id: null,
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO'
    };
  }

  static validate(item) {
    const errors = [];
    if (!item.nombre || !item.nombre.trim()) {
      errors.push('El nombre es obligatorio.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
`;

fs.writeFileSync(modelPath, modelContent, 'utf8');
console.log(`  ✅ Creado Modelo:      \x1b[34msrc/models/${PascalName}Model.js\x1b[0m`);

// ========================================================
// 2. CREAR CONTROLADOR (src/controllers/use<Name>Controller.js)
// ========================================================
const controllerContent = `import { useState, useEffect, useCallback } from 'react';
import { ${PascalName}Model } from '../models/${PascalName}Model';

export function use${PascalName}Controller() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', icon: '✨' });

  const showToast = useCallback((msg, icon = '✨') => {
    setToast({ show: true, message: msg, icon });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2800);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/${kebabName}');
      if (!res.ok) throw new Error(\`Error HTTP \${res.status}\`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Endpoint /api/${kebabName} no disponible aún o error:', err);
      setError('No se pudo conectar con el servidor para cargar ${title}.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNew = () => {
    setSelectedItem(${PascalName}Model.createEmptyItem());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem({ ...item });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveItem = async (itemData) => {
    const { isValid, errors } = ${PascalName}Model.validate(itemData);
    if (!isValid) {
      showToast(errors[0], '⚠️');
      return false;
    }

    try {
      const isEdit = !!itemData.id;
      const url = isEdit ? \`/api/${kebabName}/\${itemData.id}\` : '/api/${kebabName}';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (!res.ok) throw new Error('Error al guardar en el servidor');
      showToast(\`✅ \${isEdit ? 'Actualizado' : 'Registrado'} con éxito\`);
      handleCloseModal();
      loadData();
      return true;
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar datos', '⚠️');
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;
    try {
      const res = await fetch(\`/api/${kebabName}/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('🗑️ Registro eliminado');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('❌ No se pudo eliminar', '⚠️');
    }
  };

  const filteredItems = ${PascalName}Model.filterItems(items, searchTerm);

  return {
    items: filteredItems,
    totalCount: items.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedItem,
    isModalOpen,
    toast,
    showToast,
    loadData,
    handleOpenNew,
    handleOpenEdit,
    handleCloseModal,
    handleSaveItem,
    handleDelete
  };
}
`;

fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log(`  ✅ Creado Controlador: \x1b[34msrc/controllers/use${PascalName}Controller.js\x1b[0m`);

// ==========================================
// 3. CREAR VISTA (src/views/<Name>View.jsx)
// ==========================================
const viewContent = `import React from 'react';
import { use${PascalName}Controller } from '../controllers/use${PascalName}Controller';

export default function ${PascalName}View() {
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
  } = use${PascalName}Controller();

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO DEL MÓDULO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0 }}>
              📁 ${title}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Gestión centralizada y control de operaciones de ${title.toLowerCase()}.
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
              placeholder="Buscar en ${title.toLowerCase()}..." 
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
`;

fs.writeFileSync(viewPath, viewContent, 'utf8');
console.log(`  ✅ Creada Vista:       \x1b[34msrc/views/${PascalName}View.jsx\x1b[0m`);

// ==========================================
// 4. ACTUALIZAR RUTAS (AppRoutes.jsx)
// ==========================================
let routesSource = fs.readFileSync(appRoutesPath, 'utf8');

// Insertar Import si no existe
const importStatement = `import ${PascalName}View from '../views/${PascalName}View';`;
if (!routesSource.includes(importStatement)) {
  const lastImportIndex = routesSource.lastIndexOf('import ');
  const nextLineIndex = routesSource.indexOf('\n', lastImportIndex);
  routesSource = routesSource.slice(0, nextLineIndex + 1) + importStatement + '\n' + routesSource.slice(nextLineIndex + 1);
}

// Insertar Route si no existe
const routeStatement = `      <Route path="${routePath}" element={<${PascalName}View />} />`;
if (!routesSource.includes(`path="${routePath}"`)) {
  const fallbackIndex = routesSource.indexOf('{/* RUTA POR DEFECTO */}');
  if (fallbackIndex !== -1) {
    const routeBlock = `      {/* MÓDULO: ${PascalName.toUpperCase()} */}\n${routeStatement}\n\n`;
    routesSource = routesSource.slice(0, fallbackIndex) + routeBlock + routesSource.slice(fallbackIndex);
  }
}

fs.writeFileSync(appRoutesPath, routesSource, 'utf8');
console.log(`  ✅ Rutas Actualizadas: \x1b[34msrc/routes/AppRoutes.jsx\x1b[0m (\x1b[36m${routePath}\x1b[0m)`);

// ==========================================
// 5. ACTUALIZAR MENÚ (Header.jsx)
// ==========================================
let headerSource = fs.readFileSync(headerPath, 'utf8');
const navLinkTarget = `to="${routePath}"`;

if (!headerSource.includes(navLinkTarget)) {
  const navCloseIndex = headerSource.indexOf('</nav>');
  if (navCloseIndex !== -1) {
    const navLinkCode = `        <NavLink 
          to="${routePath}" 
          className={({ isActive }) => \`menu-btn \${isActive ? 'active' : ''}\`}
        >
          ${title}
        </NavLink>\n      `;
    headerSource = headerSource.slice(0, navCloseIndex) + navLinkCode + headerSource.slice(navCloseIndex);
    fs.writeFileSync(headerPath, headerSource, 'utf8');
    console.log(`  ✅ Menú Actualizado:  \x1b[34msrc/components/common/Header.jsx\x1b[0m`);
  }
}

// ==========================================
// 6. IMPRIMIR SCRIPT SQL PARA pos_rbac
// ==========================================
console.log(`\n======================================================`);
console.log(`📋 \x1b[33mSCRIPT SQL PARA REGISTRAR ESTE MÓDULO EN TU BD RBAC:\x1b[0m`);
console.log(`======================================================`);
console.log(`
USE \`pos_rbac\`;

-- 1. Insertar el módulo
INSERT INTO \`modulo\` (\`nombre_modulo\`, \`descripcion\`, \`icono\`, \`orden\`) 
VALUES ('${title}', 'Módulo de ${title}', 'folder', 10);

SET @nuevo_modulo_id = LAST_INSERT_ID();

-- 2. Insertar la vista del módulo
INSERT INTO \`vistas\` (\`id_modulo\`, \`nombre_vista\`, \`ruta_acceso\`, \`descripcion\`)
VALUES (@nuevo_modulo_id, '${title}', '${routePath}', 'Pantalla principal de ${title.toLowerCase()}');

SET @nueva_vista_id = LAST_INSERT_ID();

-- 3. Insertar permisos del módulo
INSERT INTO \`permisos\` (\`nombre_permiso\`, \`descripcion\`) VALUES
('${PascalName.toUpperCase()}_VER', 'Permiso para ver la lista de ${title.toLowerCase()}'),
('${PascalName.toUpperCase()}_CREAR', 'Permiso para crear registros en ${title.toLowerCase()}'),
('${PascalName.toUpperCase()}_EDITAR', 'Permiso para editar registros en ${title.toLowerCase()}'),
('${PascalName.toUpperCase()}_ELIMINAR', 'Permiso para eliminar registros en ${title.toLowerCase()}');

-- 4. Habilitar módulo al SUPERADMIN (rol 1)
INSERT INTO \`r_modulo_rol\` (\`rol_id\`, \`modulo_id\`, \`habilitado\`)
VALUES (1, @nuevo_modulo_id, 1);

SET @r_modulo_rol_id = LAST_INSERT_ID();

-- 5. Otorgar permisos al SUPERADMIN
INSERT INTO \`vistas_permiso\` (\`r_modulo_rol_id\`, \`vista_id\`, \`permiso_id\`, \`permitido\`)
SELECT @r_modulo_rol_id, @nueva_vista_id, id, 1
FROM \`permisos\`
WHERE \`nombre_permiso\` LIKE '${PascalName.toUpperCase()}_%';
`);
console.log(`======================================================`);
console.log(`✨ \x1b[32m¡Módulo ${PascalName} creado y enlazado con éxito en el frontend!\x1b[0m\n`);
