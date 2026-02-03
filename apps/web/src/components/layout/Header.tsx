/**
 * SED - Semantic Entropy Differencing
 * Header Component
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

'use client';

import { GitBranch, Settings, HelpCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg hidden sm:inline">
            SED <span className="text-muted-foreground font-normal text-sm">Dashboard</span>
          </span>
        </div>

        {/* Git Info */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">main</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <button className="p-2 rounded-md hover:bg-muted transition-colors" title="Help">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-md hover:bg-muted transition-colors" title="Settings">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
