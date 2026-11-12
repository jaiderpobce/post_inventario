package com.pos.inventario.customer;

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
@RequestMapping({"/api/customers", "/api/clientes"})
public class CustomerController {

    private final JdbcTemplate jdbcTemplate;

    public CustomerController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<CustomerDto> getCustomers() {
        String sql = """
            SELECT 
                id,
                COALESCE(numero_documento, '') AS doc,
                nombre,
                COALESCE(apellido, '') AS apellido,
                COALESCE(telefono, '') AS telefono,
                COALESCE(correo, '') AS correo,
                COALESCE(direccion, '') AS direccion,
                COALESCE(tipo_cliente, 'Consumidor Final') AS tipo_cliente,
                COALESCE(limite_credito, 0.00) AS limite_credito,
                COALESCE(estado, 'ACTIVO') AS estado
            FROM cliente
            ORDER BY id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String nombre = rs.getString("nombre");
            String apellido = rs.getString("apellido");
            String fullName = (apellido != null && !apellido.trim().isEmpty())
                    ? (nombre + " " + apellido).trim()
                    : nombre;

            return new CustomerDto(
                    rs.getLong("id"),
                    rs.getString("doc"),
                    fullName,
                    nombre,
                    apellido,
                    rs.getString("telefono"),
                    rs.getString("correo"),
                    rs.getString("direccion"),
                    rs.getString("tipo_cliente"),
                    rs.getBigDecimal("limite_credito"),
                    rs.getString("estado")
            );
        });
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody CreateCustomerRequest req) {
        if (req == null || req.name() == null || req.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre o razón social del cliente es obligatorio"));
        }
        if (req.doc() == null || req.doc().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El número de documento (Cédula / RIF) es obligatorio"));
        }

        String doc = req.doc().trim().toUpperCase();
        String name = req.name().trim();
        String lastName = (req.lastName() != null) ? req.lastName().trim() : "";
        String phone = (req.phone() != null) ? req.phone().trim() : "";
        String email = (req.email() != null) ? req.email().trim().toLowerCase() : "";
        String address = (req.address() != null) ? req.address().trim() : "";
        String type = (req.type() != null && !req.type().trim().isEmpty()) ? req.type().trim() : "Consumidor Final";
        BigDecimal creditLimit = (req.creditLimit() != null && req.creditLimit().compareTo(BigDecimal.ZERO) >= 0)
                ? req.creditLimit()
                : BigDecimal.ZERO;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String insertSql = """
            INSERT INTO cliente (
                nombre, apellido, numero_documento, telefono, correo, direccion, tipo_cliente, limite_credito, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
            """;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            ps.setString(2, lastName);
            ps.setString(3, doc);
            ps.setString(4, phone);
            ps.setString(5, email);
            ps.setString(6, address);
            ps.setString(7, type);
            ps.setBigDecimal(8, creditLimit);
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        Long newId = (generatedKey != null) ? generatedKey.longValue() : 0L;

        String fullName = (!lastName.isEmpty()) ? (name + " " + lastName).trim() : name;

        CustomerDto newCustomer = new CustomerDto(
                newId,
                doc,
                fullName,
                name,
                lastName,
                phone,
                email,
                address,
                type,
                creditLimit,
                "ACTIVO"
        );

        return ResponseEntity.status(201).body(Map.of(
                "message", "Cliente '" + fullName + "' registrado exitosamente en el sistema",
                "customer", newCustomer
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody UpdateCustomerRequest req) {
        if (req == null || req.name() == null || req.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre o razón social es obligatorio"));
        }
        if (req.doc() == null || req.doc().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El documento es obligatorio"));
        }

        String sql = """
            UPDATE cliente 
            SET nombre = ?, apellido = ?, numero_documento = ?, telefono = ?, correo = ?, direccion = ?, tipo_cliente = ?, limite_credito = ?
            WHERE id = ?
            """;

        String name = req.name().trim();
        String lastName = (req.lastName() != null) ? req.lastName().trim() : "";
        String doc = req.doc().trim().toUpperCase();
        String phone = (req.phone() != null) ? req.phone().trim() : "";
        String email = (req.email() != null) ? req.email().trim().toLowerCase() : "";
        String address = (req.address() != null) ? req.address().trim() : "";
        String type = (req.type() != null && !req.type().trim().isEmpty()) ? req.type().trim() : "Consumidor Final";
        BigDecimal creditLimit = (req.creditLimit() != null && req.creditLimit().compareTo(BigDecimal.ZERO) >= 0)
                ? req.creditLimit()
                : BigDecimal.ZERO;

        int updated = jdbcTemplate.update(sql, name, lastName, doc, phone, email, address, type, creditLimit, id);

        if (updated > 0) {
            String fullName = (!lastName.isEmpty()) ? (name + " " + lastName).trim() : name;
            CustomerDto updatedCustomer = new CustomerDto(
                    id, doc, fullName, name, lastName, phone, email, address, type, creditLimit, req.status() != null ? req.status() : "ACTIVO"
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Cliente modificado con éxito",
                    "customer", updatedCustomer
            ));
        }

        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "ACTIVO");
        int updated = jdbcTemplate.update("UPDATE cliente SET estado = ? WHERE id = ?", newStatus, id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of(
                    "message", "Estado del cliente actualizado a " + newStatus,
                    "status", newStatus
            ));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        int updated = jdbcTemplate.update("UPDATE cliente SET estado = 'INACTIVO' WHERE id = ?", id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Cliente inactivado / eliminado del directorio"));
        }
        return ResponseEntity.notFound().build();
    }

    public record CustomerDto(
            Long id,
            String doc,
            String name,
            String firstName,
            String lastName,
            String phone,
            String email,
            String address,
            String type,
            BigDecimal creditLimit,
            String status) {
    }

    public record CreateCustomerRequest(
            String doc,
            String name,
            String lastName,
            String phone,
            String email,
            String address,
            String type,
            BigDecimal creditLimit) {
    }

    public record UpdateCustomerRequest(
            String doc,
            String name,
            String lastName,
            String phone,
            String email,
            String address,
            String type,
            BigDecimal creditLimit,
            String status) {
    }
}
