export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={className ?? 'btn-secondary'}>
        Cerrar sesión
      </button>
    </form>
  );
}
