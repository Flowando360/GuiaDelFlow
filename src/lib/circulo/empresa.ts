import { createAdminClient } from '@/lib/supabase/server';

/**
 * Nombre de la empresa (Círculo de Crecimiento) y de su líder de talento
 * humano, a partir de `flow_perfiles.colaborador_circulo_id`. Se usa para
 * personalizar el correo final (Guía+Carta) — ver enviarCorreoDocumentos en
 * src/lib/email/enviar.ts — con "Es un regalo que hoy {empresa} te hace" y
 * "comunícate con {firmante_nombre}".
 *
 * null si la cuenta no está vinculada a ningún colaborador (registro
 * directo, sin invitación de una empresa cliente) — el llamador decide el
 * texto genérico de respaldo en ese caso.
 */
export async function obtenerEmpresaYFirmante(
  colaboradorId: string | null
): Promise<{ empresa: string; firmanteNombre: string | null } | null> {
  if (!colaboradorId) return null;

  const admin = createAdminClient();

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('empresa_id')
    .eq('id', colaboradorId)
    .maybeSingle();

  if (!colaborador) return null;

  const { data: empresa } = await admin
    .from('empresas')
    .select('nombre, firmante_nombre')
    .eq('id', colaborador.empresa_id)
    .maybeSingle();

  if (!empresa) return null;

  return { empresa: empresa.nombre, firmanteNombre: empresa.firmante_nombre };
}
