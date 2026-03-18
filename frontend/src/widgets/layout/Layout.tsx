import { memo, type ReactNode } from 'react';
import { Header } from '../header/Header';
import { Footer } from '../footer/Footer';
import { WhatsAppCTA } from '../whatsapp-cta/WhatsAppCTA';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = memo(function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
      <WhatsAppCTA />
    </div>
  );
});
