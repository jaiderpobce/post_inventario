package com.pos.inventario.user;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
@RequestMapping({"/api/users", "/api/usuarios"})
public class UserController {

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Lista todos los usuarios registrados en pos_rbac.usuario con sus roles asignados
     */
    @GetMapping
    public List<UserDto> getUsers() {
        String sql = """
            SELECT 
                u.id,
                COALESCE(u.numero_documento, '') AS doc,
                u.nombre,
                COALESCE(u.apellido, '') AS apellido,
                COALESCE(u.telefono, '') AS telefono,
                u.email,
                u.activo,
                COALESCE(r.id, 4) AS rol_id,
                COALESCE(r.nombre_rol, 'CAJERO') AS nombre_rol,
                COALESCE(r.descripcion, 'Operador') AS rol_desc,
                COALESCE(DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d %H:%i'), '') AS fecha_creacion
            FROM pos_rbac.usuario u
            LEFT JOIN pos_rbac.r_usuario_rol ur ON ur.usuario_id = u.id
            LEFT JOIN pos_rbac.rol r ON r.id = ur.rol_id
            ORDER BY u.id ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String nombre = rs.getString("nombre");
            String apellido = rs.getString("apellido");
            String fullName = (apellido != null && !apellido.trim().isEmpty())
                    ? (nombre + " " + apellido).trim()
                    : nombre;
            int activo = rs.getInt("activo");
            String status = (activo == 1) ? "ACTIVO" : "SUSPENDIDO";

            return new UserDto(
                    rs.getLong("id"),
                    rs.getString("doc"),
                    fullName,
                    nombre,
                    apellido,
                    rs.getString("telefono"),
                    rs.getString("email"),
                    rs.getString("nombre_rol"),
                    rs.getLong("rol_id"),
                    rs.getString("rol_desc"),
                    status,
                    activo == 1,
                    rs.getString("fecha_creacion")
            );
        });
    }

    /**
     * Lista el catálogo de roles disponibles en pos_rbac.rol
     */
    @GetMapping("/roles")
    public List<RoleDto> getRoles() {
        String sql = "SELECT id, nombre_rol, descripcion FROM pos_rbac.rol ORDER BY id ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new RoleDto(
                rs.getLong("id"),
                rs.getString("nombre_rol"),
                rs.getString("descripcion")
        ));
    }

    /**
     * Registra un nuevo operador/usuario en pos_rbac.usuario y asigna su rol
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest req) {
        if (req == null || req.email() == null || req.email().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo electrónico es obligatorio"));
        }
        String name = (req.name() != null) ? req.name().trim() : "";
        String firstName = (req.firstName() != null && !req.firstName().trim().isEmpty()) 
                ? req.firstName().trim() 
                : name;
        if (firstName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del usuario es obligatorio"));
        }

        String email = req.email().trim().toLowerCase();
        String doc = (req.doc() != null) ? req.doc().trim().toUpperCase() : "";
        String lastName = (req.lastName() != null) ? req.lastName().trim() : "";
        String phone = (req.phone() != null) ? req.phone().trim() : "";
        String rawPassword = (req.password() != null && !req.password().trim().isEmpty()) 
                ? req.password().trim() 
                : "Admin123*";

        // Validar unicidad de correo
        Integer countEmail = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pos_rbac.usuario WHERE LOWER(email) = ?", 
                Integer.class, 
                email
        );
        if (countEmail != null && countEmail > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo electrónico '" + email + "' ya está registrado"));
        }

        // Validar unicidad de documento si no está vacío
        if (!doc.isEmpty()) {
            Integer countDoc = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM pos_rbac.usuario WHERE UPPER(numero_documento) = ?", 
                    Integer.class, 
                    doc
            );
            if (countDoc != null && countDoc > 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "La cédula o RIF '" + doc + "' ya está asignada a otro usuario"));
            }
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String insertSql = """
            INSERT INTO pos_rbac.usuario (
                nombre, apellido, numero_documento, telefono, email, password_hash, activo
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
            """;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, doc.isEmpty() ? null : doc);
            ps.setString(4, phone);
            ps.setString(5, email);
            ps.setString(6, hashedPassword);
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        Long newId = (generatedKey != null) ? generatedKey.longValue() : 0L;

        // Asignación de rol (por ID o por nombre, default 4 = CAJERO)
        Long targetRoleId = req.roleId();
        String targetRoleName = "CAJERO";
        if (targetRoleId == null && req.role() != null) {
            List<Long> roleIds = jdbcTemplate.query(
                    "SELECT id FROM pos_rbac.rol WHERE UPPER(nombre_rol) = ?",
                    (rs, rowNum) -> rs.getLong("id"),
                    req.role().trim().toUpperCase()
            );
            if (!roleIds.isEmpty()) {
                targetRoleId = roleIds.get(0);
            }
        }
        if (targetRoleId == null) {
            targetRoleId = 4L; // Default Cajero
        }

        // Obtener nombre del rol
        List<String> roleNames = jdbcTemplate.query(
                "SELECT nombre_rol FROM pos_rbac.rol WHERE id = ?",
                (rs, rowNum) -> rs.getString("nombre_rol"),
                targetRoleId
        );
        if (!roleNames.isEmpty()) {
            targetRoleName = roleNames.get(0);
        }

        // Insertar relación de rol
        jdbcTemplate.update(
                "INSERT INTO pos_rbac.r_usuario_rol (usuario_id, rol_id) VALUES (?, ?)", 
                newId, 
                targetRoleId
        );

        String fullName = (!lastName.isEmpty()) ? (firstName + " " + lastName).trim() : firstName;

        UserDto createdUser = new UserDto(
                newId,
                doc,
                fullName,
                firstName,
                lastName,
                phone,
                email,
                targetRoleName,
                targetRoleId,
                "",
                "ACTIVO",
                true,
                "Recién creado"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Usuario '" + fullName + "' creado con éxito en pos_rbac",
                "user", createdUser
        ));
    }

    /**
     * Modifica los datos de un usuario existente y su rol
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Datos de usuario inválidos"));
        }

        String name = (req.name() != null) ? req.name().trim() : "";
        String firstName = (req.firstName() != null && !req.firstName().trim().isEmpty()) 
                ? req.firstName().trim() 
                : name;
        if (firstName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio"));
        }

        String email = (req.email() != null) ? req.email().trim().toLowerCase() : "";
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo electrónico es obligatorio"));
        }

        String doc = (req.doc() != null) ? req.doc().trim().toUpperCase() : "";
        String lastName = (req.lastName() != null) ? req.lastName().trim() : "";
        String phone = (req.phone() != null) ? req.phone().trim() : "";

        // Validar unicidad de correo descartando el propio ID
        Integer countEmail = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pos_rbac.usuario WHERE LOWER(email) = ? AND id != ?", 
                Integer.class, 
                email, 
                id
        );
        if (countEmail != null && countEmail > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo electrónico '" + email + "' ya está en uso por otro operador"));
        }

        // Validar unicidad de documento descartando el propio ID
        if (!doc.isEmpty()) {
            Integer countDoc = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM pos_rbac.usuario WHERE UPPER(numero_documento) = ? AND id != ?", 
                    Integer.class, 
                    doc, 
                    id
            );
            if (countDoc != null && countDoc > 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El documento '" + doc + "' ya pertenece a otro usuario"));
            }
        }

        // Actualizar datos básicos
        int updated = jdbcTemplate.update(
                "UPDATE pos_rbac.usuario SET nombre = ?, apellido = ?, numero_documento = ?, telefono = ?, email = ? WHERE id = ?",
                firstName, 
                lastName, 
                doc.isEmpty() ? null : doc, 
                phone, 
                email, 
                id
        );

        if (updated == 0) {
            return ResponseEntity.notFound().build();
        }

        // Si se envió una nueva contraseña no vacía, se actualiza el hash
        if (req.password() != null && !req.password().trim().isEmpty()) {
            String newHash = passwordEncoder.encode(req.password().trim());
            jdbcTemplate.update("UPDATE pos_rbac.usuario SET password_hash = ? WHERE id = ?", newHash, id);
        }

        // Actualizar rol asignado si se envió roleId o role
        Long targetRoleId = req.roleId();
        String targetRoleName = "CAJERO";
        if (targetRoleId == null && req.role() != null) {
            List<Long> roleIds = jdbcTemplate.query(
                    "SELECT id FROM pos_rbac.rol WHERE UPPER(nombre_rol) = ?",
                    (rs, rowNum) -> rs.getLong("id"),
                    req.role().trim().toUpperCase()
            );
            if (!roleIds.isEmpty()) {
                targetRoleId = roleIds.get(0);
            }
        }

        if (targetRoleId != null) {
            jdbcTemplate.update("DELETE FROM pos_rbac.r_usuario_rol WHERE usuario_id = ?", id);
            jdbcTemplate.update("INSERT INTO pos_rbac.r_usuario_rol (usuario_id, rol_id) VALUES (?, ?)", id, targetRoleId);
            
            List<String> roleNames = jdbcTemplate.query(
                    "SELECT nombre_rol FROM pos_rbac.rol WHERE id = ?",
                    (rs, rowNum) -> rs.getString("nombre_rol"),
                    targetRoleId
            );
            if (!roleNames.isEmpty()) {
                targetRoleName = roleNames.get(0);
            }
        } else {
            // Leer rol actual
            List<String> roleNames = jdbcTemplate.query(
                    "SELECT r.nombre_rol FROM pos_rbac.r_usuario_rol ur JOIN pos_rbac.rol r ON r.id = ur.rol_id WHERE ur.usuario_id = ?",
                    (rs, rowNum) -> rs.getString("nombre_rol"),
                    id
            );
            if (!roleNames.isEmpty()) {
                targetRoleName = roleNames.get(0);
            }
        }

        String fullName = (!lastName.isEmpty()) ? (firstName + " " + lastName).trim() : firstName;
        String status = (req.status() != null && !req.status().isEmpty()) ? req.status() : "ACTIVO";

        UserDto updatedUser = new UserDto(
                id,
                doc,
                fullName,
                firstName,
                lastName,
                phone,
                email,
                targetRoleName,
                targetRoleId != null ? targetRoleId : 4L,
                "",
                status,
                !"SUSPENDIDO".equalsIgnoreCase(status),
                ""
        );

        return ResponseEntity.ok(Map.of(
                "message", "Usuario '" + fullName + "' modificado con éxito en pos_rbac",
                "user", updatedUser
        ));
    }

    /**
     * Alterna o establece el estado activo/suspendido de un usuario
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (id == 1L) {
            return ResponseEntity.badRequest().body(Map.of("message", "No es posible suspender la cuenta de Super Administrador principal"));
        }

        String newStatus = "ACTIVO";
        int newActivo = 1;

        if (body != null) {
            if (body.containsKey("status")) {
                newStatus = String.valueOf(body.get("status")).toUpperCase();
                newActivo = "SUSPENDIDO".equalsIgnoreCase(newStatus) || "INACTIVO".equalsIgnoreCase(newStatus) ? 0 : 1;
                newStatus = (newActivo == 1) ? "ACTIVO" : "SUSPENDIDO";
            } else if (body.containsKey("active")) {
                boolean active = Boolean.parseBoolean(String.valueOf(body.get("active")));
                newActivo = active ? 1 : 0;
                newStatus = active ? "ACTIVO" : "SUSPENDIDO";
            }
        }

        int updated = jdbcTemplate.update("UPDATE pos_rbac.usuario SET activo = ? WHERE id = ?", newActivo, id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of(
                    "message", "Estado del usuario actualizado a " + newStatus,
                    "status", newStatus,
                    "active", newActivo == 1
            ));
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * Inactiva / elimina un usuario del sistema
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (id == 1L) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se permite eliminar al usuario SUPERADMIN del sistema"));
        }

        // Inactivar usuario de forma segura
        int updated = jdbcTemplate.update("UPDATE pos_rbac.usuario SET activo = 0 WHERE id = ?", id);
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("message", "Usuario inactivado / suspendido exitosamente"));
        }

        return ResponseEntity.notFound().build();
    }

    // Records DTO
    public record UserDto(
            Long id,
            String doc,
            String name,
            String firstName,
            String lastName,
            String phone,
            String email,
            String role,
            Long roleId,
            String roleDesc,
            String status,
            boolean active,
            String createdAt) {
    }

    public record RoleDto(Long id, String name, String description) {}

    public record CreateUserRequest(
            String doc,
            String name,
            String firstName,
            String lastName,
            String phone,
            String email,
            String password,
            String role,
            Long roleId) {
    }

    public record UpdateUserRequest(
            String doc,
            String name,
            String firstName,
            String lastName,
            String phone,
            String email,
            String password,
            String role,
            Long roleId,
            String status) {
    }
}
