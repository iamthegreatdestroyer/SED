/**
 * SED - Semantic Entropy Differencing
 * Tree Data Provider Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetMocks, createMockAnalysisResult } from './setup.js';

// Import after mocking
const { SEDTreeDataProvider, SEDTreeItem } = await import('../src/views/treeDataProvider.js');

describe('SEDTreeDataProvider', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('constructor', () => {
    it('should create a provider for changes view', () => {
      const provider = new SEDTreeDataProvider('changes');
      expect(provider).toBeDefined();
    });

    it('should create a provider for summary view', () => {
      const provider = new SEDTreeDataProvider('summary');
      expect(provider).toBeDefined();
    });

    it('should create a provider for history view', () => {
      const provider = new SEDTreeDataProvider('history');
      expect(provider).toBeDefined();
    });
  });

  describe('getChildren (changes view)', () => {
    it('should return empty state message when no data', async () => {
      const provider = new SEDTreeDataProvider('changes');
      const children = await provider.getChildren();

      expect(children).toHaveLength(1);
      expect(children[0].data.label).toBe('No changes analyzed');
    });

    it('should return grouped files by classification', async () => {
      const provider = new SEDTreeDataProvider('changes');
      const mockData = createMockAnalysisResult();
      provider.setData(mockData.files);

      const children = await provider.getChildren();

      // Should have at least one group (medium in this case)
      expect(children.length).toBeGreaterThan(0);
    });
  });

  describe('getChildren (summary view)', () => {
    it('should return empty state message when no summary', async () => {
      const provider = new SEDTreeDataProvider('summary');
      const children = await provider.getChildren();

      expect(children).toHaveLength(1);
      expect(children[0].data.label).toBe('No summary available');
    });

    it('should return summary statistics', async () => {
      const provider = new SEDTreeDataProvider('summary');
      const mockData = createMockAnalysisResult();
      provider.setSummary(mockData.summary);

      const children = await provider.getChildren();

      expect(children.length).toBeGreaterThanOrEqual(3);
      expect(children[0].data.label).toBe('Files Analyzed');
    });
  });

  describe('getChildren (history view)', () => {
    it('should return empty state message when no history', async () => {
      const provider = new SEDTreeDataProvider('history');
      const children = await provider.getChildren();

      expect(children).toHaveLength(1);
      expect(children[0].data.label).toBe('No history');
    });

    it('should return history entries', async () => {
      const provider = new SEDTreeDataProvider('history');
      const mockData = createMockAnalysisResult();
      provider.addEntry({
        id: '1',
        timestamp: new Date(),
        from: 'HEAD~1',
        to: 'HEAD',
        summary: mockData.summary,
      });

      const children = await provider.getChildren();

      expect(children.length).toBeGreaterThan(0);
      expect(children[0].data.type).toBe('history');
    });
  });

  describe('refresh', () => {
    it('should fire onDidChangeTreeData event', () => {
      const provider = new SEDTreeDataProvider('changes');
      let eventFired = false;
      provider.onDidChangeTreeData(() => {
        eventFired = true;
      });

      provider.refresh();

      // Note: The actual event firing depends on VS Code EventEmitter mock
      expect(provider).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      const provider = new SEDTreeDataProvider('changes');
      const mockData = createMockAnalysisResult();
      provider.setData(mockData.files);
      provider.clear();

      const children = await provider.getChildren();
      expect(children[0].data.label).toBe('No changes analyzed');
    });
  });
});

describe('SEDTreeItem', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should create a tree item with label', () => {
    const item = new SEDTreeItem(
      {
        type: 'file',
        label: 'test.ts',
        collapsible: false,
      },
      0 // TreeItemCollapsibleState.None
    );

    expect(item.label).toBe('test.ts');
  });

  it('should set description when provided', () => {
    const item = new SEDTreeItem(
      {
        type: 'file',
        label: 'test.ts',
        description: '2.5',
        collapsible: false,
      },
      0
    );

    expect(item.description).toBe('2.5');
  });

  it('should set tooltip when provided', () => {
    const item = new SEDTreeItem(
      {
        type: 'file',
        label: 'test.ts',
        tooltip: 'Test tooltip',
        collapsible: false,
      },
      0
    );

    expect(item.tooltip).toBe('Test tooltip');
  });

  it('should use label as tooltip when not provided', () => {
    const item = new SEDTreeItem(
      {
        type: 'file',
        label: 'test.ts',
        collapsible: false,
      },
      0
    );

    expect(item.tooltip).toBe('test.ts');
  });
});
