import { Header } from './Header';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-action-primary focus:rounded"
      >
        Skip to main content
      </a>
      <Header />
      <Navigation />
      <main id="main-content" className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
