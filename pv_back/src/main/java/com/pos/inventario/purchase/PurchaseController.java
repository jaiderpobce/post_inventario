package com.pos.inventario.purchase;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/purchases", "/api/compras"})
public class PurchaseController {

    private final JdbcTemplate jdbcTemplate;

    public PurchaseController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<PurchaseSummaryDto> getPurchases() {
        String sql = """
            SELECT 
                c.id,
                COALESCE(c.n_factura, CONCAT('FC-', c.id)) AS invoiceNumber,
                c.id_proveedor AS supplierId,
                COALESCE(p.nombre, 'Proveedor General') AS supplierName,
                COALESCE(p.numero_documento, '') AS supplierDoc,
                c.fecha_compra AS purchaseDate,
                COALESCE(c.total, 0.00) AS total,
                COALESCE(c.estado, 'COMPLETADA') AS status,
                COALESCE(c.observaciones, '') AS notes,
                COALESCE(COUNT(d.id), 0) AS itemsCount
            FROM compra c
            LEFT JOIN proveedor p ON c.id_proveedor = p.id
            LEFT JOIN detalle_compra d ON d.id_compra = c.id
            GROUP BY c.id, c.n_factura, c.id_proveedor, p.nombre, p.numero_documento, c.fecha_compra, c.total, c.estado, c.observaciones
            ORDER BY c.id DESC
            """;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.sql.Timestamp ts = rs.getTimestamp("purchaseDate");
            String dateFormatted = (ts != null) ? ts.toLocalDateTime().format(dtf) : "";

            return new PurchaseSummaryDto(
                    rs.getLong("id"),
                    rs.getString("invoiceNumber"),
                    rs.getLong("supplierId"),
                    rs.getString("supplierName"),
                    rs.getString("supplierDoc"),
                    dateFormatted,
                    rs.getBigDecimal("total"),
                    rs.getString("status"),
                    rs.getString("notes"),
                    rs.getInt("itemsCount")
            );
        });
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseDetail(@PathVariable Long id) {
        String headerSql = """
            SELECT 
                c.id,
                COALESCE(c.n_factura, CONCAT('FC-', c.id)) AS invoiceNumber,
                c.id_proveedor AS supplierId,
                COALESCE(p.nombre, 'Proveedor General') AS supplierName,
                COALESCE(p.numero_documento, '') AS supplierDoc,
                COALESCE(p.telefono, '') AS supplierPhone,
                c.fecha_compra AS purchaseDate,
                COALESCE(c.total, 0.00) AS total,
                COALESCE(c.estado, 'COMPLETADA') AS status,
                COALESCE(c.observaciones, '') AS notes
            FROM compra c
            LEFT JOIN proveedor p ON c.id_proveedor = p.id
            WHERE c.id = ?
            """;

        List<Map<String, Object>> header = jdbcTemplate.queryForList(headerSql, id);
        if (header.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String itemsSql = """
            SELECT 
                d.id,
                d.id_producto AS productId,
                p.nombre AS productName,
                COALESCE(p.codigo_barra, p.codigo_interno) AS barcode,
                COALESCE(m.nombre, 'UND') AS unit,
                d.cantidad AS quantity,
                d.precio_unitario AS unitPrice,
                d.total AS subtotal
            FROM detalle_compra d
            JOIN productos p ON d.id_producto = p.id
            LEFT JOIN medidas m ON p.id_medida = m.id
            WHERE d.id_compra = ?
            ORDER BY d.id ASC
            """;

        List<Map<String, Object>> items = jdbcTemplate.queryForList(itemsSql, id);

        return ResponseEntity.ok(Map.of(
                "purchase", header.get(0),
                "items", items
        ));
    }

    @GetMapping("/suppliers")
    public List<Map<String, Object>> getSuppliers() {
        return jdbcTemplate.queryForList(
                "SELECT id, nombre, numero_documento AS doc, telefono AS phone, correo AS email " +
                "FROM proveedor WHERE estado = 'ACTIVO' OR estado IS NULL ORDER BY nombre ASC"
        );
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createPurchase(@RequestBody CreatePurchaseRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Solicitud vacía"));
        }
        if (req.supplierId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Debe seleccionar un proveedor"));
        }
        if (req.items() == null || req.items().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "La compra debe incluir al menos un producto"));
        }

        String invoiceNumber = (req.invoiceNumber() != null && !req.invoiceNumber().trim().isEmpty())
                ? req.invoiceNumber().trim().toUpperCase()
                : "FC-" + System.currentTimeMillis() % 100000;

        String notes = (req.notes() != null) ? req.notes().trim() : "";
        int warehouseId = (req.warehouseId() != null) ? req.warehouseId() : 3; // Almacen Principal

        // Calcular total sumando los items
        BigDecimal computedTotal = BigDecimal.ZERO;
        for (PurchaseItemRequest item : req.items()) {
            if (item.productId() == null || item.quantity() == null || item.unitPrice() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Datos incompletos en los productos de la compra"));
            }
            if (item.quantity().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "La cantidad debe ser mayor a 0"));
            }
            BigDecimal lineTotal = item.quantity().multiply(item.unitPrice());
            computedTotal = computedTotal.add(lineTotal);
        }

        // Insertar cabecera de compra
        KeyHolder keyHolder = new GeneratedKeyHolder();
        BigDecimal finalTotal = computedTotal;
        String insertHeaderSql = """
            INSERT INTO compra (id_proveedor, fecha_compra, total, n_factura, estado, observaciones, id_almacen)
            VALUES (?, NOW(), ?, ?, 'COMPLETADA', ?, ?)
            """;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertHeaderSql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, req.supplierId());
            ps.setBigDecimal(2, finalTotal);
            ps.setString(3, invoiceNumber);
            ps.setString(4, notes);
            ps.setInt(5, warehouseId);
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        Long purchaseId = (generatedKey != null) ? generatedKey.longValue() : 0L;

        // Insertar detalles, incrementar stock en inventario y registrar movimiento
        for (PurchaseItemRequest item : req.items()) {
            BigDecimal lineTotal = item.quantity().multiply(item.unitPrice());

            // 1. Detalle de compra
            jdbcTemplate.update(
                    "INSERT INTO detalle_compra (id_producto, id_compra, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)",
                    item.productId(), purchaseId, item.quantity(), item.unitPrice(), lineTotal
            );

            // 2. Incrementar stock en almacén
            String stockSql = """
                INSERT INTO stock (id_producto, id_almacen, cantidad)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)
                """;
            jdbcTemplate.update(stockSql, item.productId(), warehouseId, item.quantity());

            // 3. Registrar movimiento kardex
            jdbcTemplate.update(
                    "INSERT INTO movimientos_productos (id_producto, fecha_hora, tipo_movimiento, cantidad) VALUES (?, NOW(), 'INGRESO', ?)",
                    item.productId(), item.quantity()
            );

            // 4. Actualizar costo de compra en catálogo
            jdbcTemplate.update(
                    "UPDATE productos SET precio_compra = ? WHERE id = ?",
                    item.unitPrice(), item.productId()
            );
        }

        // Obtener nombre del proveedor para la respuesta
        String supplierName = jdbcTemplate.queryForObject(
                "SELECT nombre FROM proveedor WHERE id = ?", String.class, req.supplierId()
        );

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String currentDate = LocalDateTime.now().format(dtf);

        PurchaseSummaryDto created = new PurchaseSummaryDto(
                purchaseId,
                invoiceNumber,
                req.supplierId(),
                supplierName != null ? supplierName : "Proveedor",
                "",
                currentDate,
                computedTotal,
                "COMPLETADA",
                notes,
                req.items().size()
        );

        return ResponseEntity.status(201).body(Map.of(
                "message", "Factura de compra '" + invoiceNumber + "' registrada con éxito. Existencias de stock actualizadas.",
                "purchase", created
        ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "COMPLETADA");
        int updated = jdbcTemplate.update("UPDATE compra SET estado = ? WHERE id = ?", newStatus, id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Estado de la compra actualizado a " + newStatus, "status", newStatus));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelPurchase(@PathVariable Long id) {
        int updated = jdbcTemplate.update("UPDATE compra SET estado = 'ANULADA' WHERE id = ?", id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Factura de compra anulada"));
        }
        return ResponseEntity.notFound().build();
    }

    public record PurchaseSummaryDto(
            Long id,
            String invoiceNumber,
            Long supplierId,
            String supplierName,
            String supplierDoc,
            String purchaseDate,
            BigDecimal total,
            String status,
            String notes,
            Integer itemsCount) {
    }

    public record CreatePurchaseRequest(
            Long supplierId,
            String invoiceNumber,
            String notes,
            Integer warehouseId,
            List<PurchaseItemRequest> items) {
    }

    public record PurchaseItemRequest(
            Long productId,
            BigDecimal quantity,
            BigDecimal unitPrice) {
    }
}
