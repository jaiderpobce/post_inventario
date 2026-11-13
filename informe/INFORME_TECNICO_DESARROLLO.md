# INFORME TÉCNICO DE ARQUITECTURA Y DESARROLLO INTEGRAL
## SISTEMA DE PUNTO DE VENTA (POS), INVENTARIO Y ADMINISTRACIÓN

**Fecha:** 12 de Noviembre de 2026  
**Líder de Proyecto / Autor:** Jaider Ponce (`jaiderponce@gmail.com`)  
**Rama de Trabajo:** `dev`  
**Repositorio:** `https://github.com/jaiderpobce/post_inventario.git`  
**Stack Tecnológico:** Spring Boot 3 (Java 25) | MariaDB 10.11 | React 18 + Vite | Nginx | Docker Compose  

---

## 1. RESUMEN EJECUTIVO

Durante la jornada de desarrollo se llevó a cabo una reingeniería, modernización e implementación integral de los submódulos clave que conforman la gestión administrativa del sistema de Punto de Venta e Inventario.

El objetivo principal fue erradicar pantallas estáticas y datos ficticios (mocks), unificando todo el ecosistema de la aplicación bajo un estándar arquitectónico profesional y homogéneo:
1. **Unificación visual y funcional (UX/UI):** Toda vista del sistema comparte el mismo comportamiento ergonómico (KPIs resumidos, selección por radio con barra informativa, botones de acción contextuales, búsqueda en tiempo real y paginación reactiva configurable).
2. **Capa Backend reactiva y transaccional:** Endpoints REST robustos con Spring Boot y `JdbcTemplate`, aplicando lógica de negocio, trazabilidad kardex y control de estados.
3. **Persistencia e integridad relacional:** Adaptación y sincronización de los esquemas `inventario` y `pos_rbac` en MariaDB.
4. **Módulo centralizado de respuestas y notificaciones:** Procesamiento uniforme de códigos HTTP y alertas Toast flotantes Material 3 en frontend.

---

## 2. MODIFICACIONES EN BASE DE DATOS (MariaDB & RBAC)

### 2.1. Estructura RBAC (`pos_rbac`)
- **Módulo Administración:** Se incorporó el módulo `/administracion` en la tabla `pos_rbac.modulos` con icono representativo (`admin_panel_settings`).
- **Submódulos Dinámicos (`pos_rbac.vistas`):** Se crearon y vincularon las vistas para cada área administrativa con sus respectivos iconos Material Symbols y descripciones:
  - `/administracion/productos` (`inventory_2`): Catálogo, precios y códigos de barra.
  - `/administracion/clientes` (`people`): Directorio fiscal y límites de crédito.
  - `/administracion/compras` (`shopping_cart`): Facturación de proveedores y reposición de stock.
  - `/administracion/inventario` (`warehouse`): Existencias por almacén físico y kardex.
  - `/administracion/categorias` (`category`): Departamentos taxonómicos y unidades.
- **Permisos y Privilegios:** Se asignaron los accesos en `pos_rbac.roles_vistas` para el rol Administrador y se otorgó privilegio total `GRANT ALL PRIVILEGES ON inventario.* TO 'pos_user'@'%'` para habilitar operaciones transaccionales de escritura.

### 2.2. Esquema Operativo (`inventario`)
Se actualizaron las tablas maestras y el archivo de definición de esquemas `bd_forma/inventario.sql`:
- **`inventario.cliente`**:
  - `tipo_cliente VARCHAR(50) DEFAULT 'Consumidor Final'`
  - `limite_credito DECIMAL(12,2) DEFAULT 0.00`
  - `estado ENUM('ACTIVO','SUSPENDIDO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'`
- **`inventario.compra`**:
  - `estado ENUM('COMPLETADA','PENDIENTE','ANULADA') NOT NULL DEFAULT 'COMPLETADA'`
  - `observaciones TEXT DEFAULT NULL`
  - `id_almacen INT(11) DEFAULT 3`
- **`inventario.proveedor`**:
  - `estado ENUM('ACTIVO','SUSPENDIDO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'`
- **`inventario.medidas`**:
  - Registro de la unidad base `UND` (ID: 1).
- **`inventario.stock` & `inventario.movimientos_productos`**:
  - Vinculación directa con almacén principal (ID: 3) para sincronización automática de entradas, salidas y conteos.

---

## 3. ARQUITECTURA BACKEND (Spring Boot / Java)

Se desarrollaron y optimizaron controladores REST dedicados en el paquete `com.pos.inventario.*`:

### 3.1. `ProductController.java` (`/api/products`)
- **Consultas con Stock Agrupado:** Resuelve el stock actual mediante `LEFT JOIN (SELECT id_producto, SUM(cantidad) AS stock FROM stock GROUP BY id_producto)`.
- **Ordenamiento Inmediato:** Ordenado por `p.id DESC` para que los nuevos artículos creados aparezcan de inmediato en la primera fila.
- **Creación Transaccional (`POST /api/products`):**
  - Generación de código interno autoincremental (`PROD-00XX`).
  - Asignación de unidad de medida fiscal (`UND`, `kg`, `L`).
  - Tratamiento tributario: discriminación de IVA (Exento vs. Gravado 16%).
  - Inserción con `KeyHolder` para capturar el ID generado.
  - Inicialización automática de existencia en la tabla `inventario.stock`.
- **Modificación y Control de Estados:** Endpoints `PUT /{id}`, `PATCH /{id}/status` y `DELETE /{id}` (inactivación lógica).
- **Categorías Activas:** Endpoint auxiliar `GET /api/products/categories`.

### 3.2. `CustomerController.java` (`/api/customers`, `/api/clientes`)
- **Gestión de Directorio Fiscal:** Soporte para cédulas de identidad, RIFs jurídicos, nombres/apellidos, teléfonos, correos y domicilios.
- **Perfiles de Cliente:** Manejo de tipos de cliente (`Consumidor Final`, `Contribuyente Especial`, `Cliente VIP / Crédito`, `Gobierno / Institucional`).
- **Control de Crédito y Estado:** Límite de crédito en USD y suspensión/reactivación en un clic mediante `PATCH /{id}/status`.

### 3.3. `PurchaseController.java` (`/api/purchases`, `/api/compras`)
- **Flujo Transaccional de Compras (`POST /api/purchases`):**
  - Validación de cabecera (proveedor, número de factura de compra, fecha y notas).
  - Cálculo del total sumando cada línea de producto.
  - Inserción en `compra` y en `detalle_compra`.
  - **Alimentación automática de stock:** Incremento de cantidades en `inventario.stock` (`ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`).
  - **Trazabilidad Kardex:** Registro de movimiento en `inventario.movimientos_productos` con tipo `INGRESO`.
  - **Actualización de Costo:** Actualiza el costo de adquisición (`precio_compra`) en el catálogo maestro de productos.
- **Detalle de Factura (`GET /api/purchases/{id}`):** Desglose completo de ítems, cantidades, costos unitarios y subtotales.
- **Catálogo de Proveedores (`GET /api/purchases/suppliers`):** Consulta de proveedores registrados en `inventario.proveedor`.

### 3.4. `InventoryController.java` (`/api/inventory`, `/api/inventario`)
- **Valuación de Mercancía en Tiempo Real:** Calcula el valor financiero del inventario activo multiplicando `stock * precio_compra`.
- **Alertas de Existencia:** Clasificación automática de estados de stock:
  - `Óptimo`: Existencia por encima del umbral mínimo.
  - `Bajo Stock`: Existencia menor o igual al `stock_minimo`.
  - `Agotado`: Existencia igual o menor a cero.
- **Ajustes Manuales de Almacén (`POST /api/inventory/adjust`):**
  - `INGRESO`: Suma existencias por entrada extraordinaria o donación.
  - `EGRESO`: Descuenta existencias por merma, rotura o vencimiento.
  - `AJUSTE`: Fija la existencia real tras conteo físico directo.
  - Registra el movimiento histórico en el kardex de la empresa.

### 3.5. `UserController.java` (`/api/users` & `/api/usuarios`)
- **Gestión Integral de Operadores y Cuentas en `pos_rbac`:**
  - `GET /api/users`: Lista operadores con documento, rol asignado, estado (`ACTIVO` / `SUSPENDIDO`) y fecha de creación.
  - `GET /api/users/roles`: Catálogo de roles del sistema (`SUPERADMIN`, `ADMINISTRADOR`, `SUPERVISOR`, `CAJERO`).
  - `POST /api/users`: Creación de operadores con encriptación BCrypt de contraseñas y asignación relacional de rol.
  - `PUT /api/users/{id}`: Modificación de datos personales, correo, documento y actualización de rol o clave.
  - `PATCH /api/users/{id}/status`: Alternancia reactiva de estado (protegiendo la cuenta de Superadmin).
  - `DELETE /api/users/{id}`: Inactivación segura del usuario en el sistema.

---

## 4. ARQUITECTURA FRONTEND (React 18 + Vite)

### 4.1. Módulo Centralizado de Respuestas y Notificaciones
- **`apiResponseHandler.js`:** Parser unificado que procesa códigos de estado HTTP (200, 201, 400, 401, 403, 404, 409, 500) y extrae de forma limpia mensajes de error, validaciones de campo o fallas de red.
- **`apiClient.js`:** Cliente HTTP estándar (soporta `get`, `post`, `put`, `patch`, `delete`) que encapsula headers, parsing JSON y vinculación automática con el response handler.
- **`NotificationContext.jsx`:** Sistema global de alertas flotantes Toast tipo Material 3 (`showSuccess`, `showError`, `showWarning`, `showInfo`) con barra de progreso, auto-cierre y apilamiento no invasivo.

### 4.2. Estandarización y Uniformidad de Vistas
Todas las vistas del sistema (`ProductsView`, `ClientesView`, `PurchasesView`, `InventoryView` y `AdministrationView`) fueron construidas siguiendo un diseño visual idéntico:
- **Tarjetas Métricas (KPIs):** Indicadores clave en la parte superior (cantidades, totales valorados, facturas, alertas).
- **Botonera de Acción Dinámica:** Botones de acción primaria (`＋ Nuevo Registro`) y botones condicionales (`Modificar`, `Suspender/Reactivar`, `Eliminar/Anular`) habilitados automáticamente al seleccionar una fila.
- **Barra de Selección Activa:** Muestra los datos esenciales del ítem marcado con opción de deselección inmediata (`✕ Deseleccionar`).
- **Grilla de Datos (`pos-table`):** Fila seleccionable mediante botón de radio, resaltado celeste, efecto hover y badges de estado con código de color.
- **Buscador en Tiempo Real:** Filtrado instantáneo sin recargar la página.
- **Barra de Paginación Reactiva:** Selector de filas por página (5, 10, 20, 50), contador dinámico ("Mostrando X a Y de Z registros") y controles de navegación (`«`, `‹ Anterior`, `Página X de Y`, `Siguiente ›`, `»`).

### 4.3. Modales Construidas
| Componente | Función Principal | Integración Backend |
|---|---|---|
| `ProductCreateModal.jsx` | Registro maestro de producto, precios, código de barras, IVA y existencia inicial | `POST /api/products` |
| `ProductEditModal.jsx` | Edición de precios, códigos y descripción de producto | `PUT /api/products/{id}` |
| `CustomerCreateModal.jsx` | Incorporación de clientes con perfil fiscal, RIF/CI, dirección y crédito | `POST /api/customers` |
| `CustomerEditModal.jsx` | Modificación de datos de contacto y condiciones comerciales | `PUT /api/customers/{id}` |
| `PurchaseCreateModal.jsx` | Carga de facturas de compras con selector de proveedor y filas dinámicas de productos | `POST /api/purchases` |
| `PurchaseDetailModal.jsx` | Visualización del desglose de productos recibidos en una factura de compra | `GET /api/purchases/{id}` |
| `InventoryAdjustmentModal.jsx` | Ejecución de ajustes de stock (entradas, mermas o conteos físicos) con motivo | `POST /api/inventory/adjust` |
| `UserCreateModal.jsx` | Registro de nuevos operadores/usuarios en `pos_rbac.usuario` con contraseña segura | `POST /api/users` |
| `UserEditModal.jsx` | Modificación de credenciales, perfil personal y contraseña de usuario | `PUT /api/users/{id}` |
| `UserRolesModal.jsx` | Modal interactiva de asignación granular de roles con checkboxes M:N | `GET/PUT /api/users/{id}/roles` |

---

## 5. TABLA COMPARATIVA DE CAPACIDADES POR SUBMÓDULO

| Submódulo | Ruta Directa | Ruta en Dashboard | Estado Operativo | Conectado a BD Real |
|---|---|---|---|---|
| **Productos y Catálogo** | `/productos` | `/administracion` (Tab 1) | **100% Operativo** | ✅ Sí (`inventario.productos`, `stock`) |
| **Clientes y Cuentas** | `/clientes` | `/administracion` (Tab 2) | **100% Operativo** | ✅ Sí (`inventario.cliente`) |
| **Compras y Proveedores** | `/compras` | `/administracion` (Tab 3) | **100% Operativo** | ✅ Sí (`inventario.compra`, `detalle_compra`, `proveedor`) |
| **Inventario y Almacenes** | `/inventario` | `/administracion` (Tab 4) | **100% Operativo** | ✅ Sí (`inventario.stock`, `almacen`, `movimientos_productos`) |
| **Usuarios y Cuentas** | `/usuarios` | `/sistema` (Tab 1) | **100% Operativo** | ✅ Sí (`pos_rbac.usuario`, `pos_rbac.r_usuario_rol`, `pos_rbac.rol`) |
| **Punto de Venta (POS)** | `/pos` | — | **Operativo** | ✅ Sí (Catálogo, clientes, selección y cobro) |

---

## 6. PRUEBAS Y VALIDACIÓN END-TO-END

Se ejecutaron pruebas integrales de comunicación e integridad de datos:
1. **Creación de Productos:** Verificada la inserción de artículos (`Galletas María 200g`, etc.) con persistencia en `productos` y creación de balance en `stock`.
2. **Registro de Clientes:** Verificado el registro desde la interfaz de usuario de clientes naturales y jurídicos, con actualización reactiva en la grilla y persistencia en MariaDB.
3. **Registro Transaccional de Compra:** Se procesó la factura `FC-POL-TEST-01` de Alimentos Polar; se verificó que la existencia del producto en el almacén principal se incrementó automáticamente de 260 a 310 unidades.
4. **Trazabilidad Kardex:** Se confirmó la inserción de registros en `movimientos_productos` tanto por facturas de compra como por el modal de ajuste de inventario.
5. **Auditoría de Contenedores:**
   - Backend `pos_springboot_backend`: Reconstruido y ejecutándose sin errores en puerto 8081 (interno 8080).
   - Frontend `pos_react_frontend`: Compilado con Vite y servido mediante Nginx en puerto 3005.
   - Base de datos `pos_mariadb`: Conexión de HikariCP fluida con pool de conexiones activo.

---

## 7. CONTROL DE VERSIONES (GIT)

Todos los cambios fueron estructurados en commits semánticos y sincronizados con el repositorio remoto en la rama `dev`:

- **Commit `2550a7e`:** `feat: actualizacion de submodulos compras e inventario con vistas uniformes, modales y api backend`
- **Commit `6b7bf72`:** `feat: modulo uniforme de clientes con modales de crear y editar, paginacion y api backend`
- **Commit `06574c2`:** `feat: proceso completo para registrar nuevo producto con modal y guardado en bd`
- **Commit `20bf21f`:** `fix: restaurar variables de estado de clientes y paginacion en AdministrationView`
- **Commit `0c6114e`:** `feat: submodulo administracion estructurado con navegacion rbac, iconos y grilla paginada`

---

## 8. CONCLUSIONES Y RECOMENDACIONES

El sistema cuenta ahora con una base arquitectónica sólida, desacoplada y escalable. Se recomienda para las siguientes etapas:
1. **Reportes Financieros (JasperReports / Tomcat):** Vincular las tablas `compra`, `venta` y `movimientos_productos` con los reportes en PDF del contenedor de Tomcat.
2. **Submódulo Categorías y Medidas:** Implementar las modales para crear y editar departamentos en la tabla `inventario.categorias`.
3. **Cierre de Caja y Múltiples Almacenes:** Ampliar la transferencia inter-almacenes (del almacén principal a sucursales secundarias).
