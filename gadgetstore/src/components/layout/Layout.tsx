import { ReactNode } from 'react';
import TopHeader from './TopHeader';
import Navbar from './Navbar';
import CategoryBar from './CategoryBar';
import Footer from './Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <TopHeader />
    <Navbar />
    <CategoryBar />
    <main className="flex-1">{children}</main>
    <Footer />
    <WhatsAppButton />
  </div>
);

export default Layout;
