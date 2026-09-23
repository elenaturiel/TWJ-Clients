import Link from 'next/link';
import { NavLink } from './NavLink';
import { SignOutButton } from './SignOutButton';
import { IconBell } from '@/components/icons';
import { getClientList } from '@/app/panel/data';

export async function TrainerAppShell({
  children,
  fullName,
  needsReviewCount,
}: {
  children: React.ReactNode;
  fullName: string;
  /** Si no se pasa (páginas que no cargan ya la lista de clientes), se calcula aquí. */
  needsReviewCount?: number;
}) {
  const count = needsReviewCount ?? (await getClientList()).filter((c) => c.needsReview).length;

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
            <Link
              href="/panel"
              className="relative text-navy/70 hover:text-accent"
              title={count > 0 ? `${count} cliente(s) con novedades sin revisar` : 'Sin novedades'}
            >
              <IconBell className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
            <span className="hidden text-sm text-navy/60 sm:inline">{fullName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
