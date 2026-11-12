package com.pos.inventario.product;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final String FIND_ALL_PRODUCTS = """
            SELECT COALESCE(NULLIF(p.codigo_barra, ''), p.codigo_interno, CAST(p.id AS CHAR)) AS code,
                   p.id AS id,
                   p.codigo_interno AS internalCode,
                   p.codigo_barra AS barcode,
                   p.nombre AS name,
                   p.precio_venta AS price,
                   COALESCE(s.stock, 0) AS stock,
                   COALESCE(m.abreviatura, 'UND') AS unit,
                   p.es_pesable_balanza AS weightBased,
                   p.porcentaje_iva / 100.0 AS ivaRate,
                   p.estado AS status
            FROM productos p
            LEFT JOIN (
                SELECT id_producto, SUM(cantidad) AS stock
                FROM stock
                GROUP BY id_producto
            ) s ON s.id_producto = p.id
            LEFT JOIN medidas m ON m.id = p.id_medida
            ORDER BY p.id DESC
            """;

    private final JdbcTemplate jdbcTemplate;

    public ProductController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<ProductDto> getProducts() {
        return jdbcTemplate.query(FIND_ALL_PRODUCTS, (resultSet, rowNumber) ->
                new ProductDto(
                        resultSet.getLong("id"),
                        resultSet.getString("code"),
                        resultSet.getString("internalCode"),
                        resultSet.getString("barcode"),
                        resultSet.getString("name"),
                        resultSet.getBigDecimal("price"),
                        resultSet.getBigDecimal("stock"),
                        resultSet.getString("unit"),
                        resultSet.getBoolean("weightBased"),
                        resultSet.getBigDecimal("ivaRate"),
                        resultSet.getString("status")));
    }

    @GetMapping("/categories")
    public List<Map<String, Object>> getCategories() {
        return jdbcTemplate.queryForList("SELECT id, nombre FROM categorias WHERE estado = 'ACTIVO' OR estado IS NULL ORDER BY nombre");
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest req) {
        if (req == null || req.name() == null || req.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del producto es obligatorio"));
        }
        if (req.price() == null || req.price().compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El precio de venta debe ser un número mayor o igual a 0"));
        }

        // Generar código interno automático si no se especificó
        String internalCode = (req.internalCode() != null && !req.internalCode().trim().isEmpty())
                ? req.internalCode().trim().toUpperCase()
                : generateInternalCode();

        String barcode = (req.barcode() != null && !req.barcode().trim().isEmpty()) ? req.barcode().trim() : null;
        String brand = (req.brand() != null && !req.brand().trim().isEmpty()) ? req.brand().trim() : "Genérica";
        BigDecimal costPrice = (req.costPrice() != null) ? req.costPrice() : req.price().multiply(new BigDecimal("0.75"));
        Integer categoryId = (req.categoryId() != null) ? req.categoryId() : 11; // 11 = Alimentos por defecto
        boolean weightBased = Boolean.TRUE.equals(req.weightBased());

        // Medida
        int idMedida = 1; // UND
        String unit = (req.unit() != null) ? req.unit().trim().toUpperCase() : "UND";
        if (unit.contains("KG") || weightBased) {
            idMedida = 5; // Kilogramo
            unit = "kg";
        } else if (unit.contains("L")) {
            idMedida = 4; // Litro
            unit = "L";
        }

        // Tratamiento de IVA
        boolean isGravado = "GRAVADO".equalsIgnoreCase(req.ivaType()) || (req.ivaRate() != null && req.ivaRate().compareTo(BigDecimal.ZERO) > 0);
        String aplicaIva = isGravado ? "GRAVADO" : "EXENTO";
        BigDecimal porcentajeIva = isGravado ? new BigDecimal("16.00") : BigDecimal.ZERO;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String insertSql = """
            INSERT INTO productos (
                codigo_interno, codigo_barra, nombre, marca, precio_venta, precio_compra,
                id_categoria, id_medida, es_pesable_balanza, aplica_iva, porcentaje_iva, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
            """;

        String finalInternalCode = internalCode;
        String finalBarcode = barcode;
        int finalIdMedida = idMedida;
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, finalInternalCode);
            ps.setString(2, finalBarcode);
            ps.setString(3, req.name().trim());
            ps.setString(4, brand);
            ps.setBigDecimal(5, req.price());
            ps.setBigDecimal(6, costPrice);
            ps.setInt(7, categoryId);
            ps.setInt(8, finalIdMedida);
            ps.setBoolean(9, weightBased);
            ps.setString(10, aplicaIva);
            ps.setBigDecimal(11, porcentajeIva);
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        Long newId = (generatedId != null) ? generatedId.longValue() : null;

        // Registrar existencia inicial en el almacén principal (id_almacen = 3)
        BigDecimal stockAmount = (req.stock() != null && req.stock().compareTo(BigDecimal.ZERO) > 0) ? req.stock() : BigDecimal.ZERO;
        if (newId != null && stockAmount.compareTo(BigDecimal.ZERO) > 0) {
            jdbcTemplate.update("INSERT INTO stock (id_producto, id_almacen, cantidad) VALUES (?, 3, ?)", newId, stockAmount);
        }

        ProductDto newProduct = new ProductDto(
                newId,
                (barcode != null) ? barcode : internalCode,
                internalCode,
                barcode,
                req.name().trim(),
                req.price(),
                stockAmount,
                unit,
                weightBased,
                porcentajeIva.divide(new BigDecimal("100")),
                "ACTIVO"
        );

        return ResponseEntity.status(201).body(Map.of(
                "message", "Producto '" + req.name().trim() + "' registrado exitosamente en la base de datos",
                "product", newProduct
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody UpdateProductRequest req) {
        String sql = "UPDATE productos SET nombre = ?, precio_venta = ?, codigo_barra = ? WHERE id = ?";
        int updated = jdbcTemplate.update(sql, req.name(), req.price(), req.barcode(), id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Producto modificado con éxito"));
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "ACTIVO");
        int updated = jdbcTemplate.update("UPDATE productos SET estado = ? WHERE id = ?", newStatus, id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Estado actualizado a " + newStatus, "status", newStatus));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        int updated = jdbcTemplate.update("UPDATE productos SET estado = 'INACTIVO' WHERE id = ?", id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Producto eliminado / inactivado"));
        }
        return ResponseEntity.notFound().build();
    }

    private String generateInternalCode() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) FROM productos", Long.class);
            return String.format("PROD-%04d", (count != null ? count : 0) + 1);
        } catch (Exception e) {
            return "PROD-" + (System.currentTimeMillis() % 10000);
        }
    }

    public record ProductDto(
            Long id,
            String code,
            String internalCode,
            String barcode,
            String name,
            BigDecimal price,
            BigDecimal stock,
            String unit,
            Boolean weightBased,
            BigDecimal ivaRate,
            String status) {
    }

    public record UpdateProductRequest(String name, BigDecimal price, String barcode) {}

    public record CreateProductRequest(
            String internalCode,
            String barcode,
            String name,
            String brand,
            BigDecimal price,
            BigDecimal costPrice,
            BigDecimal stock,
            Integer categoryId,
            String unit,
            Boolean weightBased,
            String ivaType,
            BigDecimal ivaRate) {}
}
