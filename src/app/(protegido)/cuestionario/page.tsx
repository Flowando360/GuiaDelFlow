import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PASOS, codigosDelPaso } from '@/lib/cuestionario/estructura';
import { CuestionarioForm } from './CuestionarioForm';

type RespuestasJson = Record<string, unknown>;

function calcularPasoDeInicio(respuestas: RespuestasJson): number {
  const demograficos = (respuestas.demograficos as RespuestasJson) ?? {};
  const cuestionamientos = (respuestas.cuestionamientos as RespuestasJson) ?? {};
  const likert = (respuestas.likert as RespuestasJson) ?? {};

  for (let i = 0; i < PASOS.length; i++) {
    const paso = PASOS[i];
    if (paso.tipo === 'demografico') {
      const faltaAlguno = paso.campos.some((c) => c.requerido && !demograficos[c.id]);
      if (faltaAlguno) return i;
    } else if (paso.tipo === 'cuestionamientos') {
      const campos = ['razon', 'cuestionamiento_1', 'cuestionamiento_2', 'cuestionamiento_3'];
      if (campos.some((c) => !cuestionamientos[c])) return i;
    } else if (paso.tipo === 'likert') {
      if (codigosDelPaso(paso).some((c) => likert[c] === undefined)) return i;
    } else if (paso.tipo === 'ninez') {
      if (paso.codigos.some((c) => likert[c] === undefined)) return i;
    }
  }
  return PASOS.length - 1;
}

export default async function CuestionarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: cuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cuestionario) {
    const { data: nuevo, error } = await supabase
      .from('flow_cuestionarios')
      .insert({ usuario_id: user.id, respuestas: {} })
      .select('*')
      .single();
    if (error) throw error;
    cuestionario = nuevo;
  }

  if (cuestionario.completado_at) {
    redirect('/resultado');
  }

  const respuestas = (cuestionario.respuestas as RespuestasJson) ?? {};
  const pasoInicial = calcularPasoDeInicio(respuestas);

  return (
    <CuestionarioForm
      cuestionarioId={cuestionario.id}
      respuestasIniciales={respuestas}
      pasoInicial={pasoInicial}
    />
  );
}
