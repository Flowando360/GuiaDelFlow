import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cerrarSesion } from '../(auth)/actions';

export default async function ProtegidoLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-sm font-bold uppercase tracking-widest text-flow-600">Guía del Flow</span>
        <form action={cerrarSesion}>
          <button type="submit" className="text-sm font-semibold text-flow-800 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
