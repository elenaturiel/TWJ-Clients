'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({
  href,
  children,
  className,
  activeClassName = 'text-accent',
  inactiveClassName = 'text-navy/60 hover:text-navy',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <Link href={href} className={`${className ?? ''} ${isActive ? activeClassName : inactiveClassName}`}>
      {children}
    </Link>
  );
}
