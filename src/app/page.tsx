import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserAndProfile, homePathForRole } from '@/lib/auth/get-profile';

export default async function HomePage() {
  const { userId, profile } = await getCurrentUserAndProfile();

  if (userId) {
    redirect(homePathForRole(profile?.role));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 text-center text-white">
      <h1 className="text-5xl sm:text-6xl">Train with Jaime</h1>
      <p className="quote mt-4 text-xl sm:text-2xl">Y tú, ¿quieres ganar?</p>
      <p className="mt-6 max-w-md text-white/70">
        Entrenamiento y nutrición personalizados para estudiantes universitarios en Pamplona.
        Sin postureo, con presupuesto de estudihambre.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="btn-primary">
          Entrar
        </Link>
        <Link href="/registro" className="btn-secondary bg-transparent text-white hover:bg-white hover:text-navy">
          Date de alta
        </Link>
      </div>
    </main>
  );
}
