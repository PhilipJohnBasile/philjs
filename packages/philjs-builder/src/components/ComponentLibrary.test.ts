/**
 * Tests for the Component Library
 */

import { describe, it, expect } from 'vitest';
import {
  componentCategories,
  allComponents,
  getComponentDefinition,
  getComponentsByCategory,
} from './ComponentLibrary.js';

describe('ComponentLibrary', () => {
  describe('componentCategories', () => {
    it('should have all expected categories', () => {
      const categoryIds = componentCategories.map(c => c.id);

      expect(categoryIds).toContain('layout');
      expect(categoryIds).toContain('typography');
      expect(categoryIds).toContain('forms');
      expect(categoryIds).toContain('media');
      expect(categoryIds).toContain('data-display');
      expect(categoryIds).toContain('navigation');
      expect(categoryIds).toContain('feedback');
      expect(categoryIds).toContain('overlay');
    });

    it('should have names and icons for all categories', () => {
      for (const category of componentCategories) {
        expect(category.name).toBeDefined();
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.icon).toBeDefined();
      }
    });

    it('should have order defined for all categories', () => {
      for (const category of componentCategories) {
        expect(category.order).toBeDefined();
        expect(typeof category.order).toBe('number');
      }
    });
  });

  describe('allComponents', () => {
    it('should have components', () => {
      expect(allComponents.length).toBeGreaterThan(0);
    });

    it('should have required properties for all components', () => {
      for (const component of allComponents) {
        expect(component.type).toBeDefined();
        expect(component.name).toBeDefined();
        expect(component.category).toBeDefined();
        expect(component.props).toBeDefined();
        expect(Array.isArray(component.props)).toBe(true);
      }
    });

    it('should have valid category references', () => {
      const validCategories = componentCategories.map(c => c.id);

      for (const component of allComponents) {
        expect(validCategories).toContain(component.category);
      }
    });
  });

  describe('Layout Components', () => {
    it('should have Container component', () => {
      const container = getComponentDefinition('Container');
      expect(container).toBeDefined();
      expect(container?.category).toBe('layout');
      expect(container?.isContainer).toBe(true);
      expect(container?.canHaveChildren).toBe(true);
    });

    it('should have Frame component', () => {
      const frame = getComponentDefinition('Frame');
      expect(frame).toBeDefined();
      expect(frame?.category).toBe('layout');
      expect(frame?.isContainer).toBe(true);
    });

    it('should have Flex component with layout props', () => {
      const flex = getComponentDefinition('Flex');
      expect(flex).toBeDefined();

      const propNames = flex?.props.map(p => p.name);
      expect(propNames).toContain('direction');
      expect(propNames).toContain('wrap');
      expect(propNames).toContain('justify');
      expect(propNames).toContain('align');
      expect(propNames).toContain('gap');
    });

    it('should have Grid component', () => {
      const grid = getComponentDefinition('Grid');
      expect(grid).toBeDefined();

      const propNames = grid?.props.map(p => p.name);
      expect(propNames).toContain('columns');
      expect(propNames).toContain('rows');
      expect(propNames).toContain('gap');
    });

    it('should have Stack components', () => {
      expect(getComponentDefinition('Stack')).toBeDefined();
      expect(getComponentDefinition('HStack')).toBeDefined();
      expect(getComponentDefinition('Center')).toBeDefined();
    });

    it('should have Spacer component that cannot have children', () => {
      const spacer = getComponentDefinition('Spacer');
      expect(spacer).toBeDefined();
      expect(spacer?.canHaveChildren).toBe(false);
    });
  });

  describe('Typography Components', () => {
    it('should have Text component', () => {
      const text = getComponentDefinition('Text');
      expect(text).toBeDefined();
      expect(text?.category).toBe('typography');

      const propNames = text?.props.map(p => p.name);
      expect(propNames).toContain('content');
    });

    it('should have Heading component with level prop', () => {
      const heading = getComponentDefinition('Heading');
      expect(heading).toBeDefined();

      const levelProp = heading?.props.find(p => p.name === 'level');
      expect(levelProp).toBeDefined();
      expect(levelProp?.enumValues).toContain('h1');
      expect(levelProp?.enumValues).toContain('h6');
    });

    it('should have Code component with language prop', () => {
      const code = getComponentDefinition('Code');
      expect(code).toBeDefined();

      const langProp = code?.props.find(p => p.name === 'language');
      expect(langProp).toBeDefined();
      expect(langProp?.enumValues).toContain('javascript');
      expect(langProp?.enumValues).toContain('typescript');
    });
  });

  describe('Form Components', () => {
    it('should have Button component with variants', () => {
      const button = getComponentDefinition('Button');
      expect(button).toBeDefined();
      expect(button?.category).toBe('forms');

      const variantProp = button?.props.find(p => p.name === 'variant');
      expect(variantProp).toBeDefined();
      expect(variantProp?.enumValues).toContain('primary');
      expect(variantProp?.enumValues).toContain('secondary');
      expect(variantProp?.enumValues).toContain('outline');
    });

    it('should have Input component with type prop', () => {
      const input = getComponentDefinition('Input');
      expect(input).toBeDefined();

      const typeProp = input?.props.find(p => p.name === 'type');
      expect(typeProp).toBeDefined();
      expect(typeProp?.enumValues).toContain('text');
      expect(typeProp?.enumValues).toContain('email');
      expect(typeProp?.enumValues).toContain('password');
    });

    it('should have form input components', () => {
      expect(getComponentDefinition('Textarea')).toBeDefined();
      expect(getComponentDefinition('Checkbox')).toBeDefined();
      expect(getComponentDefinition('Radio')).toBeDefined();
      expect(getComponentDefinition('Select')).toBeDefined();
      expect(getComponentDefinition('Switch')).toBeDefined();
      expect(getComponentDefinition('Slider')).toBeDefined();
    });

    it('should have Form and FormField components', () => {
      const form = getComponentDefinition('Form');
      expect(form).toBeDefined();
      expect(form?.isContainer).toBe(true);

      const formField = getComponentDefinition('FormField');
      expect(formField).toBeDefined();
      expect(formField?.isContainer).toBe(true);
    });
  });

  describe('Media Components', () => {
    it('should have Image component', () => {
      const image = getComponentDefinition('Image');
      expect(image).toBeDefined();
      expect(image?.category).toBe('media');
      expect(image?.canHaveChildren).toBe(false);

      const propNames = image?.props.map(p => p.name);
      expect(propNames).toContain('src');
      expect(propNames).toContain('alt');
      expect(propNames).toContain('objectFit');
    });

    it('should have Video component', () => {
      const video = getComponentDefinition('Video');
      expect(video).toBeDefined();

      const propNames = video?.props.map(p => p.name);
      expect(propNames).toContain('src');
      expect(propNames).toContain('autoplay');
      expect(propNames).toContain('controls');
    });

    it('should have Avatar component', () => {
      const avatar = getComponentDefinition('Avatar');
      expect(avatar).toBeDefined();

      const propNames = avatar?.props.map(p => p.name);
      expect(propNames).toContain('src');
      expect(propNames).toContain('name');
      expect(propNames).toContain('size');
    });
  });

  describe('Data Display Components', () => {
    it('should have Card and its parts', () => {
      const card = getComponentDefinition('Card');
      expect(card).toBeDefined();
      expect(card?.isContainer).toBe(true);

      expect(getComponentDefinition('CardHeader')).toBeDefined();
      expect(getComponentDefinition('CardBody')).toBeDefined();
      expect(getComponentDefinition('CardFooter')).toBeDefined();
    });

    it('should have Badge component', () => {
      const badge = getComponentDefinition('Badge');
      expect(badge).toBeDefined();

      const variantProp = badge?.props.find(p => p.name === 'variant');
      expect(variantProp?.enumValues).toContain('primary');
      expect(variantProp?.enumValues).toContain('success');
      expect(variantProp?.enumValues).toContain('error');
    });

    it('should have List and ListItem components', () => {
      const list = getComponentDefinition('List');
      expect(list).toBeDefined();
      expect(list?.allowedChildren).toContain('ListItem');

      const listItem = getComponentDefinition('ListItem');
      expect(listItem).toBeDefined();
      expect(listItem?.allowedParents).toContain('List');
    });

    it('should have Table and Accordion components', () => {
      expect(getComponentDefinition('Table')).toBeDefined();
      expect(getComponentDefinition('Accordion')).toBeDefined();
      expect(getComponentDefinition('Tabs')).toBeDefined();
    });
  });

  describe('Navigation Components', () => {
    it('should have Link component', () => {
      const link = getComponentDefinition('Link');
      expect(link).toBeDefined();
      expect(link?.category).toBe('navigation');

      const propNames = link?.props.map(p => p.name);
      expect(propNames).toContain('href');
      expect(propNames).toContain('target');
    });

    it('should have Nav and NavItem components', () => {
      const nav = getComponentDefinition('Nav');
      expect(nav).toBeDefined();
      expect(nav?.isContainer).toBe(true);

      const navItem = getComponentDefinition('NavItem');
      expect(navItem).toBeDefined();
      expect(navItem?.allowedParents).toContain('Nav');
    });

    it('should have Breadcrumb component', () => {
      const breadcrumb = getComponentDefinition('Breadcrumb');
      expect(breadcrumb).toBeDefined();

      const propNames = breadcrumb?.props.map(p => p.name);
      expect(propNames).toContain('separator');
    });
  });

  describe('Feedback Components', () => {
    it('should have Alert component with variants', () => {
      const alert = getComponentDefinition('Alert');
      expect(alert).toBeDefined();
      expect(alert?.category).toBe('feedback');

      const variantProp = alert?.props.find(p => p.name === 'variant');
      expect(variantProp?.enumValues).toContain('info');
      expect(variantProp?.enumValues).toContain('success');
      expect(variantProp?.enumValues).toContain('warning');
      expect(variantProp?.enumValues).toContain('error');
    });

    it('should have Progress component', () => {
      const progress = getComponentDefinition('Progress');
      expect(progress).toBeDefined();

      const propNames = progress?.props.map(p => p.name);
      expect(propNames).toContain('value');
      expect(propNames).toContain('max');
    });

    it('should have loading components', () => {
      expect(getComponentDefinition('Spinner')).toBeDefined();
      expect(getComponentDefinition('Skeleton')).toBeDefined();
    });

    it('should have Tooltip component', () => {
      const tooltip = getComponentDefinition('Tooltip');
      expect(tooltip).toBeDefined();
      expect(tooltip?.isContainer).toBe(true);

      const propNames = tooltip?.props.map(p => p.name);
      expect(propNames).toContain('content');
      expect(propNames).toContain('placement');
    });
  });

  describe('Overlay Components', () => {
    it('should have Modal component', () => {
      const modal = getComponentDefinition('Modal');
      expect(modal).toBeDefined();
      expect(modal?.category).toBe('overlay');
      expect(modal?.isContainer).toBe(true);

      const propNames = modal?.props.map(p => p.name);
      expect(propNames).toContain('title');
      expect(propNames).toContain('size');
    });

    it('should have Drawer component', () => {
      const drawer = getComponentDefinition('Drawer');
      expect(drawer).toBeDefined();

      const placementProp = drawer?.props.find(p => p.name === 'placement');
      expect(placementProp?.enumValues).toContain('left');
      expect(placementProp?.enumValues).toContain('right');
      expect(placementProp?.enumValues).toContain('top');
      expect(placementProp?.enumValues).toContain('bottom');
    });

    it('should have Popover component', () => {
      const popover = getComponentDefinition('Popover');
      expect(popover).toBeDefined();
      expect(popover?.isContainer).toBe(true);
    });
  });

  describe('getComponentDefinition', () => {
    it('should return component by type', () => {
      const button = getComponentDefinition('Button');
      expect(button).toBeDefined();
      expect(button?.type).toBe('Button');
    });

    it('should return undefined for unknown type', () => {
      const unknown = getComponentDefinition('UnknownComponent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getComponentsByCategory', () => {
    it('should return components for a category', () => {
      const layoutComponents = getComponentsByCategory('layout');
      expect(layoutComponents.length).toBeGreaterThan(0);

      for (const component of layoutComponents) {
        expect(component.category).toBe('layout');
      }
    });

    it('should return empty array for unknown category', () => {
      const unknown = getComponentsByCategory('unknown');
      expect(unknown).toEqual([]);
    });

    it('should return correct counts for each category', () => {
      const layoutCount = getComponentsByCategory('layout').length;
      const formCount = getComponentsByCategory('forms').length;
      const mediaCount = getComponentsByCategory('media').length;

      expect(layoutCount).toBeGreaterThan(5);
      expect(formCount).toBeGreaterThan(5);
      expect(mediaCount).toBeGreaterThan(3);
    });
  });

  describe('PropDefinition validation', () => {
    it('should have valid prop types', () => {
      const validTypes = [
        'string', 'number', 'boolean', 'object', 'array',
        'function', 'node', 'enum', 'color', 'image',
      ];

      for (const component of allComponents) {
        for (const prop of component.props) {
          expect(validTypes).toContain(prop.type);
        }
      }
    });

    it('should have enumValues for enum props', () => {
      for (const component of allComponents) {
        for (const prop of component.props) {
          if (prop.type === 'enum') {
            expect(prop.enumValues).toBeDefined();
            expect(prop.enumValues!.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should have min/max for number props where appropriate', () => {
      const slider = getComponentDefinition('Slider');
      const minProp = slider?.props.find(p => p.name === 'min');
      const maxProp = slider?.props.find(p => p.name === 'max');

      expect(minProp?.type).toBe('number');
      expect(maxProp?.type).toBe('number');
    });
  });

  describe('Default Styles', () => {
    it('should have default styles for layout components', () => {
      const flex = getComponentDefinition('Flex');
      expect(flex?.defaultStyles).toBeDefined();
      expect(flex?.defaultStyles?.display).toBe('flex');
    });

    it('should have default styles for button', () => {
      const button = getComponentDefinition('Button');
      expect(button?.defaultStyles).toBeDefined();
      expect(button?.defaultStyles?.backgroundColor).toBeDefined();
      expect(button?.defaultStyles?.borderRadius).toBeDefined();
    });
  });
});
