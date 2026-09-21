import { ChallengeForm } from '@/components/panel/ChallengeForm';

export default function NuevoRetoPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl">Crear reto</h1>
      <p className="mb-4 text-sm text-navy/60">
        Se publica abierto: cualquier cliente lo verá en Comunidad y podrá apuntarse sin que tengas
        que aprobarlo.
      </p>
      <ChallengeForm />
    </div>
  );
}
