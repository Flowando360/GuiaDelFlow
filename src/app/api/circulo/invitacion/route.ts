import { NextRequest, NextResponse } from 'next/server';
import { leerInvitacion } from '@/lib/circulo/invitacion';

/**
 * Lectura pública (sin autenticar — la persona todavía no tiene cuenta)
 * de una invitación por token, solo para prellenar nombre/correo en el
 * formulario de registro. No expone nada más que eso.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ nombre: null, correo: null });

  const invitacion = await leerInvitacion(token);
  return NextResponse.json(invitacion ?? { nombre: null, correo: null });
}
