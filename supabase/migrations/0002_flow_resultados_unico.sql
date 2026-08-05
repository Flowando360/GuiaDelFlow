-- ============================================================================
-- 0002_flow_resultados_unico.sql
-- flow_resultados no tenía ningún constraint que evitara más de un
-- cálculo por cuestionario. El código ya se protege solo (borra el
-- cálculo anterior antes de insertar el nuevo), pero este constraint es
-- una segunda capa de seguridad a nivel de base de datos — opcional de
-- correr, no bloquea nada si no se corre.
-- ============================================================================

alter table public.flow_resultados
  add constraint flow_resultados_cuestionario_id_key unique (cuestionario_id);
