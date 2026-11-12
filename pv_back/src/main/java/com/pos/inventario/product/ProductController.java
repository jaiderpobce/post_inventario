package com.pos.inventario.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
            ORDER BY p.nombre
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
}
