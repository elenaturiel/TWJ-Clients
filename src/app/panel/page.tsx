import { redirect } from 'next/navigation';
import { getClientList } from './data';

export default async function PanelIndexPage() {
  const clients = await getClientList();

  if (clients.length > 0) {
    redirect(`/panel/${clients[0].id}`);
  }

  return (
    <div className="card p-8 text-center text-navy/60">
      <p>Aún no tienes clientes dados de alta.</p>
      <p className="mt-1 text-sm">
        En cuanto alguien se registre desde /registro, aparecerá aquí.
      </p>
    </div>
  );
}
