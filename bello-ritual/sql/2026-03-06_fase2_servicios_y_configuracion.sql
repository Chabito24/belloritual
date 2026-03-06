USE belloritual;

-- =========================================================
-- FASE 2: SERVICIOS + CONFIGURACION DEL SITIO
-- =========================================================

-- ---------------------------------------------------------
-- 1) ALTER servicios
--    - duracion_minutos: duración real del servicio
--    - requiere_materiales: activa flujo de materiales en admin
--    - precio_venta: precio final editable y visible al cliente
-- ---------------------------------------------------------
ALTER TABLE servicios
  ADD COLUMN duracion_minutos SMALLINT UNSIGNED NULL AFTER nombre,
  ADD COLUMN requiere_materiales TINYINT(1) NOT NULL DEFAULT 0 AFTER duracion_minutos,
  ADD COLUMN precio_venta DECIMAL(12,2) NULL AFTER margen_porcentaje;

-- Backfill:
-- Si un servicio ya tiene materiales asociados, se marca como requiere_materiales = 1
UPDATE servicios s
SET requiere_materiales = 1
WHERE EXISTS (
  SELECT 1
  FROM servicio_materiales sm
  WHERE sm.servicio_id = s.id
);

-- ---------------------------------------------------------
-- 2) TABLA configuracion_sitio
--    Una fila principal para branding y datos básicos
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion_sitio (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  logo_url VARCHAR(500) NULL,
  logo_storage_key VARCHAR(255) NULL,
  color_primario VARCHAR(20) NOT NULL DEFAULT '#111827',
  color_secundario VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  color_acento VARCHAR(20) NOT NULL DEFAULT '#EC4899',
  dark_mode_habilitado TINYINT(1) NOT NULL DEFAULT 0,
  whatsapp VARCHAR(30) NULL,
  direccion VARCHAR(150) NULL,
  ciudad VARCHAR(80) NULL,
  departamento VARCHAR(80) NULL,
  horarios_json JSON NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fila inicial por defecto
INSERT INTO configuracion_sitio (
  logo_url,
  logo_storage_key,
  color_primario,
  color_secundario,
  color_acento,
  dark_mode_habilitado,
  whatsapp,
  direccion,
  ciudad,
  departamento,
  horarios_json
)
SELECT
  NULL,
  NULL,
  '#111827',
  '#FFFFFF',
  '#EC4899',
  0,
  NULL,
  NULL,
  NULL,
  NULL,
  JSON_OBJECT(
    'lunes_a_viernes', '09:00-18:00',
    'sabado', '09:00-13:00',
    'domingo', 'cerrado'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM configuracion_sitio
);