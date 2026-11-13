package com.pos.inventario.role;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/roles", "/api/rbac/roles"})
public class RoleController {

    private final JdbcTemplate jdbcTemplate;

    public RoleController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Lista todos los roles con métricas de usuarios asignados, módulos habilitados y permisos
     */
    @GetMapping
    public List<RoleDto> getRoles() {
        String sql = """
            SELECT 
                r.id,
                r.nombre_rol,
                COALESCE(r.descripcion, '') AS descripcion,
                (SELECT COUNT(*) FROM pos_rbac.r_usuario_rol ur WHERE ur.rol_id = r.id) AS users_count,
                (SELECT COUNT(*) FROM pos_rbac.r_modulo_rol mr WHERE mr.rol_id = r.id AND mr.habilitado = 1) AS modules_count,
                (SELECT COUNT(*) FROM pos_rbac.vistas_permiso vp 
                 JOIN pos_rbac.r_modulo_rol mr ON mr.id = vp.r_modulo_rol_id 
                 WHERE mr.rol_id = r.id AND vp.permitido = 1) AS permissions_count
            FROM pos_rbac.rol r
            ORDER BY r.id ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new RoleDto(
                rs.getLong("id"),
                rs.getString("nombre_rol"),
                rs.getString("descripcion"),
                rs.getLong("users_count"),
                rs.getLong("modules_count"),
                rs.getLong("permissions_count"),
                "ACTIVO"
        ));
    }

    /**
     * Registra un nuevo rol en pos_rbac.rol
     */
    @PostMapping
    public ResponseEntity<?> createRole(@RequestBody CreateRoleRequest req) {
        if (req == null || req.name() == null || req.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del rol es obligatorio"));
        }

        String roleName = req.name().trim().toUpperCase().replace(" ", "_");
        String desc = req.description() != null ? req.description().trim() : "";

        // Validar unicidad
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pos_rbac.rol WHERE UPPER(nombre_rol) = ?",
                Integer.class,
                roleName
        );
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ya existe un rol con el nombre '" + roleName + "'"));
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String sql = "INSERT INTO pos_rbac.rol (nombre_rol, descripcion) VALUES (?, ?)";

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, roleName);
            ps.setString(2, desc);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        Long newId = (key != null) ? key.longValue() : 0L;

        // Por defecto, inicializar módulos deshabilitados para este rol
        List<Long> moduleIds = jdbcTemplate.query("SELECT id FROM pos_rbac.modulo ORDER BY id ASC", (rs, rowNum) -> rs.getLong("id"));
        for (Long modId : moduleIds) {
            jdbcTemplate.update("INSERT INTO pos_rbac.r_modulo_rol (rol_id, modulo_id, habilitado) VALUES (?, ?, 0)", newId, modId);
        }

        RoleDto created = new RoleDto(newId, roleName, desc, 0L, 0L, 0L, "ACTIVO");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Rol '" + roleName + "' creado exitosamente en el catálogo RBAC",
                "role", created
        ));
    }

    /**
     * Modifica el nombre y descripción de un rol existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest req) {
        if (req == null || req.name() == null || req.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del rol es obligatorio"));
        }

        String roleName = req.name().trim().toUpperCase().replace(" ", "_");
        String desc = req.description() != null ? req.description().trim() : "";

        // Protección de rol SUPERADMIN (id 1)
        if (id == 1L && !roleName.equals("SUPERADMIN")) {
            return ResponseEntity.badRequest().body(Map.of("message", "No es posible renombrar el rol SUPERADMIN del sistema"));
        }

        // Validar unicidad descartando el rol actual
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pos_rbac.rol WHERE UPPER(nombre_rol) = ? AND id != ?",
                Integer.class,
                roleName,
                id
        );
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ya existe otro rol con el nombre '" + roleName + "'"));
        }

        int updated = jdbcTemplate.update(
                "UPDATE pos_rbac.rol SET nombre_rol = ?, descripcion = ? WHERE id = ?",
                roleName,
                desc,
                id
        );

        if (updated > 0) {
            RoleDto updatedRole = new RoleDto(id, roleName, desc, 0L, 0L, 0L, "ACTIVO");
            return ResponseEntity.ok(Map.of(
                    "message", "Rol '" + roleName + "' modificado con éxito",
                    "role", updatedRole
            ));
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * Elimina un rol si no tiene operadores vinculados
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        if (id == 1L) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se permite eliminar el rol SUPERADMIN principal"));
        }
        if (id == 2L || id == 4L) {
            // Protección de roles estándar
            return ResponseEntity.badRequest().body(Map.of("message", "No es recomendable eliminar los roles base del sistema (ADMINISTRADOR / CAJERO)"));
        }

        // Validar si existen usuarios asignados
        Integer usersCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pos_rbac.r_usuario_rol WHERE rol_id = ?",
                Integer.class,
                id
        );
        if (usersCount != null && usersCount > 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "No se puede eliminar el rol porque está asignado a " + usersCount + " usuario(s). Reasigne a los usuarios primero."
            ));
        }

        // Limpieza de relaciones en vistas_permiso y r_modulo_rol
        jdbcTemplate.update("""
            DELETE vp FROM pos_rbac.vistas_permiso vp
            JOIN pos_rbac.r_modulo_rol rmr ON rmr.id = vp.r_modulo_rol_id
            WHERE rmr.rol_id = ?
            """, id);

        jdbcTemplate.update("DELETE FROM pos_rbac.r_modulo_rol WHERE rol_id = ?", id);
        int deleted = jdbcTemplate.update("DELETE FROM pos_rbac.rol WHERE id = ?", id);

        if (deleted > 0) {
            return ResponseEntity.ok(Map.of("message", "Rol eliminado exitosamente"));
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * Devuelve la matriz completa de módulos, vistas y permisos configurados para un rol
     */
    @GetMapping("/{id}/matrix")
    public RoleMatrixDto getRoleMatrix(@PathVariable Long id) {
        // 1. Obtener datos del rol
        List<Map<String, Object>> roleRows = jdbcTemplate.queryForList(
                "SELECT id, nombre_rol, descripcion FROM pos_rbac.rol WHERE id = ?", 
                id
        );
        if (roleRows.isEmpty()) {
            return null;
        }
        Map<String, Object> rMap = roleRows.get(0);
        String roleName = String.valueOf(rMap.get("nombre_rol"));
        String roleDesc = rMap.get("descripcion") != null ? String.valueOf(rMap.get("descripcion")) : "";

        // 2. Obtener todos los módulos con su estado de habilitación para este rol
        String modSql = """
            SELECT 
                m.id,
                m.nombre_modulo,
                COALESCE(m.descripcion, '') AS descripcion,
                COALESCE(m.icono, 'dashboard') AS icono,
                m.orden,
                COALESCE(rmr.id, 0) AS r_modulo_rol_id,
                COALESCE(rmr.habilitado, 0) AS habilitado
            FROM pos_rbac.modulo m
            LEFT JOIN pos_rbac.r_modulo_rol rmr ON rmr.modulo_id = m.id AND rmr.rol_id = ?
            ORDER BY m.orden ASC, m.id ASC
            """;

        List<ModuleMatrixDto> modules = jdbcTemplate.query(modSql, (rs, rowNum) -> {
            Long modId = rs.getLong("id");
            Long rmrId = rs.getLong("r_modulo_rol_id");
            boolean modHabilitado = rs.getInt("habilitado") == 1;

            // 3. Obtener las vistas pertenecientes a este módulo
            String vistasSql = """
                SELECT 
                    v.id,
                    v.nombre_vista,
                    COALESCE(v.icono, 'dashboard') AS icono,
                    v.ruta_acceso,
                    COALESCE(v.descripcion, '') AS descripcion,
                    v.orden,
                    COALESCE(vp.permitido, 0) AS acceso_permitido
                FROM pos_rbac.vistas v
                LEFT JOIN pos_rbac.vistas_permiso vp ON vp.vista_id = v.id 
                    AND vp.r_modulo_rol_id = ? 
                    AND vp.permiso_id = 1
                WHERE v.id_modulo = ?
                ORDER BY v.orden ASC, v.id ASC
                """;

            List<ViewMatrixDto> vistas = jdbcTemplate.query(vistasSql, (vRs, vRowNum) -> {
                Long vistaId = vRs.getLong("id");
                boolean vistaAcceso = vRs.getInt("acceso_permitido") == 1;

                // 4. Si la vista tiene permisos específicos (ej. Terminal POS con Registrar, Anular, etc.)
                List<PermissionItemDto> permisos = new ArrayList<>();
                if (vistaId == 1L) {
                    // Terminal POS: consultar permisos granulares de venta
                    String permSql = """
                        SELECT 
                            p.id,
                            p.nombre_permiso,
                            p.descripcion,
                            COALESCE(vp.permitido, 0) AS permitido
                        FROM pos_rbac.permisos p
                        LEFT JOIN pos_rbac.vistas_permiso vp ON vp.permiso_id = p.id 
                            AND vp.vista_id = 1 
                            AND vp.r_modulo_rol_id = ?
                        WHERE p.id > 1
                        ORDER BY p.id ASC
                        """;

                    permisos = jdbcTemplate.query(permSql, (pRs, pRowNum) -> new PermissionItemDto(
                            pRs.getLong("id"),
                            pRs.getString("nombre_permiso"),
                            pRs.getString("descripcion"),
                            pRs.getInt("permitido") == 1
                    ), rmrId);
                }

                return new ViewMatrixDto(
                        vistaId,
                        vRs.getString("nombre_vista"),
                        vRs.getString("icono"),
                        vRs.getString("ruta_acceso"),
                        vRs.getString("descripcion"),
                        vistaAcceso,
                        permisos
                );
            }, rmrId, modId);

            return new ModuleMatrixDto(
                    modId,
                    rs.getString("nombre_modulo"),
                    rs.getString("descripcion"),
                    rs.getString("icono"),
                    modHabilitado,
                    vistas
            );
        }, id);

        return new RoleMatrixDto(id, roleName, roleDesc, modules);
    }

    /**
     * Guarda la matriz de acceso de módulos, vistas y permisos granulares de un rol
     */
    @PutMapping("/{id}/matrix")
    public ResponseEntity<?> updateRoleMatrix(@PathVariable Long id, @RequestBody UpdateMatrixRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Datos de matriz no válidos"));
        }

        // Si es el Superadmin (id = 1), mantener acceso irrestricto
        if (id == 1L) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "El rol SUPERADMIN posee privilegios totales fijos y no puede ser restringido"
            ));
        }

        List<ModuleSaveDto> moduleSettings = req.modules() != null ? req.modules() : List.of();

        for (ModuleSaveDto mod : moduleSettings) {
            Long modId = mod.moduleId();
            boolean modHabilitado = mod.enabled();

            // Asegurar que existe el registro en r_modulo_rol
            List<Long> rmrIds = jdbcTemplate.query(
                    "SELECT id FROM pos_rbac.r_modulo_rol WHERE rol_id = ? AND modulo_id = ?",
                    (rs, rowNum) -> rs.getLong("id"),
                    id,
                    modId
            );

            Long rmrId;
            if (rmrIds.isEmpty()) {
                KeyHolder kh = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO pos_rbac.r_modulo_rol (rol_id, modulo_id, habilitado) VALUES (?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                    );
                    ps.setLong(1, id);
                    ps.setLong(2, modId);
                    ps.setInt(3, modHabilitado ? 1 : 0);
                    return ps;
                }, kh);
                rmrId = (kh.getKey() != null) ? kh.getKey().longValue() : 0L;
            } else {
                rmrId = rmrIds.get(0);
                jdbcTemplate.update(
                        "UPDATE pos_rbac.r_modulo_rol SET habilitado = ? WHERE id = ?",
                        modHabilitado ? 1 : 0,
                        rmrId
                );
            }

            // Procesar vistas del módulo
            if (mod.views() != null) {
                for (ViewSaveDto v : mod.views()) {
                    Long vistaId = v.viewId();
                    boolean accesoVista = v.enabled() && modHabilitado;

                    // Permiso 1: ACCESO_VISTA
                    saveViewPermission(rmrId, vistaId, 1L, accesoVista);

                    // Permisos granulares de la vista (ej. Terminal POS: venta, anulación, descuento)
                    if (v.permissions() != null) {
                        for (PermissionSaveDto p : v.permissions()) {
                            boolean permitido = p.allowed() && accesoVista;
                            saveViewPermission(rmrId, vistaId, p.permissionId(), permitido);
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Matriz de roles, módulos y permisos actualizada con éxito en pos_rbac"
        ));
    }

    private void saveViewPermission(Long rmrId, Long vistaId, Long permisoId, boolean permitido) {
        List<Long> vpIds = jdbcTemplate.query(
                "SELECT id FROM pos_rbac.vistas_permiso WHERE r_modulo_rol_id = ? AND vista_id = ? AND permiso_id = ?",
                (rs, rowNum) -> rs.getLong("id"),
                rmrId,
                vistaId,
                permisoId
        );

        if (vpIds.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO pos_rbac.vistas_permiso (r_modulo_rol_id, vista_id, permiso_id, permitido) VALUES (?, ?, ?, ?)",
                    rmrId,
                    vistaId,
                    permisoId,
                    permitido ? 1 : 0
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE pos_rbac.vistas_permiso SET permitido = ? WHERE id = ?",
                    permitido ? 1 : 0,
                    vpIds.get(0)
            );
        }
    }

    // Records DTO
    public record RoleDto(
            Long id,
            String name,
            String description,
            Long usersCount,
            Long modulesCount,
            Long permissionsCount,
            String status) {
    }

    public record CreateRoleRequest(String name, String description) {}
    public record UpdateRoleRequest(String name, String description) {}

    public record RoleMatrixDto(
            Long roleId,
            String roleName,
            String description,
            List<ModuleMatrixDto> modules) {
    }

    public record ModuleMatrixDto(
            Long moduleId,
            String moduleName,
            String description,
            String icon,
            boolean enabled,
            List<ViewMatrixDto> views) {
    }

    public record ViewMatrixDto(
            Long viewId,
            String viewName,
            String icon,
            String route,
            String description,
            boolean enabled,
            List<PermissionItemDto> permissions) {
    }

    public record PermissionItemDto(
            Long permissionId,
            String name,
            String description,
            boolean allowed) {
    }

    public record UpdateMatrixRequest(List<ModuleSaveDto> modules) {}

    public record ModuleSaveDto(
            Long moduleId,
            boolean enabled,
            List<ViewSaveDto> views) {
    }

    public record ViewSaveDto(
            Long viewId,
            boolean enabled,
            List<PermissionSaveDto> permissions) {
    }

    public record PermissionSaveDto(
            Long permissionId,
            boolean allowed) {
    }
}
