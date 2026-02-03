/**
 * SED - Semantic Entropy Differencing
 * Dashboard Main Content Component
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

'use client';

import { useState } from 'react';
import { SummaryCards } from './SummaryCards';
import { EntropyChart } from './EntropyChart';
import { FileList } from './FileList';
import { useAnalysisStore } from '@/stores/analysisStore';

export function DashboardContent() {
  const { analysisResult, isLoading, error } = useAnalysisStore();
  const [view, setView] = useState<'overview' | 'files' | 'history'>('overview');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-destructive mb-2">Analysis Error</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Analyzing changes...</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">No Analysis Data</h2>
        <p className="text-muted-foreground max-w-md">
          Run an analysis from the sidebar or upload analysis results to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {(['overview', 'files', 'history'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <>
          <SummaryCards summary={analysisResult.summary} />
          <EntropyChart files={analysisResult.files} />
          <FileList files={analysisResult.files.slice(0, 10)} />
        </>
      )}

      {view === 'files' && <FileList files={analysisResult.files} showAll />}

      {view === 'history' && (
        <div className="text-center text-muted-foreground py-12">
          <p>History view coming soon...</p>
        </div>
      )}
    </div>
  );
}
