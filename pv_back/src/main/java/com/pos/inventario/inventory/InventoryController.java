package com.pos.inventario.inventory;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/inventory", "/api/inventario"})
public class InventoryController {

    private final JdbcTemplate jdbcTemplate;

    public InventoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<InventoryItemDto> getInventoryStock() {
        String sql = """
            SELECT 
                p.id AS productId,
                COALESCE(p.codigo_barra, p.codigo_interno) AS barcode,
                COALESCE(p.codigo_interno, CONCAT('PROD-', p.id)) AS internalCode,
                p.nombre AS productName,
                COALESCE(p.marca, 'Genérica') AS brand,
                COALESCE(c.nombre, 'Sin categoría') AS categoryName,
                COALESCE(m.nombre, 'UND') AS unit,
                COALESCE(a.id, 3) AS warehouseId,
                COALESCE(a.nombre, 'Almacén Principal') AS warehouseName,
                COALESCE(s.cantidad, 0.000) AS currentStock,
                COALESCE(p.stock_minimo, 0.000) AS minStock,
                COALESCE(p.precio_venta, 0.00) AS salePrice,
                COALESCE(p.precio_compra, 0.00) AS costPrice,
                COALESCE(p.estado, 'ACTIVO') AS status
            FROM productos p
            LEFT JOIN (
                SELECT id_producto, id_almacen, SUM(cantidad) AS cantidad
                FROM stock
                GROUP BY id_producto, id_almacen
            ) s ON s.id_producto = p.id
            LEFT JOIN almacen a ON a.id = s.id_almacen
            LEFT JOIN categorias c ON c.id = p.id_categoria
            LEFT JOIN medidas m ON m.id = p.id_medida
            ORDER BY p.id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            BigDecimal current = rs.getBigDecimal("currentStock");
            BigDecimal min = rs.getBigDecimal("minStock");
            BigDecimal cost = rs.getBigDecimal("costPrice");
            BigDecimal valuation = current.multiply(cost);

            String stockAlert = "NORMAL";
            if (current.compareTo(BigDecimal.ZERO) <= 0) {
                stockAlert = "AGOTADO";
            } else if (min.compareTo(BigDecimal.ZERO) > 0 && current.compareTo(min) <= 0) {
                stockAlert = "BAJO_STOCK";
            }

            return new InventoryItemDto(
                    rs.getLong("productId"),
                    rs.getString("barcode"),
                    rs.getString("internalCode"),
                    rs.getString("productName"),
                    rs.getString("brand"),
                    rs.getString("categoryName"),
                    rs.getString("unit"),
                    rs.getLong("warehouseId"),
                    rs.getString("warehouseName"),
                    current,
                    min,
                    rs.getBigDecimal("salePrice"),
                    cost,
                    valuation,
                    stockAlert,
                    rs.getString("status")
            );
        });
    }

    @GetMapping("/warehouses")
    public List<Map<String, Object>> getWarehouses() {
        return jdbcTemplate.queryForList("SELECT id, nombre, ubicacion, estado FROM almacen ORDER BY id ASC");
    }

    @GetMapping("/movements")
    public List<Map<String, Object>> getMovements() {
        String sql = """
            SELECT 
                m.id,
                m.id_producto AS productId,
                p.nombre AS productName,
                COALESCE(p.codigo_barra, p.codigo_interno) AS barcode,
                m.tipo_movimiento AS type,
                m.cantidad AS quantity,
                m.fecha_hora AS date
            FROM movimientos_productos m
            JOIN productos p ON m.id_producto = p.id
            ORDER BY m.id DESC
            LIMIT 50
            """;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.sql.Timestamp ts = rs.getTimestamp("date");
            String dateFormatted = (ts != null) ? ts.toLocalDateTime().format(dtf) : "";

            return Map.of(
                    "id", rs.getLong("id"),
                    "productId", rs.getLong("productId"),
                    "productName", rs.getString("productName"),
                    "barcode", rs.getString("barcode"),
                    "type", rs.getString("type"),
                    "quantity", rs.getBigDecimal("quantity"),
                    "date", dateFormatted
            );
        });
    }

    @PostMapping("/adjust")
    @Transactional
    public ResponseEntity<?> adjustStock(@RequestBody StockAdjustmentRequest req) {
        if (req == null || req.productId() == null || req.quantity() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Parámetros incompletos para el ajuste"));
        }
        if (req.quantity().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "La cantidad del ajuste no puede ser negativa"));
        }

        int warehouseId = (req.warehouseId() != null) ? req.warehouseId() : 3;
        String type = (req.adjustmentType() != null) ? req.adjustmentType().toUpperCase() : "AJUSTE";

        BigDecimal deltaQuantity = req.quantity();

        if ("EGRESO".equalsIgnoreCase(type) || "SALIDA".equalsIgnoreCase(type)) {
            // Restar stock
            jdbcTemplate.update("""
                INSERT INTO stock (id_producto, id_almacen, cantidad)
                VALUES (?, ?, 0)
                ON DUPLICATE KEY UPDATE cantidad = GREATEST(0, cantidad - ?)
                """, req.productId(), warehouseId, deltaQuantity);

            jdbcTemplate.update("INSERT INTO movimientos_productos (id_producto, fecha_hora, tipo_movimiento, cantidad) VALUES (?, NOW(), 'EGRESO', ?)",
                    req.productId(), deltaQuantity);
        } else if ("INGRESO".equalsIgnoreCase(type) || "ENTRADA".equalsIgnoreCase(type)) {
            // Sumar stock
            jdbcTemplate.update("""
                INSERT INTO stock (id_producto, id_almacen, cantidad)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
                """, req.productId(), warehouseId, deltaQuantity);

            jdbcTemplate.update("INSERT INTO movimientos_productos (id_producto, fecha_hora, tipo_movimiento, cantidad) VALUES (?, NOW(), 'INGRESO', ?)",
                    req.productId(), deltaQuantity);
        } else {
            // Ajuste directo / Conteo físico
            jdbcTemplate.update("""
                INSERT INTO stock (id_producto, id_almacen, cantidad)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad = ?
                """, req.productId(), warehouseId, deltaQuantity, deltaQuantity);

            jdbcTemplate.update("INSERT INTO movimientos_productos (id_producto, fecha_hora, tipo_movimiento, cantidad) VALUES (?, NOW(), 'AJUSTE', ?)",
                    req.productId(), deltaQuantity);
        }

        BigDecimal updatedStock = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(cantidad), 0) FROM stock WHERE id_producto = ? AND id_almacen = ?",
                BigDecimal.class, req.productId(), warehouseId
        );

        String productName = jdbcTemplate.queryForObject(
                "SELECT nombre FROM productos WHERE id = ?", String.class, req.productId()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Ajuste de inventario aplicado a '" + (productName != null ? productName : "Producto") + "'. Nueva existencia: " + updatedStock,
                "productId", req.productId(),
                "newStock", updatedStock
        ));
    }

    public record InventoryItemDto(
            Long productId,
            String barcode,
            String internalCode,
            String productName,
            String brand,
            String categoryName,
            String unit,
            Long warehouseId,
            String warehouseName,
            BigDecimal currentStock,
            BigDecimal minStock,
            BigDecimal salePrice,
            BigDecimal costPrice,
            BigDecimal valuation,
            String stockAlert,
            String status) {
    }

    public record StockAdjustmentRequest(
            Long productId,
            Integer warehouseId,
            String adjustmentType,
            BigDecimal quantity,
            String reason) {
    }
}
