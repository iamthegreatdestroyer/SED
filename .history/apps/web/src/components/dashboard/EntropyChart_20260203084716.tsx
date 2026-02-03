/**
 * SED - Semantic Entropy Differencing
 * Entropy Chart Component
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FileAnalysisResult } from '@/types';

interface EntropyChartProps {
  files: FileAnalysisResult[];
}

const CLASSIFICATION_COLORS = {
  trivial: '#10b981',
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export function EntropyChart({ files }: EntropyChartProps) {
  const chartData = files
    .slice(0, 15)
    .map((file) => ({
      name: file.relativePath.split('/').pop() || file.relativePath,
      fullPath: file.relativePath,
      entropy: file.entropy,
      classification: file.classification,
    }))
    .sort((a, b) => b.entropy - a.entropy);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Entropy by File</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              className="text-muted-foreground text-xs"
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-muted-foreground text-xs"
              width={110}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="font-medium text-sm">{data.fullPath}</p>
                    <p className="text-muted-foreground text-sm">
                      Entropy: <span className="font-mono">{data.entropy.toFixed(2)}</span>
                    </p>
                    <p className="text-sm capitalize">
                      Classification:{' '}
                      <span
                        className="font-medium"
                        style={{ color: CLASSIFICATION_COLORS[data.classification as keyof typeof CLASSIFICATION_COLORS] }}
                      >
                        {data.classification}
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="entropy" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CLASSIFICATION_COLORS[entry.classification as keyof typeof CLASSIFICATION_COLORS]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
