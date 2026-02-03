/**
 * SED - Semantic Entropy Differencing
 * File List Component
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

'use client';

import { useState } from 'react';
import type { FileAnalysisResult } from '@/types';
import { clsx } from 'clsx';

interface FileListProps {
  files: FileAnalysisResult[];
  showAll?: boolean;
}

const CLASSIFICATION_CLASSES = {
  trivial: 'classification-trivial',
  low: 'classification-low',
  medium: 'classification-medium',
  high: 'classification-high',
  critical: 'classification-critical',
};

export function FileList({ files, showAll = false }: FileListProps) {
  const [sortBy, setSortBy] = useState<'entropy' | 'path' | 'classification'>('entropy');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');

  const classificationOrder = { trivial: 0, low: 1, medium: 2, high: 3, critical: 4 };

  const sortedFiles = [...files]
    .filter((file) => file.relativePath.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'entropy':
          comparison = a.entropy - b.entropy;
          break;
        case 'path':
          comparison = a.relativePath.localeCompare(b.relativePath);
          break;
        case 'classification':
          comparison =
            classificationOrder[a.classification] - classificationOrder[b.classification];
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-lg font-semibold">
          {showAll ? `All Files (${files.length})` : 'Top Changes'}
        </h3>
        {showAll && (
          <input
            type="text"
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-foreground"
                onClick={() => handleSort('path')}
              >
                File {sortBy === 'path' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('entropy')}
              >
                Entropy {sortBy === 'entropy' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-foreground"
                onClick={() => handleSort('classification')}
              >
                Classification {sortBy === 'classification' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-medium text-right">Changes</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file, index) => (
              <tr
                key={file.relativePath}
                className={clsx(
                  'border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                  index % 2 === 0 && 'bg-muted/20'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{file.language}</span>
                    <span
                      className="font-medium text-sm truncate max-w-[300px]"
                      title={file.relativePath}
                    >
                      {file.relativePath}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm">{file.entropy.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize',
                      CLASSIFICATION_CLASSES[file.classification]
                    )}
                  >
                    {file.classification}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-muted-foreground">
                    +{file.metrics.additions} / -{file.metrics.deletions}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedFiles.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">No files match your filter.</div>
      )}
    </div>
  );
}
