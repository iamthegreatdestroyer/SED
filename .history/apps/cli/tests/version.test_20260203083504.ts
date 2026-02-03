/**
 * SED - Semantic Entropy Differencing
 * CLI Version Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { name, version, description, metadata } from '../src/version.js';

describe('CLI Version Module', () => {
  describe('exports', () => {
    it('should export name', () => {
      expect(name).toBe('sed');
    });

    it('should export version', () => {
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should export description', () => {
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should export metadata object', () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
    });
  });

  describe('metadata', () => {
    it('should have name property', () => {
      expect(metadata.name).toBe('sed');
    });

    it('should have version property', () => {
      expect(metadata.version).toBe(version);
    });

    it('should have description property', () => {
      expect(metadata.description).toBe(description);
    });

    it('should have homepage property', () => {
      expect(metadata.homepage).toBeDefined();
      expect(metadata.homepage).toContain('github.com');
    });

    it('should have repository property', () => {
      expect(metadata.repository).toBeDefined();
      expect(metadata.repository).toContain('github.com');
    });

    it('should have author property', () => {
      expect(metadata.author).toBeDefined();
    });

    it('should have license property', () => {
      expect(metadata.license).toBe('MIT');
    });
  });
});
