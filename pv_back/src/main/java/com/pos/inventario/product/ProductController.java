package com.pos.inventario.product;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final String FIND_ACTIVE_PRODUCTS = """
            SELECT COALESCE(NULLIF(p.codigo_barra, ''), p.codigo_interno, CAST(p.id AS CHAR)) AS code,
                   p.id AS id,
                   p.codigo_interno AS internalCode,
                   p.codigo_barra AS barcode,
                   p.nombre AS name,
                   p.precio_venta AS price,
                   COALESCE(s.stock, 0) AS stock,
                   COALESCE(m.abreviatura, 'UND') AS unit,
                   p.es_pesable_balanza AS weightBased,
                   p.porcentaje_iva / 100.0 AS ivaRate
            FROM productos p
            LEFT JOIN (
                SELECT id_producto, SUM(cantidad) AS stock
                FROM stock
                GROUP BY id_producto
            ) s ON s.id_producto = p.id
            LEFT JOIN medidas m ON m.id = p.id_medida
            WHERE p.estado = 'ACTIVO'
            ORDER BY p.nombre
            """;

    private final JdbcTemplate jdbcTemplate;

    public ProductController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<ProductDto> getProducts() {
        return jdbcTemplate.query(FIND_ACTIVE_PRODUCTS, (resultSet, rowNumber) ->
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
                        resultSet.getBigDecimal("ivaRate")));
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
            BigDecimal ivaRate) {
    }
}
