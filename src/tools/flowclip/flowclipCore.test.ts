import { describe, expect, it } from 'vitest';
import {
  MAX_FLOW_TEXT_LENGTH,
  MAX_SUBTITLE_LENGTH,
  MAX_TITLE_LENGTH,
  clampDuration,
  getLayoutDirection,
  getProjectState,
  normalizeProjectState,
  parseFlowText,
  safeFileName,
} from './flowclipCore';

describe('FlowClip parser', () => {
  it('parses title, chained edges, and edge labels', () => {
    const flow = parseFlowText('title Launch Plan\nIdea -> Script -> Publish: ships', 'portrait');

    expect(flow.title).toBe('Launch Plan');
    expect(flow.nodes.map((node) => node.label)).toEqual(['Idea', 'Script', 'Publish']);
    expect(flow.edges).toHaveLength(2);
    expect(flow.edges[1]).toMatchObject({ label: 'ships', order: 1 });
    expect(flow.warnings).toEqual([]);
  });

  it('warns for non-arrow lines and empty diagrams', () => {
    const invalid = parseFlowText('just words', 'portrait');
    const empty = parseFlowText('# comment only', 'portrait');

    expect(invalid.warnings).toContain('Line 1: use A -> B syntax.');
    expect(empty.warnings).toContain('Add a flow like Idea -> Script -> Publish.');
  });

  it('chooses layout direction by ratio and node count', () => {
    expect(getLayoutDirection('landscape', 10)).toBe('LR');
    expect(getLayoutDirection('square', 4)).toBe('LR');
    expect(getLayoutDirection('square', 5)).toBe('TB');
    expect(getLayoutDirection('portrait', 2)).toBe('TB');
  });
});

describe('FlowClip project state', () => {
  it('clamps duration and creates versioned project state', () => {
    expect(clampDuration(Number.NaN)).toBe(6);
    expect(clampDuration(1)).toBe(3);
    expect(clampDuration(99)).toBe(20);

    expect(getProjectState({
      text: 'A -> B',
      customTitle: '',
      subtitle: 'Sub',
      ratio: 'portrait',
      theme: 'clean',
      animation: 'flow',
      duration: 99,
    })).toMatchObject({ version: 1, duration: 20 });
  });

  it('normalizes valid partial project data and legacy animations', () => {
    expect(normalizeProjectState({
      version: 1,
      text: 'A -> B',
      customTitle: 'Title',
      subtitle: 'Subtitle',
      ratio: 'short',
      theme: 'dark',
      animation: 'pulse',
      duration: 2,
    })).toEqual({
      text: 'A -> B',
      customTitle: 'Title',
      subtitle: 'Subtitle',
      ratio: 'short',
      theme: 'dark',
      animation: 'flow',
      duration: 3,
    });
  });

  it('rejects invalid project roots and unsupported versions', () => {
    expect(() => normalizeProjectState(null)).toThrow('Invalid FlowClip project.');
    expect(() => normalizeProjectState([])).toThrow('Invalid FlowClip project.');
    expect(() => normalizeProjectState({ version: 2 })).toThrow('Unsupported FlowClip project version.');
  });

  it('limits text fields and strips control characters', () => {
    const project = normalizeProjectState({
      text: `A\u0000${'x'.repeat(MAX_FLOW_TEXT_LENGTH + 10)}`,
      customTitle: `T\u0001${'x'.repeat(MAX_TITLE_LENGTH + 10)}`,
      subtitle: `S\u0002${'x'.repeat(MAX_SUBTITLE_LENGTH + 10)}`,
    });

    expect(project.text).toHaveLength(MAX_FLOW_TEXT_LENGTH);
    expect(project.text).not.toContain('\u0000');
    expect(project.customTitle).toHaveLength(MAX_TITLE_LENGTH);
    expect(project.subtitle).toHaveLength(MAX_SUBTITLE_LENGTH);
  });
});

describe('FlowClip filenames', () => {
  it('creates safe fallback filenames', () => {
    expect(safeFileName('Launch Plan! 2026')).toBe('launch-plan-2026');
    expect(safeFileName('***')).toBe('flowclip');
  });
});
