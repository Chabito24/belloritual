USE belloritual;

-- =========================================================
-- FASE 1: ESTRUCTURA BASE
-- 1) Unidades de medida
-- 2) Relación N:M subcategorias <-> categorias
-- 3) Categorias destacadas para home
-- 4) Slugs para rutas públicas
-- NOTA: por compatibilidad NO se elimina todavía el campo enum `unidad`
--       de materiales ni `categoria_id` de subcategorias.
-- =========================================================

-- ---------------------------------------------------------
-- 1. TABLA unidades_medida
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS unidades_medida (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(40) NOT NULL,
  abreviatura VARCHAR(15) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_unidades_medida_nombre (nombre),
  UNIQUE KEY uq_unidades_medida_abreviatura (abreviatura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO unidades_medida (nombre, abreviatura, activo)
VALUES
  ('Unidad', 'UNIDAD', 1),
  ('Hora', 'HORA', 1),
  ('Minuto', 'MINUTO', 1),
  ('Mililitro', 'ML', 1),
  ('Gramo', 'G', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  abreviatura = VALUES(abreviatura),
  activo = VALUES(activo);

-- ---------------------------------------------------------
-- 2. ALTER materiales
--    Se agrega FK nueva, pero se conserva `unidad` por compatibilidad
-- ---------------------------------------------------------
ALTER TABLE materiales
  ADD COLUMN unidad_medida_id INT UNSIGNED NULL AFTER tipo;

UPDATE materiales m
INNER JOIN unidades_medida um
  ON um.abreviatura = m.unidad
SET m.unidad_medida_id = um.id
WHERE m.unidad_medida_id IS NULL;

ALTER TABLE materiales
  ADD CONSTRAINT fk_materiales_unidad_medida
    FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id);

CREATE INDEX idx_materiales_unidad_medida_id
  ON materiales (unidad_medida_id);

-- ---------------------------------------------------------
-- 3. ALTER categorias
--    - slug para /servicios/{categoria}
--    - es_destacada_home para las 3 categorías del home
-- ---------------------------------------------------------
ALTER TABLE categorias
  ADD COLUMN slug VARCHAR(120) NULL AFTER nombre,
  ADD COLUMN es_destacada_home TINYINT(1) NOT NULL DEFAULT 0 AFTER activo;

CREATE UNIQUE INDEX uq_categorias_slug
  ON categorias (slug);

-- ---------------------------------------------------------
-- 4. ALTER subcategorias
--    - slug para /servicios/{categoria}/{subcategoria}
-- ---------------------------------------------------------
ALTER TABLE subcategorias
  ADD COLUMN slug VARCHAR(120) NULL AFTER nombre;

CREATE UNIQUE INDEX uq_subcategorias_slug
  ON subcategorias (slug);

-- ---------------------------------------------------------
-- 5. TABLA pivote subcategoria_categorias
--    Mantendremos temporalmente subcategorias.categoria_id
--    hasta actualizar API/UI y validar todo
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS subcategoria_categorias (
  subcategoria_id INT UNSIGNED NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subcategoria_id, categoria_id),
  CONSTRAINT fk_sc_subcategoria
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sc_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sc_categoria_id
  ON subcategoria_categorias (categoria_id);

-- Backfill inicial desde el modelo viejo 1:N
INSERT INTO subcategoria_categorias (subcategoria_id, categoria_id)
SELECT s.id, s.categoria_id
FROM subcategorias s
LEFT JOIN subcategoria_categorias sc
  ON sc.subcategoria_id = s.id
 AND sc.categoria_id = s.categoria_id
WHERE sc.subcategoria_id IS NULL;