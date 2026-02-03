/**
 * SED - Semantic Entropy Differencing
 * Sidebar Component
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  GitCompare, 
  FileText, 
  History, 
  Upload,
  Play,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAnalysisStore } from '@/stores/analysisStore';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Compare', icon: GitCompare, href: '/compare' },
  { name: 'Reports', icon: FileText, href: '/reports' },
  { name: 'History', icon: History, href: '/history' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const { runAnalysis, isLoading } = useAnalysisStore();

  const handleAnalyze = () => {
    runAnalysis({
      from: 'HEAD~1',
      to: 'HEAD',
    });
  };

  return (
    <aside
      className={clsx(
        'border-r border-border bg-card transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center p-2 m-2 rounded-md hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveItem(item.name)}
              className={clsx(
                'flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeItem === item.name
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="p-2 border-t border-border space-y-2">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={clsx(
              'flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">{isLoading ? 'Analyzing...' : 'Analyze'}</span>}
          </button>

          <button
            className={clsx(
              'flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'border border-border hover:bg-muted'
            )}
          >
            <Upload className="w-4 h-4 text-muted-foreground" />
            {!isCollapsed && <span className="ml-2 text-muted-foreground">Import</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
