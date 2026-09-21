import Link from 'next/link';
import { NavLink } from './NavLink';
import { SignOutButton } from './SignOutButton';
import { IconWeek, IconChart, IconUsers, IconUser } from '@/components/icons';

export function ClientAppShell({
  children,
  fullName,
}: {
  children: React.ReactNode;
  fullName: string;
}) {
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <header className="hidden border-b border-line bg-white sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/semana" className="text-2xl">
            Train with Jaime
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
            <NavLink href="/semana">Mi semana</NavLink>
            <NavLink href="/comunidad">Comunidad</NavLink>
            <NavLink href="/perfil">Perfil</NavLink>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy/60">{fullName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:hidden">
        <span className="text-xl">Train with Jaime</span>
        <SignOutButton className="text-xs text-navy/60 underline" />
      </header>

      {children}

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white sm:hidden">
        <MobileTab href="/semana" label="Semana" icon={<IconWeek className="h-5 w-5" />} />
        <MobileTab href="/semana#progreso" label="Progreso" icon={<IconChart className="h-5 w-5" />} />
        <MobileTab href="/comunidad" label="Comunidad" icon={<IconUsers className="h-5 w-5" />} />
        <MobileTab href="/perfil" label="Perfil" icon={<IconUser className="h-5 w-5" />} />
      </nav>
    </div>
  );
}

function MobileTab({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      href={href}
      className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold uppercase tracking-wide"
      activeClassName="text-accent"
      inactiveClassName="text-navy/50"
    >
      {icon}
      {label}
    </NavLink>
  );
}
