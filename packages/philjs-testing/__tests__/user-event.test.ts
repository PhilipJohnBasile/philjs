/**
 * Tests for user event simulation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userEvent, setup } from '../src/user-event';

describe('userEvent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('click', () => {
    it('clicks an element', async () => {
      const button = document.createElement('button');
      const onClick = vi.fn();
      button.addEventListener('click', onClick);
      document.body.appendChild(button);

      const user = userEvent();
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('focuses element before clicking', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const user = userEvent();
      await user.click(button);

      expect(document.activeElement).toBe(button);
    });

    it('fires pointer and mouse events', async () => {
      const button = document.createElement('button');
      const events: string[] = [];

      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(
        eventType => {
          button.addEventListener(eventType, () => events.push(eventType));
        }
      );

      document.body.appendChild(button);

      const user = userEvent();
      await user.click(button);

      expect(events).toContain('pointerdown');
      expect(events).toContain('mousedown');
      expect(events).toContain('pointerup');
      expect(events).toContain('mouseup');
      expect(events).toContain('click');
    });
  });

  describe('dblClick', () => {
    it('double clicks an element', async () => {
      const button = document.createElement('button');
      const onDblClick = vi.fn();
      button.addEventListener('dblclick', onDblClick);
      document.body.appendChild(button);

      const user = userEvent();
      await user.dblClick(button);

      expect(onDblClick).toHaveBeenCalled();
    });
  });

  describe('type', () => {
    it('types text into input', async () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      const user = userEvent();
      await user.type(input, 'Hello');

      expect(input.value).toBe('Hello');
    });

    it('types text into textarea', async () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const user = userEvent();
      await user.type(textarea, 'Hello\nWorld');

      expect(textarea.value).toBe('Hello\nWorld');
    });

    it('fires input and change events', async () => {
      const input = document.createElement('input');
      const onInput = vi.fn();
      const onChange = vi.fn();
      input.addEventListener('input', onInput);
      input.addEventListener('change', onChange);
      document.body.appendChild(input);

      const user = userEvent();
      await user.type(input, 'Hi');

      expect(onInput).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
    });

    it('appends to existing value', async () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      document.body.appendChild(input);

      const user = userEvent();
      await user.type(input, ' World', { skipClick: true });

      expect(input.value).toBe('Hello World');
    });

    it('respects delay option', async () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      const start = Date.now();
      const user = userEvent({ delay: 10 });
      await user.type(input, 'Hi');
      const elapsed = Date.now() - start;

      // Should take at least 20ms (2 chars * 10ms delay)
      expect(elapsed).toBeGreaterThanOrEqual(20);
    });
  });

  describe('clear', () => {
    it('clears input value', async () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      document.body.appendChild(input);

      const user = userEvent();
      await user.clear(input);

      expect(input.value).toBe('');
    });

    it('fires input and change events', async () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      const onInput = vi.fn();
      const onChange = vi.fn();
      input.addEventListener('input', onInput);
      input.addEventListener('change', onChange);
      document.body.appendChild(input);

      const user = userEvent();
      await user.clear(input);

      expect(onInput).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('selectOptions', () => {
    it('selects option by value', async () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="1">One</option>
        <option value="2">Two</option>
        <option value="3">Three</option>
      `;
      document.body.appendChild(select);

      const user = userEvent();
      await user.selectOptions(select, '2');

      expect(select.value).toBe('2');
      expect(select.options[1].selected).toBe(true);
    });

    it('selects multiple options', async () => {
      const select = document.createElement('select');
      select.multiple = true;
      select.innerHTML = `
        <option value="1">One</option>
        <option value="2">Two</option>
        <option value="3">Three</option>
      `;
      document.body.appendChild(select);

      const user = userEvent();
      await user.selectOptions(select, ['1', '3']);

      expect(select.options[0].selected).toBe(true);
      expect(select.options[1].selected).toBe(false);
      expect(select.options[2].selected).toBe(true);
    });

    it('fires change event', async () => {
      const select = document.createElement('select');
      select.innerHTML = '<option value="1">One</option>';
      const onChange = vi.fn();
      select.addEventListener('change', onChange);
      document.body.appendChild(select);

      const user = userEvent();
      await user.selectOptions(select, '1');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('hover', () => {
    it('fires hover events', async () => {
      const div = document.createElement('div');
      const events: string[] = [];

      ['pointerover', 'mouseenter', 'mouseover'].forEach(eventType => {
        div.addEventListener(eventType, () => events.push(eventType));
      });

      document.body.appendChild(div);

      const user = userEvent();
      await user.hover(div);

      expect(events).toContain('pointerover');
      expect(events).toContain('mouseenter');
      expect(events).toContain('mouseover');
    });
  });

  describe('unhover', () => {
    it('fires unhover events', async () => {
      const div = document.createElement('div');
      const events: string[] = [];

      ['pointerout', 'mouseleave', 'mouseout'].forEach(eventType => {
        div.addEventListener(eventType, () => events.push(eventType));
      });

      document.body.appendChild(div);

      const user = userEvent();
      await user.unhover(div);

      expect(events).toContain('pointerout');
      expect(events).toContain('mouseleave');
      expect(events).toContain('mouseout');
    });
  });

  describe('tab', () => {
    it('moves focus to next element', async () => {
      const input1 = document.createElement('input');
      const input2 = document.createElement('input');
      document.body.appendChild(input1);
      document.body.appendChild(input2);

      input1.focus();

      const user = userEvent();
      await user.tab();

      expect(document.activeElement).toBe(input2);
    });

    it('moves focus backward with shift', async () => {
      const input1 = document.createElement('input');
      const input2 = document.createElement('input');
      document.body.appendChild(input1);
      document.body.appendChild(input2);

      input2.focus();

      const user = userEvent();
      await user.tab({ shift: true });

      expect(document.activeElement).toBe(input1);
    });
  });

  describe('keyboard', () => {
    it('fires keyboard events', async () => {
      const input = document.createElement('input');
      const events: string[] = [];

      ['keydown', 'keyup'].forEach(eventType => {
        input.addEventListener(eventType, () => events.push(eventType));
      });

      document.body.appendChild(input);
      input.focus();

      const user = userEvent();
      await user.keyboard('{Enter}');

      expect(events).toContain('keydown');
      expect(events).toContain('keyup');
    });

    it('handles special keys', async () => {
      const input = document.createElement('input');
      let enterPressed = false;

      input.addEventListener('keydown', (e: Event) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          enterPressed = true;
        }
      });

      document.body.appendChild(input);
      input.focus();

      const user = userEvent();
      await user.keyboard('{Enter}');

      expect(enterPressed).toBe(true);
    });
  });

  describe('paste', () => {
    it('pastes text into input', async () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const user = userEvent();
      await user.paste('Pasted text');

      expect(input.value).toBe('Pasted text');
    });

    it('fires paste event', async () => {
      const input = document.createElement('input');
      const onPaste = vi.fn();
      input.addEventListener('paste', onPaste);
      document.body.appendChild(input);
      input.focus();

      const user = userEvent();
      await user.paste('Text');

      expect(onPaste).toHaveBeenCalled();
    });
  });

  describe('upload', () => {
    it('uploads files to input', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      document.body.appendChild(input);

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const user = userEvent();
      await user.upload(input, file);

      expect(input.files).toHaveLength(1);
      expect(input.files?.[0]).toBe(file);
    });

    it('uploads multiple files', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      document.body.appendChild(input);

      const file1 = new File(['1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['2'], 'test2.txt', { type: 'text/plain' });

      const user = userEvent();
      await user.upload(input, [file1, file2]);

      expect(input.files).toHaveLength(2);
    });
  });
});

describe('setup', () => {
  it('creates userEvent with options', () => {
    const user = setup({ delay: 100 });
    expect(user).toBeDefined();
    expect(user.click).toBeDefined();
    expect(user.type).toBeDefined();
  });
});
