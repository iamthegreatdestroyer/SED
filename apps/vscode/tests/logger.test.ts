/**
 * SED - Semantic Entropy Differencing
 * Logger Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, mockVscode } from './setup.js';

// Import after mocking
const { OutputChannelLogger } = await import('../src/utils/logger.js');

describe('OutputChannelLogger', () => {
  let logger: InstanceType<typeof OutputChannelLogger>;
  let mockOutputChannel: ReturnType<typeof mockVscode.window.createOutputChannel>;

  beforeEach(() => {
    resetMocks();
    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
    };
    mockVscode.window.createOutputChannel = vi.fn(() => mockOutputChannel);
    logger = new OutputChannelLogger('Test');
  });

  describe('constructor', () => {
    it('should create an output channel', () => {
      expect(mockVscode.window.createOutputChannel).toHaveBeenCalledWith('Test');
    });
  });

  describe('debug', () => {
    it('should not log debug messages by default (info level)', () => {
      logger.debug('Debug message');

      expect(mockOutputChannel.appendLine).not.toHaveBeenCalled();
    });

    it('should log debug messages when level is debug', () => {
      logger.setLevel('debug');
      logger.debug('Debug message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0] as string;
      expect(call).toContain('DEBUG');
      expect(call).toContain('Debug message');
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0] as string;
      expect(call).toContain('INFO');
      expect(call).toContain('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0] as string;
      expect(call).toContain('WARN');
      expect(call).toContain('Warning message');
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Error message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0] as string;
      expect(call).toContain('ERROR');
      expect(call).toContain('Error message');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error('An error occurred', error);

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0] as string;
      expect(call).toContain('Test error');
    });
  });

  describe('show', () => {
    it('should show the output channel', () => {
      logger.show();

      expect(mockOutputChannel.show).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear the output channel', () => {
      logger.clear();

      expect(mockOutputChannel.clear).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose the output channel', () => {
      logger.dispose();

      expect(mockOutputChannel.dispose).toHaveBeenCalled();
    });
  });
});
