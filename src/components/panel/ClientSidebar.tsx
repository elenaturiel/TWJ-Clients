import Link from 'next/link';
import { NavLink } from '@/components/layout/NavLink';
import type { ClientListItem } from '@/app/panel/data';

const PLAN_LABEL: Record<string, string> = { rookie: 'Rookie', all_in: 'All In', peak: 'Peak' };

export function ClientSidebar({ clients }: { clients: ClientListItem[] }) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/50">Clientes</h2>
          <Link href="/panel/retos/nueva" className="text-xs font-semibold text-accent">
            + Reto
          </Link>
        </div>

        {clients.length === 0 ? (
          <p className="px-1 py-2 text-sm text-navy/50">Aún no tienes clientes dados de alta.</p>
        ) : (
          <ul className="space-y-1">
            {clients.map((c) => (
              <li key={c.id}>
                <NavLink
                  href={`/panel/${c.id}`}
                  className="flex items-center gap-2 rounded-card px-2 py-2 text-sm"
                  activeClassName="bg-navy text-white"
                  inactiveClassName="text-navy hover:bg-bg"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {c.full_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">
                    <span className="block truncate font-semibold">{c.full_name}</span>
                    <span className="block truncate text-[11px] opacity-60">
                      {c.plan ? PLAN_LABEL[c.plan] : 'Sin plan'}
                    </span>
                  </span>
                  <span
                    className={`status-dot ${c.needsReview ? 'bg-amber' : 'bg-positive'}`}
                    title={c.needsReview ? 'Pendiente de revisión' : 'Al día'}
                  />
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
