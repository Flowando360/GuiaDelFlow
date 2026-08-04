export default function RevisaTuCorreoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Revisá tu correo</h1>
        <p className="mt-3 text-sm leading-relaxed text-flow-800">
          Te mandamos un link de confirmación. Hacé click ahí para activar tu cuenta y empezar tu
          cuestionario.
        </p>
      </div>
    </main>
  );
}
