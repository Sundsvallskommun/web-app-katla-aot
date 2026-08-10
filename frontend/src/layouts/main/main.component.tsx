import { ReactNode } from 'react';

interface MainProps {
  children: ReactNode;
}

export default function Main({ children }: MainProps) {
  return (
    <main id="content" tabIndex={-1}>
      {children}
    </main>
  );
}
