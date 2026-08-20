import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cerrarSesion } from '../(auth)/actions';
import { IMG } from '@/lib/imagenesWeb';
import { asegurarPerfil } from '@/lib/perfil/asegurar';

export default async function ProtegidoLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await asegurarPerfil(user);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Image src={IMG.logo} alt="FlowAndo" width={120} height={34} className="h-7 w-auto" />
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
