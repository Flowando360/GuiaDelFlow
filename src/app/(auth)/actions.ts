'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface EstadoAuth {
  error?: string;
}

export async function registrarse(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nombreCompleto = String(formData.get('nombre_completo') ?? '').trim();

  if (!email || !password || !nombreCompleto) {
    return { error: 'Completá todos los campos.' };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.signUp({
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
