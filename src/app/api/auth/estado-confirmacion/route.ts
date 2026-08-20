import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Consultado por /registro/revisa-tu-correo (polling) para saber si la
 * cuenta recién creada ya quedó confirmada — pasa esto SIN que la persona
 * haya hecho clic en el link ella misma cuando, por ejemplo, el filtro de
 * seguridad de correo de una empresa/universidad "abre" el link de
 * confirmación automáticamente para escanearlo antes de que la persona
 * vea el mensaje (pasa con Microsoft Defender/Proofpoint y similares). Sin
 * esto, la persona se queda mirando "revisa tu correo" esperando un correo
 * que ya cumplió su propósito, sin ninguna señal de que ya puede continuar.
 *
 * Recibe el id (uuid) de auth.users, no el correo — evitamos poner datos
 * personales en la URL, y de paso no hay forma de usar esto para adivinar
 * si un correo cualquiera está registrado (solo sirve el id exacto que
 * Supabase devolvió al propio navegador al registrarse).
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(id);

  if (error || !data.user) {
    return NextResponse.json({ confirmado: false });
  }

  return NextResponse.json({
    confirmado: Boolean(data.user.email_confirmed_at),
    email: data.user.email ?? null,
  });
}
