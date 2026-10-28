import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  AnimatedThemeToggler,
  type TransitionVariant,
} from './animated-theme-toggler';
import { AnimatedThemeTogglerDemo } from './animated-theme-toggler-demo';
import { AnimatedThemeTogglerDemo as ComponentDemo } from '../../components/demos/AnimatedThemeTogglerDemo';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { executeThemeViewTransition } from '../../utils/themeAnimation';

describe('AnimatedThemeToggler & Demo', () => {
  let docDefined = false;

  beforeEach(() => {
    if (typeof (globalThis as any).document === 'undefined') {
      docDefined = true;
      (globalThis as any).document = {
        documentElement: {
          classList: {
            contains: () => false,
            add: () => {},
            remove: () => {},
            toggle: () => {},
          },
          dataset: {},
          style: {
            setProperty: () => {},
            removeProperty: () => {},
          },
        },
        querySelector: () => null,
      };
    }
  });

  afterEach(() => {
    if (docDefined) {
      delete (globalThis as any).document;
      docDefined = false;
    }
  });

  it('renders AnimatedThemeTogglerDemo with container and toggler', () => {
    const html = renderToString(React.createElement(AnimatedThemeTogglerDemo));
    expect(html).toContain('flex justify-center p-6');
    expect(html).toContain('button');
    expect(html).toContain('aria-label="Toggle theme"');
  });

  it('renders ComponentDemo identically', () => {
    const html = renderToString(React.createElement(ComponentDemo));
    expect(html).toContain('flex justify-center p-6');
    expect(html).toContain('type="button"');
  });

  it('renders Sun icon when theme is controlled as dark', () => {
    const html = renderToString(
      React.createElement(AnimatedThemeToggler, {
        theme: 'dark',
      })
    );
    expect(html).toContain('lucide-sun');
    expect(html).not.toContain('lucide-moon');
  });

  it('renders Moon icon when theme is controlled as light', () => {
    const html = renderToString(
      React.createElement(AnimatedThemeToggler, {
        theme: 'light',
      })
    );
    expect(html).toContain('lucide-moon');
    expect(html).not.toContain('lucide-sun');
  });

  it('supports transition variants without throwing during render', () => {
    const variants: TransitionVariant[] = [
      'circle',
      'square',
      'triangle',
      'diamond',
      'hexagon',
      'rectangle',
      'star',
    ];

    variants.forEach((variant) => {
      const html = renderToString(
        React.createElement(AnimatedThemeToggler, {
          variant,
          duration: 500,
          fromCenter: true,
        })
      );
      expect(html).toContain('button');
    });
  });

  it('merges custom className with default styles', () => {
    const html = renderToString(
      React.createElement(AnimatedThemeToggler, {
        className: 'custom-magic-button shadow-lg',
      })
    );
    expect(html).toContain('custom-magic-button');
    expect(html).toContain('shadow-lg');
  });

  it('ThemeToggle renders with animated icon presence and theme accessibility labels', () => {
    const html = renderToString(
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(ThemeToggle, {
          className: 'test-theme-toggle',
          showLabel: true
        })
      )
    );
    expect(html).toContain('Switch to dark theme');
    expect(html).toContain('Light Theme');
    expect(html).toContain('lucide-moon');
  });

  it('executeThemeViewTransition executes callback seamlessly with or without view transition API', () => {
    let called = false;
    executeThemeViewTransition(null, () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});

