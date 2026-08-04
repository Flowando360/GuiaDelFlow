import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Placeholder hasta que se construyan los Tasks de generación (Guía y
 * Carta). Por ahora solo confirma que el cuestionario quedó guardado.
 */
export default async function ResultadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('completado_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cuestionario?.completado_at) {
    redirect('/cuestionario');
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Listo, lo recibimos!</h1>
        <p className="mt-3 text-sm leading-relaxed text-flow-800">
          Terminaste el cuestionario. Tu Guía del Flow y tu Carta personal todavía no se generan
          automáticamente — esa parte se construye en el siguiente paso del proyecto.
        </p>
      </div>
    </main>
  );
}
