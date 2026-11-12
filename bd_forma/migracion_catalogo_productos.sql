-- Migracion aditiva para conservar los datos existentes y habilitar el catalogo CSV.
-- Ejecutar una sola vez antes de catalogo_productos_import.sql.
USE inventario;

ALTER TABLE categorias
    ADD UNIQUE KEY uq_categorias_nombre (nombre);

ALTER TABLE proveedor
    ADD UNIQUE KEY uq_proveedor_nombre (nombre);

ALTER TABLE almacen
    ADD UNIQUE KEY uq_almacen_nombre (nombre);

ALTER TABLE productos
    ADD COLUMN codigo_interno VARCHAR(32) NULL AFTER id,
    ADD COLUMN codigo_barra VARCHAR(13) NULL AFTER codigo_interno,
    ADD COLUMN marca VARCHAR(100) NULL AFTER nombre,
    ADD COLUMN subcategoria VARCHAR(100) NULL AFTER id_categoria,
    ADD COLUMN peso_neto DECIMAL(10,3) NULL AFTER subcategoria,
    ADD COLUMN presentacion VARCHAR(100) NULL AFTER peso_neto,
    ADD COLUMN unidades_por_bulto SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER presentacion,
    ADD COLUMN aplica_iva ENUM('EXENTO', 'GRAVADO') NOT NULL DEFAULT 'GRAVADO' AFTER unidades_por_bulto,
    ADD COLUMN porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 16.00 AFTER aplica_iva,
    ADD COLUMN stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0.000 AFTER porcentaje_iva,
    ADD COLUMN id_proveedor INT NULL AFTER id_medida,
    ADD COLUMN registro_sanitario VARCHAR(100) NULL AFTER id_proveedor,
    ADD COLUMN es_pesable_balanza BOOLEAN NOT NULL DEFAULT FALSE AFTER registro_sanitario,
    ADD UNIQUE KEY uq_productos_codigo_interno (codigo_interno),
    ADD UNIQUE KEY uq_productos_codigo_barra (codigo_barra),
    ADD KEY ix_productos_proveedor (id_proveedor),
    ADD CONSTRAINT fk_productos_proveedor
        FOREIGN KEY (id_proveedor) REFERENCES proveedor (id)
        ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE stock
    MODIFY cantidad DECIMAL(12,3) NOT NULL DEFAULT 0.000;

ALTER TABLE movimientos_productos
    MODIFY cantidad DECIMAL(12,3) NOT NULL;

ALTER TABLE detalle_venta
    MODIFY cantidad DECIMAL(12,3) NOT NULL;

ALTER TABLE detalle_compra
    MODIFY cantidad DECIMAL(12,3) NOT NULL;
