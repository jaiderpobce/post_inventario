-- ========================================================
-- SISTEMA DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Base de Datos Independiente: `pos_rbac`
-- Motor: MariaDB 10.x / 11.x
-- ========================================================

CREATE DATABASE IF NOT EXISTS `pos_rbac`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `pos_rbac`;

-- Otorgar permisos al usuario de la aplicación si existe
GRANT ALL PRIVILEGES ON `pos_rbac`.* TO 'pos_user'@'%';
FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `auditoria_logs`;
DROP TABLE IF EXISTS `vistas_permiso`;
DROP TABLE IF EXISTS `r_modulo_rol`;
DROP TABLE IF EXISTS `r_usuario_rol`;
DROP TABLE IF EXISTS `permisos`;
DROP TABLE IF EXISTS `vistas`;
DROP TABLE IF EXISTS `modulo`;
DROP TABLE IF EXISTS `rol`;
DROP TABLE IF EXISTS `usuario`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. TABLA PRINCIPAL DE USUARIOS
-- --------------------------------------------------------
CREATE TABLE `usuario` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `numero_documento` VARCHAR(20) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(120) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  UNIQUE KEY `uq_usuario_documento` (`numero_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 2. ROLES
-- --------------------------------------------------------
CREATE TABLE `rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_nombre` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 3. MÓDULOS DEL SISTEMA
-- --------------------------------------------------------
CREATE TABLE `modulo` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_modulo` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `icono` VARCHAR(50) DEFAULT NULL,
  `orden` INT(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modulo_nombre` (`nombre_modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 4. PANTALLAS / VISTAS
-- --------------------------------------------------------
CREATE TABLE `vistas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_modulo` INT(11) DEFAULT NULL,
  `nombre_vista` VARCHAR(80) NOT NULL,
  `ruta_acceso` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vistas_ruta` (`ruta_acceso`),
  KEY `fk_vistas_modulo_idx` (`id_modulo`),
  CONSTRAINT `fk_vistas_modulo` FOREIGN KEY (`id_modulo`) REFERENCES `modulo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 5. CATÁLOGO DE PERMISOS
-- --------------------------------------------------------
CREATE TABLE `permisos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_permiso` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permiso_nombre` (`nombre_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 6. ASIGNACIÓN DE USUARIO A ROLES (M:N)
-- --------------------------------------------------------
CREATE TABLE `r_usuario_rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `rol_id` INT(11) NOT NULL,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_rol` (`usuario_id`, `rol_id`),
  KEY `fk_rur_rol_idx` (`rol_id`),
  CONSTRAINT `fk_rur_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rur_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 7. ASIGNACIÓN DE MÓDULOS A ROLES (M:N)
-- --------------------------------------------------------
CREATE TABLE `r_modulo_rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `rol_id` INT(11) NOT NULL,
  `modulo_id` INT(11) NOT NULL,
  `habilitado` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_modulo` (`rol_id`, `modulo_id`),
  KEY `fk_rmr_modulo_idx` (`modulo_id`),
  CONSTRAINT `fk_rmr_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rmr_modulo` FOREIGN KEY (`modulo_id`) REFERENCES `modulo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 8. AUTORIZACIÓN GRANULAR (VISTAS Y PERMISOS POR ROL)
-- --------------------------------------------------------
CREATE TABLE `vistas_permiso` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `r_modulo_rol_id` INT(11) NOT NULL,
  `vista_id` INT(11) NOT NULL,
  `permiso_id` INT(11) NOT NULL,
  `permitido` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vistas_permiso` (`r_modulo_rol_id`, `vista_id`, `permiso_id`),
  KEY `fk_vp_vista_idx` (`vista_id`),
  KEY `fk_vp_permiso_idx` (`permiso_id`),
  CONSTRAINT `fk_vp_modulo_rol` FOREIGN KEY (`r_modulo_rol_id`) REFERENCES `r_modulo_rol` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vp_vista` FOREIGN KEY (`vista_id`) REFERENCES `vistas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vp_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 9. AUDITORÍA Y TRAZABILIDAD
-- --------------------------------------------------------
CREATE TABLE `auditoria_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) DEFAULT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `tabla_afectada` VARCHAR(50) NOT NULL,
  `registro_id` INT(11) DEFAULT NULL,
  `detalles` TEXT DEFAULT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_auditoria_usuario_idx` (`usuario_id`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================================
-- DATOS SEMILLA BÁSICOS (SEED DATA)
-- ========================================================

-- 1. Roles del Sistema
INSERT INTO `rol` (`id`, `nombre_rol`, `descripcion`) VALUES
(1, 'SUPERADMIN', 'Superusuario del sistema con acceso irrestricto y control total'),
(2, 'ADMINISTRADOR', 'Administrador general del negocio y configuraciones'),
(3, 'SUPERVISOR', 'Supervisión de caja, autorizaciones especiales y reportes'),
(4, 'CAJERO', 'Operaciones de venta, facturación y cobro en el POS');

-- 2. Módulos del Sistema
INSERT INTO `modulo` (`id`, `nombre_modulo`, `descripcion`, `icono`, `orden`) VALUES
(1, 'Punto de Venta (POS)', 'Facturación, cobro y atención en caja', 'point_of_sale', 1),
(2, 'Administración', 'Gestión comercial: productos, clientes, compras e inventario', 'admin_panel_settings', 2),
(3, 'Reportes y Auditoría', 'Cierre de caja, ventas diarias y logs de auditoría', 'bar_chart', 3),
(4, 'Configuración y Seguridad', 'Usuarios, roles, terminales e impresoras', 'settings', 4);

-- 3. Vistas asociadas a los Módulos
INSERT INTO `vistas` (`id`, `id_modulo`, `nombre_vista`, `ruta_acceso`, `descripcion`) VALUES
(1, 1, 'Terminal POS', '/pos', 'Pantalla principal de venta'),
(2, 2, 'Panel de Administración', '/administracion', 'Dashboard administrativo: productos, clientes, compras e inventario'),
(3, 3, 'Auditoría y Cierres', '/reportes', 'Reportes de ventas y corte X/Z'),
(4, 4, 'Ajustes del Sistema', '/sistema', 'Configuración de terminal y red');

-- 4. Catálogo de Permisos Granulares
INSERT INTO `permisos` (`id`, `nombre_permiso`, `descripcion`) VALUES
(1, 'ACCESO_VISTA', 'Permiso para acceder a la pantalla'),
(2, 'REGISTRAR_VENTA', 'Permiso para procesar y cobrar ventas (F10)'),
(3, 'ANULAR_VENTA', 'Permiso para anular una venta en curso (F3)'),
(4, 'ELIMINAR_ITEM', 'Permiso para quitar un ítem del carrito (F4)'),
(5, 'MODIFICAR_PRECIO', 'Permiso para alterar precios de venta'),
(6, 'APLICAR_DESCUENTO', 'Permiso para aplicar descuentos especiales'),
(7, 'REIMPRIMIR_TICKET', 'Permiso para reimprimir comprobantes anteriores (F9)'),
(8, 'CORTE_CAJA', 'Permiso para emitir corte X y cierre Z');

-- 5. Usuarios Iniciales
-- Contraseña Superadmin: SuperAdmin123* (Hash BCrypt verificado)
-- Contraseña Admin y Cajero: Admin123* (Hash BCrypt verificado)
INSERT INTO `usuario` (`id`, `nombre`, `apellido`, `numero_documento`, `telefono`, `email`, `password_hash`, `activo`) VALUES
(1, 'Super', 'Administrador', 'V-00000000', '0412-0000000', 'superadmin@sistema.com', '$2b$12$8LoMvJHIWwsuDE5cKL5AouOsa7xy.5jaPBYdGJNgkQvO92rtu8/Y6', 1),
(2, 'Administrador', 'del Sistema', 'V-00000001', '0412-1111111', 'admin@sistema.com', '$2b$12$1Id56LoBlE1t3fWMn6KiQejde56O5C/usRU8L/135O69AeNHvFI.6', 1),
(3, 'Cajero', 'Principal', 'V-00000002', '0414-2222222', 'cajero@sistema.com', '$2b$12$1Id56LoBlE1t3fWMn6KiQejde56O5C/usRU8L/135O69AeNHvFI.6', 1);

-- 6. Asignación de Roles a Usuarios
INSERT INTO `r_usuario_rol` (`usuario_id`, `rol_id`) VALUES
(1, 1), -- Superadmin -> SUPERADMIN
(2, 2), -- Admin -> ADMINISTRADOR
(3, 4); -- Cajero -> CAJERO

-- 7. Asignación de Módulos por Rol
INSERT INTO `r_modulo_rol` (`id`, `rol_id`, `modulo_id`, `habilitado`) VALUES
-- SUPERADMIN (Todos los módulos habilitados)
(1, 1, 1, 1),
(2, 1, 2, 1),
(3, 1, 3, 1),
(4, 1, 4, 1),
-- ADMINISTRADOR (Todos los módulos habilitados)
(5, 2, 1, 1),
(6, 2, 2, 1),
(7, 2, 3, 1),
(8, 2, 4, 1),
-- CAJERO (Solo Punto de Venta)
(9, 4, 1, 1);

-- 8. Permisos Granulares
-- SUPERADMIN: Obtiene automáticamente TODOS los permisos en TODAS las vistas
INSERT INTO `vistas_permiso` (`r_modulo_rol_id`, `vista_id`, `permiso_id`, `permitido`)
SELECT rmr.id, v.id, p.id, 1
FROM `r_modulo_rol` rmr
JOIN `modulo` m ON m.id = rmr.modulo_id
JOIN `vistas` v ON v.id_modulo = m.id
CROSS JOIN `permisos` p
WHERE rmr.rol_id = 1;

-- CAJERO: Permisos limitados en Terminal POS
INSERT INTO `vistas_permiso` (`r_modulo_rol_id`, `vista_id`, `permiso_id`, `permitido`) VALUES
(9, 1, 1, 1), -- Acceso a /pos
(9, 1, 2, 1), -- Registrar venta (F10)
(9, 1, 4, 1), -- Eliminar ítem (F4)
(9, 1, 3, 0), -- Anular venta (F3) => RESTRINGIDO
(9, 1, 5, 0), -- Modificar precio => RESTRINGIDO
(9, 1, 6, 0); -- Aplicar descuento => RESTRINGIDO
