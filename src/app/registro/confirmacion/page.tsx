import Link from 'next/link';

export default function ConfirmacionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="card max-w-sm p-8 text-center">
        <h1 className="text-2xl">Revisa tu email</h1>
        <p className="mt-3 text-sm text-navy/70">
          Te hemos enviado un enlace de confirmación. Ábrelo para activar tu cuenta y podrás
          entrar directamente a tu semana.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
