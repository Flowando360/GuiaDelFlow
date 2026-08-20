import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { cerrarSesion } from '../(auth)/actions';
import { IMG } from '@/lib/imagenesWeb';

/**
 * Todo lo que vive bajo /panel es exclusivo de la superusuaria — el gate
 * queda acá una sola vez para no repetirlo en cada página hija.
 */
export default async function PanelLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!esAdmin(user.email)) redirect('/');

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-flow-50/40">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Image src={IMG.logo} alt="FlowAndo" width={120} height={34} className="h-7 w-auto" />
          <nav className="flex items-center gap-4 text-sm font-semibold text-flow-800">
            <Link href="/panel" className="hover:text-flow-600">
              Panel
            </Link>
            <Link href="/panel/links" className="hover:text-flow-600">
              Links de envío
            </Link>
          </nav>
        </div>
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
