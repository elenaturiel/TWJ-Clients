import Link from 'next/link';
import { NavLink } from './NavLink';
import { SignOutButton } from './SignOutButton';

export function TrainerAppShell({
  children,
  fullName,
}: {
  children: React.ReactNode;
  fullName: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/panel" className="text-2xl">
            Train with Jaime
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
            <NavLink href="/panel">Panel</NavLink>
            <NavLink href="/comunidad">Comunidad</NavLink>
            <NavLink href="/perfil">Perfil</NavLink>
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-navy/60 sm:inline">{fullName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
