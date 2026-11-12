-- Importacion idempotente de bd_forma/catalogo_productos.csv.
-- Ejecutar despues de migracion_catalogo_productos.sql.
USE inventario;
START TRANSACTION;

INSERT INTO categorias (nombre) VALUES
    ('Alimentos'),
    ('Bebidas'),
    ('Carnicería y Pollería'),
    ('Charcutería y Quesos'),
    ('Cuidado Personal'),
    ('Frutas y Verduras'),
    ('Limpieza y Hogar'),
    ('Lácteos y Refrigerados'),
    ('Panadería y Repostería'),
    ('Snacks y Golosinas')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO proveedor (nombre) VALUES
    ('Alimentos Heinz'),
    ('Alimentos Mary Iancarina'),
    ('Alimentos Polar'),
    ('Alimentos Polar / PepsiCo'),
    ('Avícola La Guásima'),
    ('Bimbo de Venezuela'),
    ('Café Fama de América'),
    ('Café Madrid'),
    ('Cargill de Venezuela'),
    ('Central El Palmar'),
    ('Cervecería Polar'),
    ('Cervecería Polar / Alimentos Polar'),
    ('Clorox / Corporación'),
    ('Coca-Cola FEMSA de Venezuela'),
    ('Colgate-Palmolive'),
    ('Distribuidora Láctea Zulia'),
    ('Empresas Polar'),
    ('Frigorífico Industrial'),
    ('Fruver Sur del Lago'),
    ('General Mills de Venezuela'),
    ('Industrias Puig'),
    ('Laboratorio Nacional'),
    ('Lácteos Los Andes'),
    ('Mondelez Venezuela'),
    ('Nestlé Venezuela'),
    ('Papeles Venezolanos (PAVECA)'),
    ('Pastas Capri'),
    ('Pepsi-Cola Venezuela'),
    ('Plumrose Latinoamericana'),
    ('Procter & Gamble'),
    ('Productores Andinos'),
    ('Salinas de Araya')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO medidas (nombre, abreviatura, estado) VALUES
    ('Litro', 'L', 'ACTIVO'),
    ('Kilogramo', 'kg', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado);

INSERT INTO almacen (nombre, ubicacion, estado) VALUES ('Almacen Principal', NULL, 'ACTIVO')
ON DUPLICATE KEY UPDATE estado = VALUES(estado);

INSERT INTO productos (
    codigo_interno, codigo_barra, nombre, marca, precio_venta, precio_compra,
    id_categoria, subcategoria, peso_neto, presentacion, unidades_por_bulto,
    aplica_iva, porcentaje_iva, stock_minimo, id_medida, id_proveedor,
    registro_sanitario, es_pesable_balanza, estado
)
SELECT
    c.codigo_interno, c.codigo_barra, c.nombre, c.marca, c.precio_venta, c.precio_compra,
    cat.id, c.subcategoria, c.peso_neto, c.presentacion, c.unidades_por_bulto,
    c.aplica_iva, c.porcentaje_iva, c.stock_minimo, med.id, prov.id,
    NULLIF(c.registro_sanitario, 'N/A'), c.es_pesable_balanza, c.estado
FROM (
    SELECT 'PROD-0001' AS codigo_interno, '7591001000115' AS codigo_barra, 'Harina de Maíz Precocida Blanca P.A.N. 1 kg' AS nombre, 'Alimentos Polar' AS marca, 1.15 AS precio_venta, 0.95 AS precio_compra, 'Alimentos' AS categoria, 'Harinas y Cereales' AS subcategoria, 1.0 AS peso_neto, 'Paquete' AS presentacion, 20 AS unidades_por_bulto, 'EXENTO' AS aplica_iva, 0.0 AS porcentaje_iva, 50.0 AS stock_minimo, 'kg' AS unidad_medida, 'Cervecería Polar / Alimentos Polar' AS proveedor, 'CPE040559821' AS registro_sanitario, FALSE AS es_pesable_balanza, 'ACTIVO' AS estado
    UNION ALL SELECT 'PROD-0002', '7591001000221', 'Harina de Maíz Precocida Amarilla P.A.N. 1 kg', 'Alimentos Polar', 1.2, 0.98, 'Alimentos', 'Harinas y Cereales', 1.0, 'Paquete', 20, 'EXENTO', 0.0, 30.0, 'kg', 'Alimentos Polar', 'CPE040559822', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0003', '7591002001050', 'Arroz Blanco de Mesa Tipo I Primor 1 kg', 'Primor', 1.3, 1.05, 'Alimentos', 'Granos y Arroz', 1.0, 'Paquete', 24, 'EXENTO', 0.0, 40.0, 'kg', 'Alimentos Polar', 'CPE060711245', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0004', '7591002001081', 'Arroz Blanco Mary Tradicional 1 kg', 'Mary', 1.25, 1.02, 'Alimentos', 'Granos y Arroz', 1.0, 'Paquete', 24, 'EXENTO', 0.0, 40.0, 'kg', 'Alimentos Mary Iancarina', 'CPE030894120', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0005', '7591003004126', 'Pasta Larga Espagueti Primor 1 kg', 'Primor', 1.45, 1.15, 'Alimentos', 'Pastas Alimenticias', 1.0, 'Paquete', 12, 'EXENTO', 0.0, 30.0, 'kg', 'Alimentos Polar', 'CPE080944510', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0006', '7591003005185', 'Pasta Corta Plumitas Capri 1 kg', 'Capri', 1.38, 1.1, 'Alimentos', 'Pastas Alimenticias', 1.0, 'Paquete', 12, 'EXENTO', 0.0, 25.0, 'kg', 'Pastas Capri', 'CPE021055890', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0007', '7591004002108', 'Aceite Vegetal Comestible Mazeite 1 L', 'Mazeite', 2.85, 2.35, 'Alimentos', 'Aceites y Grasas', 1.0, 'Botella', 12, 'EXENTO', 0.0, 20.0, 'L', 'Alimentos Polar', 'CPE050477123', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0008', '7591004003150', 'Aceite de Soya Vatel 1 L', 'Vatel', 2.55, 2.1, 'Alimentos', 'Aceites y Grasas', 1.0, 'Botella', 12, 'EXENTO', 0.0, 25.0, 'L', 'Cargill de Venezuela', 'CPE070588211', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0009', '7591005001129', 'Azúcar Refinada Montalbán 1 kg', 'Montalbán', 1.4, 1.12, 'Alimentos', 'Azúcar y Endulzantes', 1.0, 'Paquete', 20, 'EXENTO', 0.0, 35.0, 'kg', 'Central El Palmar', 'CPE010622340', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0010', '7591006008101', 'Caraotas Negras Pantera 500 g', 'Pantera', 1.55, 1.25, 'Alimentos', 'Granos y Legumbres', 0.5, 'Bolsa', 24, 'EXENTO', 0.0, 20.0, 'kg', 'Empresas Polar', 'CPE091123980', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0011', '7591007001014', 'Café Molido Fama de América 500 g', 'Fama de América', 4.2, 3.4, 'Alimentos', 'Café y Té', 0.5, 'Paquete', 20, 'EXENTO', 0.0, 20.0, 'kg', 'Café Fama de América', 'CPE040311900', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0012', '7591007002059', 'Café Molido Madrid 250 g', 'Café Madrid', 2.15, 1.75, 'Alimentos', 'Café y Té', 0.25, 'Paquete', 24, 'EXENTO', 0.0, 25.0, 'kg', 'Café Madrid', 'CPE050819334', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0013', '7591008003105', 'Salsa de Tomate Ketchup Heinz 397 g', 'Heinz', 2.35, 1.85, 'Alimentos', 'Salsas y Condimentos', 0.397, 'Frasco', 12, 'GRAVADO', 16.0, 15.0, 'kg', 'Alimentos Heinz', 'CPE020455612', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0014', '7591008004126', 'Mayonesa Mavesa 445 g', 'Mavesa', 2.95, 2.4, 'Alimentos', 'Salsas y Condimentos', 0.445, 'Frasco', 12, 'EXENTO', 0.0, 20.0, 'kg', 'Alimentos Polar', 'CPE060988741', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0015', '7591009001156', 'Atún en Aceite Margarita 140 g', 'Margarita', 1.7, 1.35, 'Alimentos', 'Enlatados y Conservas', 0.14, 'Lata', 24, 'EXENTO', 0.0, 30.0, 'kg', 'Alimentos Polar', 'CPE030741258', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0016', '7591009002184', 'Sardinas en Salsa de Tomate Margarita 170 g', 'Margarita', 1.1, 0.85, 'Alimentos', 'Enlatados y Conservas', 0.17, 'Lata', 24, 'EXENTO', 0.0, 30.0, 'kg', 'Alimentos Polar', 'CPE030741260', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0017', '7591010001053', 'Diablitos Underwood Original 110 g', 'Underwood', 1.85, 1.45, 'Alimentos', 'Enlatados y Conservas', 0.11, 'Lata', 24, 'GRAVADO', 16.0, 20.0, 'kg', 'General Mills de Venezuela', 'CPE010299874', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0018', '7591011005104', 'Sal Refinada Bahía 1 kg', 'Bahía', 0.65, 0.45, 'Alimentos', 'Condimentos y Especias', 1.0, 'Bolsa', 20, 'EXENTO', 0.0, 35.0, 'kg', 'Salinas de Araya', 'CPE080112233', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0019', '7591012001013', 'Margarina Mavesa 500 g', 'Mavesa', 2.25, 1.8, 'Lácteos y Refrigerados', 'Margarinas y Mantequillas', 0.5, 'Envase Plástico', 12, 'EXENTO', 0.0, 25.0, 'kg', 'Alimentos Polar', 'CPE040654321', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0020', '7591012002058', 'Leche en Polvo Completa La Campiña 900 g', 'La Campiña', 6.95, 5.8, 'Lácteos y Refrigerados', 'Leches', 0.9, 'Bolsa', 12, 'EXENTO', 0.0, 15.0, 'kg', 'Nestlé Venezuela', 'CPE070321654', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0021', '7591012003109', 'Leche Líquida Completa UHT Los Andes 1 L', 'Lácteos Los Andes', 1.65, 1.3, 'Lácteos y Refrigerados', 'Leches', 1.0, 'Cartón Tetra Pak', 12, 'EXENTO', 0.0, 24.0, 'L', 'Lácteos Los Andes', 'CPE090456123', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0022', '7591012004151', 'Queso Fundido Rikesa Cheddar 200 g', 'Rikesa', 2.75, 2.2, 'Lácteos y Refrigerados', 'Quesos y Untables', 0.2, 'Frasco', 12, 'GRAVADO', 16.0, 15.0, 'kg', 'Alimentos Polar', 'CPE050789456', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0023', '7591012005202', 'Yogurt Fresa Migurt 150 g', 'Migurt', 0.99, 0.75, 'Lácteos y Refrigerados', 'Yogures', 0.15, 'Vaso', 12, 'GRAVADO', 16.0, 20.0, 'kg', 'Alimentos Polar', 'CPE110234890', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0024', '2000101000001', 'Queso Blanco Duro Llanero (Por Kilo)', 'Producción Nacional', 6.2, 4.8, 'Charcutería y Quesos', 'Quesos Nacionales', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 10.0, 'kg', 'Distribuidora Láctea Zulia', 'CPE060111999', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0025', '2000102000008', 'Jamón de Pierna Plumrose (Por Kilo)', 'Plumrose', 8.95, 6.9, 'Charcutería y Quesos', 'Embutidos', 1.0, 'Granel / Pesable', 1, 'GRAVADO', 16.0, 8.0, 'kg', 'Plumrose Latinoamericana', 'CPE030555444', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0026', '7591013001104', 'Salchichas de Pollo Oscar Mayer 220 g', 'Oscar Mayer', 1.55, 1.2, 'Charcutería y Quesos', 'Salchichas', 0.22, 'Paquete', 20, 'GRAVADO', 16.0, 20.0, 'kg', 'Plumrose Latinoamericana', 'CPE040888777', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0027', '2000201000000', 'Pechuga de Pollo Entera (Por Kilo)', 'Protinal / Proagro', 4.5, 3.6, 'Carnicería y Pollería', 'Aves', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 15.0, 'kg', 'Avícola La Guásima', 'CPE080333222', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0028', '2000202000007', 'Carne Molida de Res Primera (Por Kilo)', 'Frigorífico Nacional', 6.8, 5.4, 'Carnicería y Pollería', 'Carnes de Res', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 10.0, 'kg', 'Frigorífico Industrial', 'CPE090222111', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0029', '2000301000009', 'Plátano Maduro (Por Kilo)', 'Agropecuaria Nacional', 1.05, 0.7, 'Frutas y Verduras', 'Plátanos y Tubérculos', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 20.0, 'kg', 'Fruver Sur del Lago', 'N/A', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0030', '2000302000006', 'Tomate Perita Fresco (Por Kilo)', 'Agropecuaria Nacional', 1.35, 0.9, 'Frutas y Verduras', 'Hortalizas', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 15.0, 'kg', 'Productores Andinos', 'N/A', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0031', '2000303000003', 'Cebolla Blanca (Por Kilo)', 'Agropecuaria Nacional', 1.25, 0.85, 'Frutas y Verduras', 'Hortalizas', 1.0, 'Granel / Pesable', 1, 'EXENTO', 0.0, 15.0, 'kg', 'Productores Andinos', 'N/A', TRUE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0032', '7591014001059', 'Pan de Sándwich Blanco Bimbo Grande 600 g', 'Bimbo', 2.3, 1.85, 'Panadería y Repostería', 'Panes Empacados', 0.6, 'Bolsa', 10, 'EXENTO', 0.0, 12.0, 'kg', 'Bimbo de Venezuela', 'CPE040912345', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0033', '7591015002017', 'Galletas María Puig Paquete Familiar 310 g', 'Puig', 1.5, 1.15, 'Snacks y Golosinas', 'Galletas', 0.31, 'Paquete', 18, 'GRAVADO', 16.0, 25.0, 'kg', 'Industrias Puig', 'CPE010765432', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0034', '7591015003083', 'Galletas Oreo Vainilla Tubo 108 g', 'Oreo', 1.05, 0.8, 'Snacks y Golosinas', 'Galletas', 0.108, 'Paquete', 24, 'GRAVADO', 16.0, 30.0, 'kg', 'Mondelez Venezuela', 'CPE050432198', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0035', '7591015004127', 'Chocolate con Leche Savoy 130 g', 'Savoy', 2.15, 1.65, 'Snacks y Golosinas', 'Chocolates', 0.13, 'Tableta', 20, 'GRAVADO', 16.0, 20.0, 'kg', 'Nestlé Venezuela', 'CPE020678912', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0036', '7591015005193', 'Pasapalos Pepito Queso 140 g', 'Frito-Lay / PepsiCo', 1.7, 1.3, 'Snacks y Golosinas', 'Snacks Salados', 0.14, 'Bolsa', 15, 'GRAVADO', 16.0, 15.0, 'kg', 'Alimentos Polar / PepsiCo', 'CPE060543210', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0037', '7591016001019', 'Refresco Maltín Polar Botella Retornable / PET 1.5 L', 'Maltín Polar', 1.75, 1.35, 'Bebidas', 'Maltas', 1.5, 'Botella', 6, 'GRAVADO', 16.0, 24.0, 'L', 'Cervecería Polar', 'CPE030987654', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0038', '7591016002054', 'Refresco Pepsi-Cola 2 L', 'Pepsi', 1.8, 1.4, 'Bebidas', 'Refrescos y Gaseosas', 2.0, 'Botella', 6, 'GRAVADO', 16.0, 30.0, 'L', 'Pepsi-Cola Venezuela', 'CPE040123987', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0039', '7591016003105', 'Refresco Frescolita 2 L', 'Frescolita', 1.85, 1.45, 'Bebidas', 'Refrescos y Gaseosas', 2.0, 'Botella', 6, 'GRAVADO', 16.0, 20.0, 'L', 'Coca-Cola FEMSA de Venezuela', 'CPE050654789', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0040', '7591016004157', 'Agua Mineral Minalba 1.5 L', 'Minalba', 0.9, 0.65, 'Bebidas', 'Aguas', 1.5, 'Botella', 6, 'EXENTO', 0.0, 36.0, 'L', 'Pepsi-Cola Venezuela', 'CPE010456789', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0041', '7591016005208', 'Jugo de Naranja Yukery Cartón 1 L', 'Yukery', 1.6, 1.25, 'Bebidas', 'Jugos y Néctares', 1.0, 'Cartón Tetra Pak', 12, 'GRAVADO', 16.0, 24.0, 'L', 'Pepsi-Cola Venezuela', 'CPE070852963', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0042', '7591017001056', 'Detergente en Polvo Las Llaves 1 kg', 'Las Llaves', 2.45, 1.9, 'Limpieza y Hogar', 'Detergentes', 1.0, 'Bolsa', 12, 'GRAVADO', 16.0, 25.0, 'kg', 'Alimentos Polar', 'CPE080741963', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0043', '7591017002107', 'Jabón en Panelas Azul Las Llaves 250 g', 'Las Llaves', 0.8, 0.6, 'Limpieza y Hogar', 'Jabones de Lavar', 0.25, 'Barra', 36, 'GRAVADO', 16.0, 36.0, 'kg', 'Alimentos Polar', 'CPE080741965', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0044', '7591017003159', 'Cloro Blanqueador Nevex 1 L', 'Nevex', 1.15, 0.85, 'Limpieza y Hogar', 'Desinfectantes y Cloro', 1.0, 'Botella', 12, 'GRAVADO', 16.0, 24.0, 'L', 'Clorox / Corporación', 'CPE020369258', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0045', '7591017004200', 'Lavaplatos en Crema Axion Limón 450 g', 'Axion', 1.75, 1.35, 'Limpieza y Hogar', 'Lavaplatos', 0.45, 'Envase Plástico', 12, 'GRAVADO', 16.0, 20.0, 'kg', 'Colgate-Palmolive', 'CPE090147258', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0046', '7591018001055', 'Papel Higiénico Rosal Plus 4 Rollos', 'Rosal', 2.0, 1.55, 'Cuidado Personal', 'Papel Higiénico', 0.48, 'Paquete 4 und', 12, 'GRAVADO', 16.0, 30.0, 'kg', 'Papeles Venezolanos (PAVECA)', 'CPE030258147', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0047', '7591018002106', 'Crema Dental Colgate Triple Acción 90 ml', 'Colgate', 1.85, 1.4, 'Cuidado Personal', 'Higiene Bucal', 0.09, 'Tubo', 24, 'GRAVADO', 16.0, 25.0, 'L', 'Colgate-Palmolive', 'CPE040951753', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0048', '7591018003158', 'Jabón de Tocador Protex Avena 110 g', 'Protex', 1.15, 0.85, 'Cuidado Personal', 'Jabones de Baño', 0.11, 'Barra', 36, 'GRAVADO', 16.0, 30.0, 'kg', 'Colgate-Palmolive', 'CPE040951760', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0049', '7591018004209', 'Champú Head & Shoulders Limpieza Renovadora 375 ml', 'Head & Shoulders', 4.9, 3.8, 'Cuidado Personal', 'Cuidado Capilar', 0.375, 'Frasco', 12, 'GRAVADO', 16.0, 15.0, 'L', 'Procter & Gamble', 'CPE070357159', FALSE, 'ACTIVO'
    UNION ALL SELECT 'PROD-0050', '7591018005251', 'Desodorante Roll-On Mum Bolita 50 ml', 'Mum', 1.65, 1.25, 'Cuidado Personal', 'Desodorantes', 0.05, 'Envase Roll-On', 24, 'GRAVADO', 16.0, 20.0, 'L', 'Laboratorio Nacional', 'CPE050159357', FALSE, 'ACTIVO'
) AS c
JOIN categorias cat ON cat.nombre = c.categoria
JOIN medidas med ON med.abreviatura = c.unidad_medida
JOIN proveedor prov ON prov.nombre = c.proveedor
ON DUPLICATE KEY UPDATE
    codigo_barra = VALUES(codigo_barra),
    nombre = VALUES(nombre),
    marca = VALUES(marca),
    precio_venta = VALUES(precio_venta),
    precio_compra = VALUES(precio_compra),
    id_categoria = VALUES(id_categoria),
    subcategoria = VALUES(subcategoria),
    peso_neto = VALUES(peso_neto),
    presentacion = VALUES(presentacion),
    unidades_por_bulto = VALUES(unidades_por_bulto),
    aplica_iva = VALUES(aplica_iva),
    porcentaje_iva = VALUES(porcentaje_iva),
    stock_minimo = VALUES(stock_minimo),
    id_medida = VALUES(id_medida),
    id_proveedor = VALUES(id_proveedor),
    registro_sanitario = VALUES(registro_sanitario),
    es_pesable_balanza = VALUES(es_pesable_balanza),
    estado = VALUES(estado);

INSERT INTO stock (id_producto, id_almacen, cantidad)
SELECT p.id, a.id, c.stock_actual
FROM (
    SELECT 'PROD-0001' AS codigo_interno, 250.0 AS stock_actual
    UNION ALL SELECT 'PROD-0002', 140.0
    UNION ALL SELECT 'PROD-0003', 180.0
    UNION ALL SELECT 'PROD-0004', 200.0
    UNION ALL SELECT 'PROD-0005', 150.0
    UNION ALL SELECT 'PROD-0006', 110.0
    UNION ALL SELECT 'PROD-0007', 95.0
    UNION ALL SELECT 'PROD-0008', 120.0
    UNION ALL SELECT 'PROD-0009', 160.0
    UNION ALL SELECT 'PROD-0010', 85.0
    UNION ALL SELECT 'PROD-0011', 90.0
    UNION ALL SELECT 'PROD-0012', 110.0
    UNION ALL SELECT 'PROD-0013', 75.0
    UNION ALL SELECT 'PROD-0014', 105.0
    UNION ALL SELECT 'PROD-0015', 130.0
    UNION ALL SELECT 'PROD-0016', 145.0
    UNION ALL SELECT 'PROD-0017', 90.0
    UNION ALL SELECT 'PROD-0018', 175.0
    UNION ALL SELECT 'PROD-0019', 115.0
    UNION ALL SELECT 'PROD-0020', 70.0
    UNION ALL SELECT 'PROD-0021', 96.0
    UNION ALL SELECT 'PROD-0022', 65.0
    UNION ALL SELECT 'PROD-0023', 80.0
    UNION ALL SELECT 'PROD-0024', 45.5
    UNION ALL SELECT 'PROD-0025', 32.0
    UNION ALL SELECT 'PROD-0026', 90.0
    UNION ALL SELECT 'PROD-0027', 60.0
    UNION ALL SELECT 'PROD-0028', 40.0
    UNION ALL SELECT 'PROD-0029', 85.0
    UNION ALL SELECT 'PROD-0030', 55.0
    UNION ALL SELECT 'PROD-0031', 65.0
    UNION ALL SELECT 'PROD-0032', 50.0
    UNION ALL SELECT 'PROD-0033', 110.0
    UNION ALL SELECT 'PROD-0034', 140.0
    UNION ALL SELECT 'PROD-0035', 85.0
    UNION ALL SELECT 'PROD-0036', 70.0
    UNION ALL SELECT 'PROD-0037', 120.0
    UNION ALL SELECT 'PROD-0038', 130.0
    UNION ALL SELECT 'PROD-0039', 95.0
    UNION ALL SELECT 'PROD-0040', 180.0
    UNION ALL SELECT 'PROD-0041', 100.0
    UNION ALL SELECT 'PROD-0042', 115.0
    UNION ALL SELECT 'PROD-0043', 160.0
    UNION ALL SELECT 'PROD-0044', 135.0
    UNION ALL SELECT 'PROD-0045', 90.0
    UNION ALL SELECT 'PROD-0046', 150.0
    UNION ALL SELECT 'PROD-0047', 120.0
    UNION ALL SELECT 'PROD-0048', 140.0
    UNION ALL SELECT 'PROD-0049', 65.0
    UNION ALL SELECT 'PROD-0050', 95.0
) AS c
JOIN productos p ON p.codigo_interno = c.codigo_interno
JOIN almacen a ON a.nombre = 'Almacen Principal'
ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad);

COMMIT;
