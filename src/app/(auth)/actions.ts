'use server';

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { vincularInvitacion } from '@/lib/circulo/invitacion';
import { vincularLinkEnvio } from '@/lib/envio/enlace';

export interface EstadoAuth {
  error?: string;
  mensaje?: string;
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

  // Cuando el correo ya tiene una cuenta CONFIRMADA, Supabase no lo dice
  // con un error — por diseño, para no revelar a un atacante qué correos
  // están registrados, signUp() responde como si hubiera creado una cuenta
  // nueva (sin mandar ningún correo de verdad) y el formulario redirige a
  // "revisa tu correo" sin que nunca llegue nada. La señal real está acá:
  // Supabase devuelve el usuario existente pero con identities: [] (un
  // registro genuinamente nuevo trae al menos una identity). Sin este
  // chequeo, la persona queda esperando un correo que nunca se manda, sin
  // ninguna pista de por qué.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'Ese correo ya tiene una cuenta — probá iniciar sesión en vez de crear una nueva.' };
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

  // Se manda el id (no el correo) para que /registro/revisa-tu-correo pueda
  // consultar si ya se confirmó sin exponer datos personales en la URL —
  // ver src/app/api/auth/estado-confirmacion/route.ts.
  redirect(`/registro/revisa-tu-correo?id=${data.user?.id ?? ''}`);
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
    // Antes esto caía siempre en "correo o contraseña incorrectos" sin
    // importar la causa real — con una cuenta bloqueada (ban_duration en
    // Supabase) o cualquier otro error distinto a credenciales inválidas,
    // eso es directamente falso y confunde a quien lee "pero si mi
    // contraseña SÍ es correcta". Se distinguen los casos que sí tienen
    // una causa concreta y un mensaje honesto.
    const mensaje = error.message.toLowerCase();
    if (mensaje.includes('email not confirmed')) {
      return { error: 'Todavía no confirmaste tu correo — revisá tu bandeja de entrada.' };
    }
    if (error.code === 'user_banned' || mensaje.includes('banned')) {
      return { error: 'Esta cuenta está bloqueada. Escribinos si creés que es un error.' };
    }
    if (error.code !== 'invalid_credentials' && !mensaje.includes('invalid login credentials')) {
      return { error: `No se pudo iniciar sesión: ${error.message}` };
    }
    return { error: 'Correo o contraseña incorrectos.' };
  }

  redirect('/cuestionario');
}

export async function recuperarContrasena(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { error: 'Escribe tu correo.' };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/nueva-contrasena`,
  });

  // Siempre el mismo mensaje exista o no la cuenta con ese correo — evita
  // revelar qué correos están registrados (mismo motivo que el chequeo de
  // identities en registrarse()).
  return {
    mensaje: 'Si ese correo tiene una cuenta, te mandamos un link para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).',
  };
}

export async function actualizarContrasena(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El link de "olvidé mi contraseña" deja una sesión temporal de
  // recuperación al hacer clic (vía /auth/callback) — si no hay sesión acá
  // es porque el link ya expiró, ya se usó, o llegaron directo sin pasar
  // por ese link.
  if (!user) {
    return { error: 'Este link ya expiró o no es válido — pedí uno nuevo desde "Olvidé mi contraseña".' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect('/cuestionario');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
