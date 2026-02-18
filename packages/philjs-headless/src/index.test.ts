/**
 * Tests for PhilJS Headless UI Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@philjs/core';
import {
  createDialog,
  createMenu,
  createListbox,
  createCombobox,
  createTabs,
  createSwitch,
  createDisclosure,
  createAccordion,
  createRadioGroup,
  createCheckbox,
  createTooltip,
  createPopover,
  createSlider,
  createProgress,
  createAvatar,
} from './index';

describe('PhilJS Headless UI Components', () => {
  describe('Dialog', () => {
    it('should create with default state', () => {
      const dialog = createDialog();
      expect(dialog.open.get()).toBe(false);
    });

    it('should create with default open state', () => {
      const dialog = createDialog({ defaultOpen: true });
      expect(dialog.open.get()).toBe(true);
    });

    it('should open and close', () => {
      const dialog = createDialog();

      dialog.openDialog();
      expect(dialog.open.get()).toBe(true);

      dialog.closeDialog();
      expect(dialog.open.get()).toBe(false);
    });

    it('should toggle state', () => {
      const dialog = createDialog();

      dialog.toggle();
      expect(dialog.open.get()).toBe(true);

      dialog.toggle();
      expect(dialog.open.get()).toBe(false);
    });

    it('should call onOpenChange callback', () => {
      const onOpenChange = vi.fn();
      const dialog = createDialog({ onOpenChange });

      dialog.openDialog();
      expect(onOpenChange).toHaveBeenCalledWith(true);

      dialog.closeDialog();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should have trigger props', () => {
      const dialog = createDialog();
      expect(dialog.triggerProps['aria-haspopup']).toBe('dialog');
    });

    it('should have panel props with role', () => {
      const dialog = createDialog({ role: 'alertdialog' });
      expect(dialog.panelProps.role).toBe('alertdialog');
    });

    it('should respect controlled open state', () => {
      const controlledOpen = signal(true);
      const dialog = createDialog({ open: controlledOpen });

      expect(dialog.open.get()).toBe(true);
      controlledOpen.set(false);
      expect(dialog.open.get()).toBe(false);
    });
  });

  describe('Menu', () => {
    it('should create with default state', () => {
      const menu = createMenu();
      expect(menu.open.get()).toBe(false);
      expect(menu.activeIndex.get()).toBe(-1);
    });

    it('should open and close', () => {
      const menu = createMenu();

      menu.openMenu();
      expect(menu.open.get()).toBe(true);

      menu.closeMenu();
      expect(menu.open.get()).toBe(false);
    });

    it('should register items', () => {
      const menu = createMenu();

      menu.registerItem({ id: 'item-1', label: 'Item 1' });
      menu.registerItem({ id: 'item-2', label: 'Item 2' });

      expect(menu.items.get().length).toBe(2);
    });

    it('should unregister items', () => {
      const menu = createMenu();

      menu.registerItem({ id: 'item-1', label: 'Item 1' });
      menu.registerItem({ id: 'item-2', label: 'Item 2' });
      menu.unregisterItem('item-1');

      expect(menu.items.get().length).toBe(1);
      expect(menu.items.get()[0].id).toBe('item-2');
    });

    it('should highlight item by index', () => {
      const menu = createMenu();

      menu.highlightIndex(2);
      expect(menu.activeIndex.get()).toBe(2);
    });

    it('should have button props', () => {
      const menu = createMenu();
      expect(menu.buttonProps['aria-haspopup']).toBe('menu');
    });

    it('should have items props with role', () => {
      const menu = createMenu();
      expect(menu.itemsProps.role).toBe('menu');
    });

    it('should get item props', () => {
      const menu = createMenu();
      const item = { id: 'item-1', label: 'Item 1' };
      const props = menu.getItemProps(item, 0);

      expect(props.role).toBe('menuitem');
      expect(props.id).toBe('item-1');
    });
  });

  describe('Listbox', () => {
    it('should create with default state', () => {
      const listbox = createListbox<string>();
      expect(listbox.value.get()).toBeNull();
      expect(listbox.open.get()).toBe(false);
    });

    it('should create with default value', () => {
      const listbox = createListbox<string>({ defaultValue: 'option-1' });
      expect(listbox.value.get()).toBe('option-1');
    });

    it('should select value', () => {
      const listbox = createListbox<string>();
      listbox.select('option-1');
      expect(listbox.value.get()).toBe('option-1');
    });

    it('should close on select when not multiple', () => {
      const listbox = createListbox<string>();
      listbox.toggle();
      expect(listbox.open.get()).toBe(true);

      listbox.select('option-1');
      expect(listbox.open.get()).toBe(false);
    });

    it('should register options', () => {
      const listbox = createListbox<string>();
      listbox.registerOption({ value: 'a', label: 'Option A' });
      listbox.registerOption({ value: 'b', label: 'Option B' });

      expect(listbox.options.get().length).toBe(2);
    });

    it('should have display value', () => {
      const listbox = createListbox<string>();
      listbox.registerOption({ value: 'a', label: 'Option A' });
      listbox.select('a');

      expect(listbox.displayValue.get()).toBe('Option A');
    });

    it('should have button props', () => {
      const listbox = createListbox<string>();
      expect(listbox.buttonProps.role).toBe('combobox');
    });
  });

  describe('Combobox', () => {
    it('should create with default state', () => {
      const combobox = createCombobox<string>();
      expect(combobox.value.get()).toBeNull();
      expect(combobox.inputValue.get()).toBe('');
    });

    it('should filter options based on input', () => {
      const combobox = createCombobox<string>();
      combobox.registerOption({ value: 'apple', label: 'Apple' });
      combobox.registerOption({ value: 'banana', label: 'Banana' });
      combobox.registerOption({ value: 'cherry', label: 'Cherry' });

      combobox.inputValue.set('app');
      expect(combobox.filteredOptions.get().length).toBe(1);
      expect(combobox.filteredOptions.get()[0].value).toBe('apple');
    });

    it('should select and update input value', () => {
      const combobox = createCombobox<string>();
      combobox.registerOption({ value: 'apple', label: 'Apple' });

      combobox.select('apple');
      expect(combobox.value.get()).toBe('apple');
      expect(combobox.inputValue.get()).toBe('Apple');
    });

    it('should clear value', () => {
      const combobox = createCombobox<string>();
      combobox.registerOption({ value: 'apple', label: 'Apple' });
      combobox.select('apple');

      combobox.clear();
      expect(combobox.value.get()).toBeNull();
      expect(combobox.inputValue.get()).toBe('');
    });

    it('should have input props', () => {
      const combobox = createCombobox<string>();
      expect(combobox.inputProps.role).toBe('combobox');
    });
  });

  describe('Tabs', () => {
    it('should create with default state', () => {
      const tabs = createTabs();
      expect(tabs.value.get()).toBe('');
    });

    it('should create with default value', () => {
      const tabs = createTabs({ defaultValue: 'tab-1' });
      expect(tabs.value.get()).toBe('tab-1');
    });

    it('should select tab', () => {
      const tabs = createTabs();
      tabs.select('tab-2');
      expect(tabs.value.get()).toBe('tab-2');
    });

    it('should call onValueChange', () => {
      const onValueChange = vi.fn();
      const tabs = createTabs({ onValueChange });

      tabs.select('tab-1');
      expect(onValueChange).toHaveBeenCalledWith('tab-1');
    });

    it('should register tabs', () => {
      const tabs = createTabs();
      tabs.registerTab({ value: 'tab-1', label: 'Tab 1' });
      tabs.registerTab({ value: 'tab-2', label: 'Tab 2' });

      expect(tabs.tabs.get().length).toBe(2);
    });

    it('should have list props', () => {
      const tabs = createTabs();
      expect(tabs.listProps.role).toBe('tablist');
    });

    it('should get trigger props', () => {
      const tabs = createTabs();
      const tab = { value: 'tab-1', label: 'Tab 1' };
      const props = tabs.getTriggerProps(tab, 0);

      expect(props.role).toBe('tab');
    });

    it('should get panel props', () => {
      const tabs = createTabs();
      const props = tabs.getPanelProps('tab-1');

      expect(props.role).toBe('tabpanel');
    });
  });

  describe('Switch', () => {
    it('should create with default state', () => {
      const sw = createSwitch();
      expect(sw.checked.get()).toBe(false);
    });

    it('should create with default checked', () => {
      const sw = createSwitch({ defaultChecked: true });
      expect(sw.checked.get()).toBe(true);
    });

    it('should toggle state', () => {
      const sw = createSwitch();

      sw.toggle();
      expect(sw.checked.get()).toBe(true);

      sw.toggle();
      expect(sw.checked.get()).toBe(false);
    });

    it('should set checked state', () => {
      const sw = createSwitch();

      sw.setChecked(true);
      expect(sw.checked.get()).toBe(true);

      sw.setChecked(false);
      expect(sw.checked.get()).toBe(false);
    });

    it('should call onCheckedChange', () => {
      const onCheckedChange = vi.fn();
      const sw = createSwitch({ onCheckedChange });

      sw.toggle();
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should have root props', () => {
      const sw = createSwitch();
      expect(sw.rootProps.role).toBe('switch');
    });

    it('should have input props', () => {
      const sw = createSwitch({ name: 'notifications' });
      expect(sw.inputProps.type).toBe('checkbox');
      expect(sw.inputProps.name).toBe('notifications');
    });
  });

  describe('Disclosure', () => {
    it('should create with default state', () => {
      const disclosure = createDisclosure();
      expect(disclosure.open.get()).toBe(false);
    });

    it('should create with default open', () => {
      const disclosure = createDisclosure({ defaultOpen: true });
      expect(disclosure.open.get()).toBe(true);
    });

    it('should toggle state', () => {
      const disclosure = createDisclosure();

      disclosure.toggle();
      expect(disclosure.open.get()).toBe(true);

      disclosure.toggle();
      expect(disclosure.open.get()).toBe(false);
    });

    it('should open and close', () => {
      const disclosure = createDisclosure();

      disclosure.openDisclosure();
      expect(disclosure.open.get()).toBe(true);

      disclosure.closeDisclosure();
      expect(disclosure.open.get()).toBe(false);
    });

    it('should have button props', () => {
      const disclosure = createDisclosure();
      expect(disclosure.buttonProps['aria-expanded']()).toBe(false);
    });
  });

  describe('Accordion', () => {
    it('should create with default state', () => {
      const accordion = createAccordion();
      expect(accordion.value.get()).toEqual([]);
    });

    it('should create with default value', () => {
      const accordion = createAccordion({ defaultValue: ['item-1'] });
      expect(accordion.value.get()).toEqual(['item-1']);
    });

    it('should toggle items', () => {
      const accordion = createAccordion();

      accordion.toggle('item-1');
      expect(accordion.value.get()).toEqual(['item-1']);

      accordion.toggle('item-1');
      expect(accordion.value.get()).toEqual([]);
    });

    it('should expand items', () => {
      const accordion = createAccordion({ type: 'multiple' });

      accordion.expand('item-1');
      accordion.expand('item-2');
      expect(accordion.value.get()).toEqual(['item-1', 'item-2']);
    });

    it('should collapse items', () => {
      const accordion = createAccordion({ defaultValue: ['item-1', 'item-2'], type: 'multiple' });

      accordion.collapse('item-1');
      expect(accordion.value.get()).toEqual(['item-2']);
    });

    it('should check if item is expanded', () => {
      const accordion = createAccordion({ defaultValue: ['item-1'] });

      expect(accordion.isExpanded('item-1').get()).toBe(true);
      expect(accordion.isExpanded('item-2').get()).toBe(false);
    });

    it('should only allow one item in single mode', () => {
      const accordion = createAccordion({ type: 'single' });

      accordion.toggle('item-1');
      accordion.toggle('item-2');
      expect(accordion.value.get()).toEqual(['item-2']);
    });

    it('should allow collapsing in single collapsible mode', () => {
      const accordion = createAccordion({ type: 'single', collapsible: true });

      accordion.toggle('item-1');
      accordion.toggle('item-1');
      expect(accordion.value.get()).toEqual([]);
    });
  });

  describe('RadioGroup', () => {
    it('should create with default state', () => {
      const radioGroup = createRadioGroup<string>();
      expect(radioGroup.value.get()).toBeNull();
    });

    it('should create with default value', () => {
      const radioGroup = createRadioGroup<string>({ defaultValue: 'option-1' });
      expect(radioGroup.value.get()).toBe('option-1');
    });

    it('should select value', () => {
      const radioGroup = createRadioGroup<string>();
      radioGroup.select('option-1');
      expect(radioGroup.value.get()).toBe('option-1');
    });

    it('should call onValueChange', () => {
      const onValueChange = vi.fn();
      const radioGroup = createRadioGroup<string>({ onValueChange });

      radioGroup.select('option-1');
      expect(onValueChange).toHaveBeenCalledWith('option-1');
    });

    it('should register options', () => {
      const radioGroup = createRadioGroup<string>();
      radioGroup.registerOption({ value: 'a', label: 'Option A' });
      radioGroup.registerOption({ value: 'b', label: 'Option B' });

      expect(radioGroup.options.get().length).toBe(2);
    });

    it('should have root props', () => {
      const radioGroup = createRadioGroup<string>();
      expect(radioGroup.rootProps.role).toBe('radiogroup');
    });
  });

  describe('Checkbox', () => {
    it('should create with default state', () => {
      const checkbox = createCheckbox();
      expect(checkbox.checked.get()).toBe(false);
    });

    it('should create with default checked', () => {
      const checkbox = createCheckbox({ defaultChecked: true });
      expect(checkbox.checked.get()).toBe(true);
    });

    it('should toggle state', () => {
      const checkbox = createCheckbox();

      checkbox.toggle();
      expect(checkbox.checked.get()).toBe(true);

      checkbox.toggle();
      expect(checkbox.checked.get()).toBe(false);
    });

    it('should handle indeterminate state', () => {
      const checkbox = createCheckbox({ defaultChecked: 'indeterminate' });
      expect(checkbox.checked.get()).toBe('indeterminate');
      expect(checkbox.isIndeterminate.get()).toBe(true);

      checkbox.toggle();
      expect(checkbox.checked.get()).toBe(true);
    });

    it('should have root props', () => {
      const checkbox = createCheckbox();
      expect(checkbox.rootProps.role).toBe('checkbox');
    });
  });

  describe('Tooltip', () => {
    it('should create with default state', () => {
      const tooltip = createTooltip();
      expect(tooltip.open.get()).toBe(false);
    });

    it('should show and hide', () => {
      const tooltip = createTooltip({ delayDuration: 0 });

      tooltip.show();
      // Note: show has a delay, so we can't immediately check

      tooltip.hide();
      expect(tooltip.open.get()).toBe(false);
    });

    it('should have trigger props', () => {
      const tooltip = createTooltip();
      expect(typeof tooltip.triggerProps.onMouseEnter).toBe('function');
      expect(typeof tooltip.triggerProps.onMouseLeave).toBe('function');
    });

    it('should have content props', () => {
      const tooltip = createTooltip();
      expect(tooltip.contentProps.role).toBe('tooltip');
    });
  });

  describe('Popover', () => {
    it('should create with default state', () => {
      const popover = createPopover();
      expect(popover.open.get()).toBe(false);
    });

    it('should toggle state', () => {
      const popover = createPopover();

      popover.toggle();
      expect(popover.open.get()).toBe(true);

      popover.toggle();
      expect(popover.open.get()).toBe(false);
    });

    it('should open and close', () => {
      const popover = createPopover();

      popover.openPopover();
      expect(popover.open.get()).toBe(true);

      popover.closePopover();
      expect(popover.open.get()).toBe(false);
    });

    it('should have trigger props', () => {
      const popover = createPopover();
      expect(popover.triggerProps['aria-haspopup']).toBe('dialog');
    });

    it('should have content props', () => {
      const popover = createPopover();
      expect(popover.contentProps.role).toBe('dialog');
    });
  });

  describe('Slider', () => {
    it('should create with default state', () => {
      const slider = createSlider();
      expect(slider.value.get()).toEqual([0]);
    });

    it('should create with default value', () => {
      const slider = createSlider({ defaultValue: [50] });
      expect(slider.value.get()).toEqual([50]);
    });

    it('should set value at index', () => {
      const slider = createSlider();
      slider.setValue(0, 75);
      expect(slider.value.get()).toEqual([75]);
    });

    it('should clamp values', () => {
      const slider = createSlider({ min: 0, max: 100 });
      slider.setValue(0, 150);
      expect(slider.value.get()).toEqual([100]);

      slider.setValue(0, -50);
      expect(slider.value.get()).toEqual([0]);
    });

    it('should snap to step', () => {
      const slider = createSlider({ step: 10 });
      slider.setValue(0, 23);
      expect(slider.value.get()).toEqual([20]);
    });

    it('should calculate percentage', () => {
      const slider = createSlider({ min: 0, max: 100, defaultValue: [50] });
      expect(slider.getPercentage(0).get()).toBe(50);
    });

    it('should have thumb props', () => {
      const slider = createSlider();
      const props = slider.getThumbProps(0);
      expect(props.role).toBe('slider');
    });
  });

  describe('Progress', () => {
    it('should create with null value', () => {
      const progress = createProgress();
      expect(progress.value.get()).toBeNull();
    });

    it('should calculate percentage', () => {
      const progress = createProgress();
      progress.value.set(50);
      expect(progress.percentage.get()).toBe(50);
    });

    it('should return null percentage for indeterminate', () => {
      const progress = createProgress();
      expect(progress.percentage.get()).toBeNull();
    });

    it('should have root props', () => {
      const progress = createProgress();
      expect(progress.rootProps.role).toBe('progressbar');
    });

    it('should use custom max', () => {
      const progress = createProgress({ max: 200 });
      progress.value.set(100);
      expect(progress.percentage.get()).toBe(50);
    });
  });

  describe('Avatar', () => {
    it('should create with idle status', () => {
      const avatar = createAvatar();
      expect(avatar.status.get()).toBe('idle');
    });

    it('should have image props', () => {
      const avatar = createAvatar({ src: 'image.jpg', alt: 'User' });
      expect(avatar.imageProps.src).toBe('image.jpg');
      expect(avatar.imageProps.alt).toBe('User');
    });

    it('should have fallback props', () => {
      const avatar = createAvatar();
      expect(typeof avatar.fallbackProps.hidden).toBe('function');
    });
  });
});
