-- ============================================================================
-- 0011_flow_pilares_estados.sql
--
-- Nuevos valores del enum flow_pilares_estado, en su propia migración: un
-- ALTER TYPE ... ADD VALUE no se puede usar en la misma transacción en la
-- que se agrega (Postgres lo bloquea con "unsafe use of new value... must
-- be committed before they can be used") -- por eso separado de
-- 0012_flow_pilares_flujo_v2.sql, que sí usa 'jugando' como default.
-- ============================================================================

alter type flow_pilares_estado add value if not exists 'jugando';
alter type flow_pilares_estado add value if not exists 'esperando_correo';
