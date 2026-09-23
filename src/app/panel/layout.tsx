import { requireProfile } from '@/lib/auth/get-profile';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { getClientList } from './data';
import { ClientSidebar } from '@/components/panel/ClientSidebar';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile('trainer');
  const clients = await getClientList();

  return (
    <TrainerAppShell fullName={profile.full_name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <ClientSidebar clients={clients} />
        <div className="flex-1">{children}</div>
      </div>
    </TrainerAppShell>
  );
}
