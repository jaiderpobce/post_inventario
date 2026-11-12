-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db-mariadb:3306
-- Tiempo de generación: 12-11-2026 a las 18:38:44
-- Versión del servidor: 10.11.16-MariaDB-ubu2204
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventario`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `almacen`
--

CREATE TABLE `almacen` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `almacen`
--

INSERT INTO `almacen` (`id`, `nombre`, `ubicacion`, `estado`) VALUES
(3, 'Almacen Principal', NULL, 'ACTIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja`
--

CREATE TABLE `caja` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` enum('ABIERTA','CERRADA','INACTIVA') DEFAULT 'CERRADA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `estado`) VALUES
(11, 'Alimentos', 'ACTIVO'),
(12, 'Bebidas', 'ACTIVO'),
(13, 'Carnicería y Pollería', 'ACTIVO'),
(14, 'Charcutería y Quesos', 'ACTIVO'),
(15, 'Cuidado Personal', 'ACTIVO'),
(16, 'Frutas y Verduras', 'ACTIVO'),
(17, 'Limpieza y Hogar', 'ACTIVO'),
(18, 'Lácteos y Refrigerados', 'ACTIVO'),
(19, 'Panadería y Repostería', 'ACTIVO'),
(20, 'Snacks y Golosinas', 'ACTIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `numero_documento` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `tipo_cliente` varchar(50) DEFAULT 'Consumidor Final',
  `limite_credito` decimal(12,2) DEFAULT 0.00,
  `estado` enum('ACTIVO','SUSPENDIDO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compra`
--

CREATE TABLE `compra` (
  `id` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `fecha_compra` datetime DEFAULT current_timestamp(),
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `n_factura` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_compra`
--

CREATE TABLE `detalle_compra` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pago`
--

CREATE TABLE `detalle_pago` (
  `id` int(11) NOT NULL,
  `id_metodo_pago` int(11) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medidas`
--

CREATE TABLE `medidas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `abreviatura` varchar(10) NOT NULL,
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medidas`
--

INSERT INTO `medidas` (`id`, `nombre`, `abreviatura`, `estado`) VALUES
(4, 'Litro', 'L', 'ACTIVO'),
(5, 'Kilogramo', 'kg', 'ACTIVO'),
(6, 'Litro', 'L', 'ACTIVO'),
(7, 'Kilogramo', 'kg', 'ACTIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodo_pago`
--

CREATE TABLE `metodo_pago` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_productos`
--

CREATE TABLE `movimientos_productos` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `tipo_movimiento` enum('INGRESO','EGRESO','AJUSTE') NOT NULL,
  `cantidad` decimal(12,3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `codigo_interno` varchar(32) DEFAULT NULL,
  `codigo_barra` varchar(13) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `precio_venta` decimal(12,2) NOT NULL DEFAULT 0.00,
  `precio_compra` decimal(12,2) NOT NULL DEFAULT 0.00,
  `imagen` varchar(255) DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `subcategoria` varchar(100) DEFAULT NULL,
  `peso_neto` decimal(10,3) DEFAULT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `unidades_por_bulto` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `aplica_iva` enum('EXENTO','GRAVADO') NOT NULL DEFAULT 'GRAVADO',
  `porcentaje_iva` decimal(5,2) NOT NULL DEFAULT 16.00,
  `stock_minimo` decimal(12,3) NOT NULL DEFAULT 0.000,
  `id_medida` int(11) DEFAULT NULL,
  `id_proveedor` int(11) DEFAULT NULL,
  `registro_sanitario` varchar(100) DEFAULT NULL,
  `es_pesable_balanza` tinyint(1) NOT NULL DEFAULT 0,
  `estado` enum('ACTIVO','SUSPENDIDO','INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo_interno`, `codigo_barra`, `nombre`, `marca`, `precio_venta`, `precio_compra`, `imagen`, `id_categoria`, `subcategoria`, `peso_neto`, `presentacion`, `unidades_por_bulto`, `aplica_iva`, `porcentaje_iva`, `stock_minimo`, `id_medida`, `id_proveedor`, `registro_sanitario`, `es_pesable_balanza`, `estado`) VALUES
(2, 'PROD-0001', '7591001000115', 'Harina de Maíz Precocida Blanca P.A.N. 1 kg', 'Alimentos Polar', 1.15, 0.95, NULL, 11, 'Harinas y Cereales', 1.000, 'Paquete', 20, 'EXENTO', 0.00, 50.000, 7, 44, 'CPE040559821', 0, 'ACTIVO'),
(3, 'PROD-0002', '7591001000221', 'Harina de Maíz Precocida Amarilla P.A.N. 1 kg', 'Alimentos Polar', 1.20, 0.98, NULL, 11, 'Harinas y Cereales', 1.000, 'Paquete', 20, 'EXENTO', 0.00, 30.000, 7, 35, 'CPE040559822', 0, 'ACTIVO'),
(4, 'PROD-0003', '7591002001050', 'Arroz Blanco de Mesa Tipo I Primor 1 kg', 'Primor', 1.30, 1.05, NULL, 11, 'Granos y Arroz', 1.000, 'Paquete', 24, 'EXENTO', 0.00, 40.000, 7, 35, 'CPE060711245', 0, 'ACTIVO'),
(5, 'PROD-0004', '7591002001081', 'Arroz Blanco Mary Tradicional 1 kg', 'Mary', 1.25, 1.02, NULL, 11, 'Granos y Arroz', 1.000, 'Paquete', 24, 'EXENTO', 0.00, 40.000, 7, 34, 'CPE030894120', 0, 'ACTIVO'),
(6, 'PROD-0005', '7591003004126', 'Pasta Larga Espagueti Primor 1 kg', 'Primor', 1.45, 1.15, NULL, 11, 'Pastas Alimenticias', 1.000, 'Paquete', 12, 'EXENTO', 0.00, 30.000, 7, 35, 'CPE080944510', 0, 'ACTIVO'),
(7, 'PROD-0006', '7591003005185', 'Pasta Corta Plumitas Capri 1 kg', 'Capri', 1.38, 1.10, NULL, 11, 'Pastas Alimenticias', 1.000, 'Paquete', 12, 'EXENTO', 0.00, 25.000, 7, 59, 'CPE021055890', 0, 'ACTIVO'),
(8, 'PROD-0007', '7591004002108', 'Aceite Vegetal Comestible Mazeite 1 L', 'Mazeite', 2.85, 2.35, NULL, 11, 'Aceites y Grasas', 1.000, 'Botella', 12, 'EXENTO', 0.00, 20.000, 6, 35, 'CPE050477123', 0, 'ACTIVO'),
(9, 'PROD-0008', '7591004003150', 'Aceite de Soya Vatel 1 L', 'Vatel', 2.55, 2.10, NULL, 11, 'Aceites y Grasas', 1.000, 'Botella', 12, 'EXENTO', 0.00, 25.000, 6, 41, 'CPE070588211', 0, 'ACTIVO'),
(10, 'PROD-0009', '7591005001129', 'Azúcar Refinada Montalbán 1 kg', 'Montalbán', 1.40, 1.12, NULL, 11, 'Azúcar y Endulzantes', 1.000, 'Paquete', 20, 'EXENTO', 0.00, 35.000, 7, 42, 'CPE010622340', 0, 'ACTIVO'),
(11, 'PROD-0010', '7591006008101', 'Caraotas Negras Pantera 500 g', 'Pantera', 1.55, 1.25, NULL, 11, 'Granos y Legumbres', 0.500, 'Bolsa', 24, 'EXENTO', 0.00, 20.000, 7, 49, 'CPE091123980', 0, 'ACTIVO'),
(12, 'PROD-0011', '7591007001014', 'Café Molido Fama de América 500 g', 'Fama de América', 4.20, 3.40, NULL, 11, 'Café y Té', 0.500, 'Paquete', 20, 'EXENTO', 0.00, 20.000, 7, 39, 'CPE040311900', 0, 'ACTIVO'),
(13, 'PROD-0012', '7591007002059', 'Café Molido Madrid 250 g', 'Café Madrid', 2.15, 1.75, NULL, 11, 'Café y Té', 0.250, 'Paquete', 24, 'EXENTO', 0.00, 25.000, 7, 40, 'CPE050819334', 0, 'ACTIVO'),
(14, 'PROD-0013', '7591008003105', 'Salsa de Tomate Ketchup Heinz 397 g', 'Heinz', 2.35, 1.85, NULL, 11, 'Salsas y Condimentos', 0.397, 'Frasco', 12, 'GRAVADO', 16.00, 15.000, 7, 33, 'CPE020455612', 0, 'ACTIVO'),
(15, 'PROD-0014', '7591008004126', 'Mayonesa Mavesa 445 g', 'Mavesa', 2.95, 2.40, NULL, 11, 'Salsas y Condimentos', 0.445, 'Frasco', 12, 'EXENTO', 0.00, 20.000, 7, 35, 'CPE060988741', 0, 'ACTIVO'),
(16, 'PROD-0015', '7591009001156', 'Atún en Aceite Margarita 140 g', 'Margarita', 1.70, 1.35, NULL, 11, 'Enlatados y Conservas', 0.140, 'Lata', 24, 'EXENTO', 0.00, 30.000, 7, 35, 'CPE030741258', 0, 'ACTIVO'),
(17, 'PROD-0016', '7591009002184', 'Sardinas en Salsa de Tomate Margarita 170 g', 'Margarita', 1.10, 0.85, NULL, 11, 'Enlatados y Conservas', 0.170, 'Lata', 24, 'EXENTO', 0.00, 30.000, 7, 35, 'CPE030741260', 0, 'ACTIVO'),
(18, 'PROD-0017', '7591010001053', 'Diablitos Underwood Original 110 g', 'Underwood', 1.85, 1.45, NULL, 11, 'Enlatados y Conservas', 0.110, 'Lata', 24, 'GRAVADO', 16.00, 20.000, 7, 52, 'CPE010299874', 0, 'ACTIVO'),
(19, 'PROD-0018', '7591011005104', 'Sal Refinada Bahía 1 kg', 'Bahía', 0.65, 0.45, NULL, 11, 'Condimentos y Especias', 1.000, 'Bolsa', 20, 'EXENTO', 0.00, 35.000, 7, 64, 'CPE080112233', 0, 'ACTIVO'),
(20, 'PROD-0019', '7591012001013', 'Margarina Mavesa 500 g', 'Mavesa', 2.25, 1.80, NULL, 18, 'Margarinas y Mantequillas', 0.500, 'Envase Plástico', 12, 'EXENTO', 0.00, 25.000, 7, 35, 'CPE040654321', 0, 'ACTIVO'),
(21, 'PROD-0020', '7591012002058', 'Leche en Polvo Completa La Campiña 900 g', 'La Campiña', 6.95, 5.80, NULL, 18, 'Leches', 0.900, 'Bolsa', 12, 'EXENTO', 0.00, 15.000, 7, 57, 'CPE070321654', 0, 'ACTIVO'),
(22, 'PROD-0021', '7591012003109', 'Leche Líquida Completa UHT Los Andes 1 L', 'Lácteos Los Andes', 1.65, 1.30, NULL, 18, 'Leches', 1.000, 'Cartón Tetra Pak', 12, 'EXENTO', 0.00, 24.000, 6, 55, 'CPE090456123', 0, 'ACTIVO'),
(23, 'PROD-0022', '7591012004151', 'Queso Fundido Rikesa Cheddar 200 g', 'Rikesa', 2.75, 2.20, NULL, 18, 'Quesos y Untables', 0.200, 'Frasco', 12, 'GRAVADO', 16.00, 15.000, 7, 35, 'CPE050789456', 0, 'ACTIVO'),
(24, 'PROD-0023', '7591012005202', 'Yogurt Fresa Migurt 150 g', 'Migurt', 0.99, 0.75, NULL, 18, 'Yogures', 0.150, 'Vaso', 12, 'GRAVADO', 16.00, 20.000, 7, 35, 'CPE110234890', 0, 'ACTIVO'),
(25, 'PROD-0024', '2000101000001', 'Queso Blanco Duro Llanero (Por Kilo)', 'Producción Nacional', 6.20, 4.80, NULL, 14, 'Quesos Nacionales', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 10.000, 7, 48, 'CPE060111999', 1, 'ACTIVO'),
(26, 'PROD-0025', '2000102000008', 'Jamón de Pierna Plumrose (Por Kilo)', 'Plumrose', 8.95, 6.90, NULL, 14, 'Embutidos', 1.000, 'Granel / Pesable', 1, 'GRAVADO', 16.00, 8.000, 7, 61, 'CPE030555444', 1, 'ACTIVO'),
(27, 'PROD-0026', '7591013001104', 'Salchichas de Pollo Oscar Mayer 220 g', 'Oscar Mayer', 1.55, 1.20, NULL, 14, 'Salchichas', 0.220, 'Paquete', 20, 'GRAVADO', 16.00, 20.000, 7, 61, 'CPE040888777', 0, 'ACTIVO'),
(28, 'PROD-0027', '2000201000000', 'Pechuga de Pollo Entera (Por Kilo)', 'Protinal / Proagro', 4.50, 3.60, NULL, 13, 'Aves', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 15.000, 7, 37, 'CPE080333222', 1, 'ACTIVO'),
(29, 'PROD-0028', '2000202000007', 'Carne Molida de Res Primera (Por Kilo)', 'Frigorífico Nacional', 6.80, 5.40, NULL, 13, 'Carnes de Res', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 10.000, 7, 50, 'CPE090222111', 1, 'ACTIVO'),
(30, 'PROD-0029', '2000301000009', 'Plátano Maduro (Por Kilo)', 'Agropecuaria Nacional', 1.05, 0.70, NULL, 16, 'Plátanos y Tubérculos', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 20.000, 7, 51, NULL, 1, 'ACTIVO'),
(31, 'PROD-0030', '2000302000006', 'Tomate Perita Fresco (Por Kilo)', 'Agropecuaria Nacional', 1.35, 0.90, NULL, 16, 'Hortalizas', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 15.000, 7, 63, NULL, 1, 'ACTIVO'),
(32, 'PROD-0031', '2000303000003', 'Cebolla Blanca (Por Kilo)', 'Agropecuaria Nacional', 1.25, 0.85, NULL, 16, 'Hortalizas', 1.000, 'Granel / Pesable', 1, 'EXENTO', 0.00, 15.000, 7, 63, NULL, 1, 'ACTIVO'),
(33, 'PROD-0032', '7591014001059', 'Pan de Sándwich Blanco Bimbo Grande 600 g', 'Bimbo', 2.30, 1.85, NULL, 19, 'Panes Empacados', 0.600, 'Bolsa', 10, 'EXENTO', 0.00, 12.000, 7, 38, 'CPE040912345', 0, 'ACTIVO'),
(34, 'PROD-0033', '7591015002017', 'Galletas María Puig Paquete Familiar 310 g', 'Puig', 1.50, 1.15, NULL, 20, 'Galletas', 0.310, 'Paquete', 18, 'GRAVADO', 16.00, 25.000, 7, 53, 'CPE010765432', 0, 'ACTIVO'),
(35, 'PROD-0034', '7591015003083', 'Galletas Oreo Vainilla Tubo 108 g', 'Oreo', 1.05, 0.80, NULL, 20, 'Galletas', 0.108, 'Paquete', 24, 'GRAVADO', 16.00, 30.000, 7, 56, 'CPE050432198', 0, 'ACTIVO'),
(36, 'PROD-0035', '7591015004127', 'Chocolate con Leche Savoy 130 g', 'Savoy', 2.15, 1.65, NULL, 20, 'Chocolates', 0.130, 'Tableta', 20, 'GRAVADO', 16.00, 20.000, 7, 57, 'CPE020678912', 0, 'ACTIVO'),
(37, 'PROD-0036', '7591015005193', 'Pasapalos Pepito Queso 140 g', 'Frito-Lay / PepsiCo', 1.70, 1.30, NULL, 20, 'Snacks Salados', 0.140, 'Bolsa', 15, 'GRAVADO', 16.00, 15.000, 7, 36, 'CPE060543210', 0, 'ACTIVO'),
(38, 'PROD-0037', '7591016001019', 'Refresco Maltín Polar Botella Retornable / PET 1.5 L', 'Maltín Polar', 1.75, 1.35, NULL, 12, 'Maltas', 1.500, 'Botella', 6, 'GRAVADO', 16.00, 24.000, 6, 43, 'CPE030987654', 0, 'ACTIVO'),
(39, 'PROD-0038', '7591016002054', 'Refresco Pepsi-Cola 2 L', 'Pepsi', 1.80, 1.40, NULL, 12, 'Refrescos y Gaseosas', 2.000, 'Botella', 6, 'GRAVADO', 16.00, 30.000, 6, 60, 'CPE040123987', 0, 'ACTIVO'),
(40, 'PROD-0039', '7591016003105', 'Refresco Frescolita 2 L', 'Frescolita', 1.85, 1.45, NULL, 12, 'Refrescos y Gaseosas', 2.000, 'Botella', 6, 'GRAVADO', 16.00, 20.000, 6, 46, 'CPE050654789', 0, 'ACTIVO'),
(41, 'PROD-0040', '7591016004157', 'Agua Mineral Minalba 1.5 L', 'Minalba', 0.90, 0.65, NULL, 12, 'Aguas', 1.500, 'Botella', 6, 'EXENTO', 0.00, 36.000, 6, 60, 'CPE010456789', 0, 'ACTIVO'),
(42, 'PROD-0041', '7591016005208', 'Jugo de Naranja Yukery Cartón 1 L', 'Yukery', 1.60, 1.25, NULL, 12, 'Jugos y Néctares', 1.000, 'Cartón Tetra Pak', 12, 'GRAVADO', 16.00, 24.000, 6, 60, 'CPE070852963', 0, 'ACTIVO'),
(43, 'PROD-0042', '7591017001056', 'Detergente en Polvo Las Llaves 1 kg', 'Las Llaves', 2.45, 1.90, NULL, 17, 'Detergentes', 1.000, 'Bolsa', 12, 'GRAVADO', 16.00, 25.000, 7, 35, 'CPE080741963', 0, 'ACTIVO'),
(44, 'PROD-0043', '7591017002107', 'Jabón en Panelas Azul Las Llaves 250 g', 'Las Llaves', 0.80, 0.60, NULL, 17, 'Jabones de Lavar', 0.250, 'Barra', 36, 'GRAVADO', 16.00, 36.000, 7, 35, 'CPE080741965', 0, 'ACTIVO'),
(45, 'PROD-0044', '7591017003159', 'Cloro Blanqueador Nevex 1 L', 'Nevex', 1.15, 0.85, NULL, 17, 'Desinfectantes y Cloro', 1.000, 'Botella', 12, 'GRAVADO', 16.00, 24.000, 6, 45, 'CPE020369258', 0, 'ACTIVO'),
(46, 'PROD-0045', '7591017004200', 'Lavaplatos en Crema Axion Limón 450 g', 'Axion', 1.75, 1.35, NULL, 17, 'Lavaplatos', 0.450, 'Envase Plástico', 12, 'GRAVADO', 16.00, 20.000, 7, 47, 'CPE090147258', 0, 'ACTIVO'),
(47, 'PROD-0046', '7591018001055', 'Papel Higiénico Rosal Plus 4 Rollos', 'Rosal', 2.00, 1.55, NULL, 15, 'Papel Higiénico', 0.480, 'Paquete 4 und', 12, 'GRAVADO', 16.00, 30.000, 7, 58, 'CPE030258147', 0, 'ACTIVO'),
(48, 'PROD-0047', '7591018002106', 'Crema Dental Colgate Triple Acción 90 ml', 'Colgate', 1.85, 1.40, NULL, 15, 'Higiene Bucal', 0.090, 'Tubo', 24, 'GRAVADO', 16.00, 25.000, 6, 47, 'CPE040951753', 0, 'ACTIVO'),
(49, 'PROD-0048', '7591018003158', 'Jabón de Tocador Protex Avena 110 g', 'Protex', 1.15, 0.85, NULL, 15, 'Jabones de Baño', 0.110, 'Barra', 36, 'GRAVADO', 16.00, 30.000, 7, 47, 'CPE040951760', 0, 'ACTIVO'),
(50, 'PROD-0049', '7591018004209', 'Champú Head & Shoulders Limpieza Renovadora 375 ml', 'Head & Shoulders', 4.90, 3.80, NULL, 15, 'Cuidado Capilar', 0.375, 'Frasco', 12, 'GRAVADO', 16.00, 15.000, 6, 62, 'CPE070357159', 0, 'ACTIVO'),
(51, 'PROD-0050', '7591018005251', 'Desodorante Roll-On Mum Bolita 50 ml', 'Mum', 1.65, 1.25, NULL, 15, 'Desodorantes', 0.050, 'Envase Roll-On', 24, 'GRAVADO', 16.00, 20.000, 6, 54, 'CPE050159357', 0, 'ACTIVO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `numero_documento` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedor`
--

INSERT INTO `proveedor` (`id`, `nombre`, `numero_documento`, `telefono`, `correo`, `direccion`) VALUES
(33, 'Alimentos Heinz', NULL, NULL, NULL, NULL),
(34, 'Alimentos Mary Iancarina', NULL, NULL, NULL, NULL),
(35, 'Alimentos Polar', NULL, NULL, NULL, NULL),
(36, 'Alimentos Polar / PepsiCo', NULL, NULL, NULL, NULL),
(37, 'Avícola La Guásima', NULL, NULL, NULL, NULL),
(38, 'Bimbo de Venezuela', NULL, NULL, NULL, NULL),
(39, 'Café Fama de América', NULL, NULL, NULL, NULL),
(40, 'Café Madrid', NULL, NULL, NULL, NULL),
(41, 'Cargill de Venezuela', NULL, NULL, NULL, NULL),
(42, 'Central El Palmar', NULL, NULL, NULL, NULL),
(43, 'Cervecería Polar', NULL, NULL, NULL, NULL),
(44, 'Cervecería Polar / Alimentos Polar', NULL, NULL, NULL, NULL),
(45, 'Clorox / Corporación', NULL, NULL, NULL, NULL),
(46, 'Coca-Cola FEMSA de Venezuela', NULL, NULL, NULL, NULL),
(47, 'Colgate-Palmolive', NULL, NULL, NULL, NULL),
(48, 'Distribuidora Láctea Zulia', NULL, NULL, NULL, NULL),
(49, 'Empresas Polar', NULL, NULL, NULL, NULL),
(50, 'Frigorífico Industrial', NULL, NULL, NULL, NULL),
(51, 'Fruver Sur del Lago', NULL, NULL, NULL, NULL),
(52, 'General Mills de Venezuela', NULL, NULL, NULL, NULL),
(53, 'Industrias Puig', NULL, NULL, NULL, NULL),
(54, 'Laboratorio Nacional', NULL, NULL, NULL, NULL),
(55, 'Lácteos Los Andes', NULL, NULL, NULL, NULL),
(56, 'Mondelez Venezuela', NULL, NULL, NULL, NULL),
(57, 'Nestlé Venezuela', NULL, NULL, NULL, NULL),
(58, 'Papeles Venezolanos (PAVECA)', NULL, NULL, NULL, NULL),
(59, 'Pastas Capri', NULL, NULL, NULL, NULL),
(60, 'Pepsi-Cola Venezuela', NULL, NULL, NULL, NULL),
(61, 'Plumrose Latinoamericana', NULL, NULL, NULL, NULL),
(62, 'Procter & Gamble', NULL, NULL, NULL, NULL),
(63, 'Productores Andinos', NULL, NULL, NULL, NULL),
(64, 'Salinas de Araya', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock`
--

CREATE TABLE `stock` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_almacen` int(11) NOT NULL,
  `cantidad` decimal(12,3) NOT NULL DEFAULT 0.000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `stock`
--

INSERT INTO `stock` (`id`, `id_producto`, `id_almacen`, `cantidad`) VALUES
(2, 2, 3, 250.000),
(3, 3, 3, 140.000),
(4, 4, 3, 180.000),
(5, 5, 3, 200.000),
(6, 6, 3, 150.000),
(7, 7, 3, 110.000),
(8, 8, 3, 95.000),
(9, 9, 3, 120.000),
(10, 10, 3, 160.000),
(11, 11, 3, 85.000),
(12, 12, 3, 90.000),
(13, 13, 3, 110.000),
(14, 14, 3, 75.000),
(15, 15, 3, 105.000),
(16, 16, 3, 130.000),
(17, 17, 3, 145.000),
(18, 18, 3, 90.000),
(19, 19, 3, 175.000),
(20, 20, 3, 115.000),
(21, 21, 3, 70.000),
(22, 22, 3, 96.000),
(23, 23, 3, 65.000),
(24, 24, 3, 80.000),
(25, 25, 3, 45.500),
(26, 26, 3, 32.000),
(27, 27, 3, 90.000),
(28, 28, 3, 60.000),
(29, 29, 3, 40.000),
(30, 30, 3, 85.000),
(31, 31, 3, 55.000),
(32, 32, 3, 65.000),
(33, 33, 3, 50.000),
(34, 34, 3, 110.000),
(35, 35, 3, 140.000),
(36, 36, 3, 85.000),
(37, 37, 3, 70.000),
(38, 38, 3, 120.000),
(39, 39, 3, 130.000),
(40, 40, 3, 95.000),
(41, 41, 3, 180.000),
(42, 42, 3, 100.000),
(43, 43, 3, 115.000),
(44, 44, 3, 160.000),
(45, 45, 3, 135.000),
(46, 46, 3, 90.000),
(47, 47, 3, 150.000),
(48, 48, 3, 120.000),
(49, 49, 3, 140.000),
(50, 50, 3, 65.000),
(51, 51, 3, 95.000);


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `fecha_venta` datetime DEFAULT current_timestamp(),
  `n_factura` varchar(50) DEFAULT NULL,
  `monto_subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_descuento` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_iva` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tasa_iva` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `id_metodo_pago` int(11) DEFAULT NULL,
  `estado` enum('COMPLETADA','PENDIENTE','CANCELADA') DEFAULT 'COMPLETADA',
  `id_user` int(11) NOT NULL,
  `id_caja` int(11) NOT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `almacen`
--
ALTER TABLE `almacen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_almacen_nombre` (`nombre`);

--
-- Indices de la tabla `caja`
--
ALTER TABLE `caja`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `compra`
--
ALTER TABLE `compra`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_compra_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `detalle_compra`
--
ALTER TABLE `detalle_compra`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_detcompra_producto` (`id_producto`),
  ADD KEY `fk_detcompra_compra` (`id_compra`);

--
-- Indices de la tabla `detalle_pago`
--
ALTER TABLE `detalle_pago`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_detpago_metodo_pago` (`id_metodo_pago`);

--
-- Indices de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_detventa_producto` (`id_producto`),
  ADD KEY `fk_detventa_venta` (`id_venta`);

--
-- Indices de la tabla `medidas`
--
ALTER TABLE `medidas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `metodo_pago`
--
ALTER TABLE `metodo_pago`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `movimientos_productos`
--
ALTER TABLE `movimientos_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mov_producto` (`id_producto`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_productos_codigo_interno` (`codigo_interno`),
  ADD UNIQUE KEY `uq_productos_codigo_barra` (`codigo_barra`),
  ADD KEY `fk_productos_categoria` (`id_categoria`),
  ADD KEY `fk_productos_medida` (`id_medida`),
  ADD KEY `ix_productos_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_proveedor_nombre` (`nombre`);

--
-- Indices de la tabla `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stock_producto_almacen` (`id_producto`,`id_almacen`),
  ADD KEY `fk_stock_almacen` (`id_almacen`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_venta_cliente` (`id_cliente`),
  ADD KEY `fk_venta_metodo_pago` (`id_metodo_pago`),
  ADD KEY `idx_venta_id_user` (`id_user`),
  ADD KEY `fk_venta_caja` (`id_caja`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `almacen`
--
ALTER TABLE `almacen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `caja`
--
ALTER TABLE `caja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compra`
--
ALTER TABLE `compra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_compra`
--
ALTER TABLE `detalle_compra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_pago`
--
ALTER TABLE `detalle_pago`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `medidas`
--
ALTER TABLE `medidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `metodo_pago`
--
ALTER TABLE `metodo_pago`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `movimientos_productos`
--
ALTER TABLE `movimientos_productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT de la tabla `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `compra`
--
ALTER TABLE `compra`
  ADD CONSTRAINT `fk_compra_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_compra`
--
ALTER TABLE `detalle_compra`
  ADD CONSTRAINT `fk_detcompra_compra` FOREIGN KEY (`id_compra`) REFERENCES `compra` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detcompra_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_pago`
--
ALTER TABLE `detalle_pago`
  ADD CONSTRAINT `fk_detpago_metodo_pago` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodo_pago` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `fk_detventa_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detventa_venta` FOREIGN KEY (`id_venta`) REFERENCES `venta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `movimientos_productos`
--
ALTER TABLE `movimientos_productos`
  ADD CONSTRAINT `fk_mov_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productos_medida` FOREIGN KEY (`id_medida`) REFERENCES `medidas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productos_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `fk_stock_almacen` FOREIGN KEY (`id_almacen`) REFERENCES `almacen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_caja` FOREIGN KEY (`id_caja`) REFERENCES `caja` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_metodo_pago` FOREIGN KEY (`id_metodo_pago`) REFERENCES `metodo_pago` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
