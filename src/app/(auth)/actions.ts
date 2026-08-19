'use server';

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { vincularInvitacion } from '@/lib/circulo/invitacion';
import { vincularLinkEnvio } from '@/lib/envio/enlace';

export interface EstadoAuth {
  error?: string;
}

export async function registrarse(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nombreCompleto = String(formData.get('nombre_completo') ?? '').trim();
  const invitacionToken = String(formData.get('invitacion_token') ?? '').trim();
  const envioToken = String(formData.get('envio_token') ?? '').trim();
  const autorizaCirculo = formData.get('autorizacion_circulo') === 'si';

  if (!email || !password || !nombreCompleto) {
    return { error: 'Completá todos los campos.' };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!autorizaCirculo) {
    return { error: 'Necesitamos tu autorización explícita para poder crear tu cuenta.' };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre_completo: nombreCompleto },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Ese correo ya tiene una cuenta — probá iniciar sesión.' };
    }
    return { error: error.message };
  }

  if (data.user) {
    // Queda registrada la autorización explícita — sincronizar.ts nunca
    // comparte nada sin esto, sin importar si hay match por correo o
    // invitación. Nunca bloquea el registro si falla.
    try {
      const admin = createAdminClient();
      await admin
        .from('flow_perfiles')
        .update({ autorizacion_circulo_en: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch (e) {
      console.error('No se pudo guardar la autorización de Círculo de Crecimiento:', e);
    }

    // Si vino de un link de invitación de Círculo de Crecimiento, deja la
    // cuenta ya vinculada a ese colaborador — sin esto, sincronizar.ts cae
    // de vuelta al emparejamiento por correo. Nunca bloquea el registro si
    // falla (ver comentario en vincularInvitacion).
    if (invitacionToken) {
      await vincularInvitacion(data.user.id, invitacionToken);
    }

    // Si vino de un link de envío configurado (?envio=, ver
    // src/lib/envio/enlace.ts), deja la cuenta marcada para que
    // /api/generar-carta mande el correo final a ese destinatario en vez
    // de al dueño de la cuenta. Nunca bloquea el registro si falla.
    if (envioToken) {
      await vincularLinkEnvio(data.user.id, envioToken);
    }
  }

  redirect('/registro/revisa-tu-correo');
}

export async function iniciarSesion(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Completá tu correo y contraseña.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Todavía no confirmaste tu correo — revisá tu bandeja de entrada.' };
    }
    return { error: 'Correo o contraseña incorrectos.' };
  }

  redirect('/cuestionario');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
