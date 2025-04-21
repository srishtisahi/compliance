import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col w-full" style={{ contain: 'layout' }}>
      <Header />
      <main className="flex-1 w-full" style={{ contain: 'layout' }}>{children}</main>
      <Footer />
    </div>
  );
} 