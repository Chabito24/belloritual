-- =========================================================
-- FASE 4: SERVICIOS
-- Agregar categoria_id explícita a servicios
-- para soportar el flujo:
-- Categoria -> Subcategoria -> Servicio -> Materiales
-- =========================================================

ALTER TABLE servicios
  ADD COLUMN categoria_id INT UNSIGNED NULL AFTER subcategoria_id;

ALTER TABLE servicios
  ADD CONSTRAINT fk_servicios_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

CREATE INDEX idx_servicios_categoria_id
  ON servicios (categoria_id);