/**
 * SED - Semantic Entropy Differencing
 * Web Dashboard Home Page
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
