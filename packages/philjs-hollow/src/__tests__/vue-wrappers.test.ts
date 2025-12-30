/**
 * @philjs/hollow - Vue Wrappers Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createVueWrapper,
  HollowButton,
  HollowInput,
  HollowCard,
  HollowModal,
  HollowSelect,
  HollowCheckbox,
  HollowSwitch,
  HollowTabs,
  HollowAccordion,
  HollowAccordionItem,
  vHollowProps,
  HollowPlugin,
} from '../wrappers/vue.js';

describe('createVueWrapper', () => {
  it('should create a Vue component wrapper', () => {
    const wrapper = createVueWrapper(
      'hollow-test',
      [{ name: 'value', type: 'String' }],
      ['hollow-change']
    );

    expect(wrapper).toBeDefined();
    expect(wrapper.name).toBe('HollowTest');
  });

  it('should define props correctly', () => {
    const wrapper = createVueWrapper(
      'hollow-test',
      [
        { name: 'value', type: 'String', default: '' },
        { name: 'disabled', type: 'Boolean', default: false },
        { name: 'count', type: 'Number', default: 0 },
      ],
      []
    );

    expect(wrapper.props.value).toBeDefined();
    expect(wrapper.props.disabled).toBeDefined();
    expect(wrapper.props.count).toBeDefined();
  });

  it('should define emits correctly', () => {
    const wrapper = createVueWrapper(
      'hollow-test',
      [],
      ['hollow-change', 'hollow-input']
    );

    expect(wrapper.emits).toContain('hollow-change');
    expect(wrapper.emits).toContain('hollow-input');
  });

  it('should have setup function', () => {
    const wrapper = createVueWrapper('hollow-test', [], []);

    expect(typeof wrapper.setup).toBe('function');
  });

  it('should convert display name from kebab-case', () => {
    const wrapper = createVueWrapper('hollow-my-component', [], []);

    expect(wrapper.name).toBe('HollowMyComponent');
  });
});

describe('HollowButton', () => {
  it('should be defined', () => {
    expect(HollowButton).toBeDefined();
    expect(HollowButton.name).toBe('HollowButton');
  });

  it('should have variant prop', () => {
    expect(HollowButton.props.variant).toBeDefined();
    expect(HollowButton.props.variant.default).toBe('primary');
  });

  it('should have size prop', () => {
    expect(HollowButton.props.size).toBeDefined();
    expect(HollowButton.props.size.default).toBe('md');
  });

  it('should have disabled prop', () => {
    expect(HollowButton.props.disabled).toBeDefined();
    expect(HollowButton.props.disabled.default).toBe(false);
  });

  it('should have loading prop', () => {
    expect(HollowButton.props.loading).toBeDefined();
    expect(HollowButton.props.loading.default).toBe(false);
  });

  it('should emit hollow-click', () => {
    expect(HollowButton.emits).toContain('hollow-click');
  });
});

describe('HollowInput', () => {
  it('should be defined', () => {
    expect(HollowInput).toBeDefined();
    expect(HollowInput.name).toBe('HollowInput');
  });

  it('should have type prop', () => {
    expect(HollowInput.props.type).toBeDefined();
    expect(HollowInput.props.type.default).toBe('text');
  });

  it('should have value prop', () => {
    expect(HollowInput.props.value).toBeDefined();
    expect(HollowInput.props.value.default).toBe('');
  });

  it('should have placeholder prop', () => {
    expect(HollowInput.props.placeholder).toBeDefined();
  });

  it('should emit hollow-input', () => {
    expect(HollowInput.emits).toContain('hollow-input');
  });

  it('should emit hollow-change', () => {
    expect(HollowInput.emits).toContain('hollow-change');
  });
});

describe('HollowCard', () => {
  it('should be defined', () => {
    expect(HollowCard).toBeDefined();
    expect(HollowCard.name).toBe('HollowCard');
  });

  it('should have variant prop', () => {
    expect(HollowCard.props.variant).toBeDefined();
    expect(HollowCard.props.variant.default).toBe('default');
  });

  it('should have padding prop', () => {
    expect(HollowCard.props.padding).toBeDefined();
    expect(HollowCard.props.padding.default).toBe('md');
  });

  it('should have interactive prop', () => {
    expect(HollowCard.props.interactive).toBeDefined();
    expect(HollowCard.props.interactive.default).toBe(false);
  });

  it('should emit hollow-click', () => {
    expect(HollowCard.emits).toContain('hollow-click');
  });
});

describe('HollowModal', () => {
  it('should be defined', () => {
    expect(HollowModal).toBeDefined();
    expect(HollowModal.name).toBe('HollowModal');
  });

  it('should have open prop', () => {
    expect(HollowModal.props.open).toBeDefined();
    expect(HollowModal.props.open.default).toBe(false);
  });

  it('should have size prop', () => {
    expect(HollowModal.props.size).toBeDefined();
    expect(HollowModal.props.size.default).toBe('md');
  });

  it('should have closeOnBackdrop prop with attribute mapping', () => {
    expect(HollowModal.props.closeOnBackdrop).toBeDefined();
    expect(HollowModal.props.closeOnBackdrop.default).toBe(true);
  });

  it('should have closeOnEscape prop with attribute mapping', () => {
    expect(HollowModal.props.closeOnEscape).toBeDefined();
    expect(HollowModal.props.closeOnEscape.default).toBe(true);
  });

  it('should emit hollow-open', () => {
    expect(HollowModal.emits).toContain('hollow-open');
  });

  it('should emit hollow-close', () => {
    expect(HollowModal.emits).toContain('hollow-close');
  });
});

describe('HollowSelect', () => {
  it('should be defined', () => {
    expect(HollowSelect).toBeDefined();
    expect(HollowSelect.name).toBe('HollowSelect');
  });

  it('should have options prop as Array', () => {
    expect(HollowSelect.props.options).toBeDefined();
    expect(HollowSelect.props.options.type).toBe(Array);
  });

  it('should have searchable prop', () => {
    expect(HollowSelect.props.searchable).toBeDefined();
    expect(HollowSelect.props.searchable.default).toBe(false);
  });

  it('should have clearable prop', () => {
    expect(HollowSelect.props.clearable).toBeDefined();
    expect(HollowSelect.props.clearable.default).toBe(false);
  });

  it('should have multiple prop', () => {
    expect(HollowSelect.props.multiple).toBeDefined();
    expect(HollowSelect.props.multiple.default).toBe(false);
  });

  it('should emit hollow-change', () => {
    expect(HollowSelect.emits).toContain('hollow-change');
  });

  it('should emit hollow-toggle', () => {
    expect(HollowSelect.emits).toContain('hollow-toggle');
  });
});

describe('HollowCheckbox', () => {
  it('should be defined', () => {
    expect(HollowCheckbox).toBeDefined();
    expect(HollowCheckbox.name).toBe('HollowCheckbox');
  });

  it('should have checked prop', () => {
    expect(HollowCheckbox.props.checked).toBeDefined();
    expect(HollowCheckbox.props.checked.default).toBe(false);
  });

  it('should have indeterminate prop', () => {
    expect(HollowCheckbox.props.indeterminate).toBeDefined();
    expect(HollowCheckbox.props.indeterminate.default).toBe(false);
  });

  it('should emit hollow-change', () => {
    expect(HollowCheckbox.emits).toContain('hollow-change');
  });
});

describe('HollowSwitch', () => {
  it('should be defined', () => {
    expect(HollowSwitch).toBeDefined();
    expect(HollowSwitch.name).toBe('HollowSwitch');
  });

  it('should have checked prop', () => {
    expect(HollowSwitch.props.checked).toBeDefined();
    expect(HollowSwitch.props.checked.default).toBe(false);
  });

  it('should have labelOn prop with attribute mapping', () => {
    expect(HollowSwitch.props.labelOn).toBeDefined();
    expect(HollowSwitch.props.labelOn.default).toBe('');
  });

  it('should have labelOff prop with attribute mapping', () => {
    expect(HollowSwitch.props.labelOff).toBeDefined();
    expect(HollowSwitch.props.labelOff.default).toBe('');
  });

  it('should emit hollow-change', () => {
    expect(HollowSwitch.emits).toContain('hollow-change');
  });
});

describe('HollowTabs', () => {
  it('should be defined', () => {
    expect(HollowTabs).toBeDefined();
    expect(HollowTabs.name).toBe('HollowTabs');
  });

  it('should have tabs prop as Array', () => {
    expect(HollowTabs.props.tabs).toBeDefined();
    expect(HollowTabs.props.tabs.type).toBe(Array);
  });

  it('should have active prop', () => {
    expect(HollowTabs.props.active).toBeDefined();
    expect(HollowTabs.props.active.default).toBe('');
  });

  it('should have alignment prop', () => {
    expect(HollowTabs.props.alignment).toBeDefined();
    expect(HollowTabs.props.alignment.default).toBe('start');
  });

  it('should emit hollow-change', () => {
    expect(HollowTabs.emits).toContain('hollow-change');
  });
});

describe('HollowAccordion', () => {
  it('should be defined', () => {
    expect(HollowAccordion).toBeDefined();
    expect(HollowAccordion.name).toBe('HollowAccordion');
  });

  it('should have items prop as Array', () => {
    expect(HollowAccordion.props.items).toBeDefined();
    expect(HollowAccordion.props.items.type).toBe(Array);
  });

  it('should have multiple prop', () => {
    expect(HollowAccordion.props.multiple).toBeDefined();
    expect(HollowAccordion.props.multiple.default).toBe(false);
  });

  it('should have collapsible prop', () => {
    expect(HollowAccordion.props.collapsible).toBeDefined();
    expect(HollowAccordion.props.collapsible.default).toBe(true);
  });

  it('should emit hollow-change', () => {
    expect(HollowAccordion.emits).toContain('hollow-change');
  });
});

describe('HollowAccordionItem', () => {
  it('should be defined', () => {
    expect(HollowAccordionItem).toBeDefined();
    expect(HollowAccordionItem.name).toBe('HollowAccordionItem');
  });

  it('should have title prop', () => {
    expect(HollowAccordionItem.props.title).toBeDefined();
    expect(HollowAccordionItem.props.title.default).toBe('');
  });

  it('should have expanded prop', () => {
    expect(HollowAccordionItem.props.expanded).toBeDefined();
    expect(HollowAccordionItem.props.expanded.default).toBe(false);
  });

  it('should have disabled prop', () => {
    expect(HollowAccordionItem.props.disabled).toBeDefined();
    expect(HollowAccordionItem.props.disabled.default).toBe(false);
  });

  it('should emit hollow-toggle', () => {
    expect(HollowAccordionItem.emits).toContain('hollow-toggle');
  });
});

describe('vHollowProps directive', () => {
  it('should be defined', () => {
    expect(vHollowProps).toBeDefined();
    expect(typeof vHollowProps.mounted).toBe('function');
    expect(typeof vHollowProps.updated).toBe('function');
  });

  describe('mounted hook', () => {
    it('should set string attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      vHollowProps.mounted(el, { value: { variant: 'primary' } });

      expect(el.setAttribute).toHaveBeenCalledWith('variant', 'primary');
    });

    it('should set boolean attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      vHollowProps.mounted(el, { value: { disabled: true } });

      expect(el.setAttribute).toHaveBeenCalledWith('disabled', '');
    });

    it('should remove false boolean attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      vHollowProps.mounted(el, { value: { disabled: false } });

      expect(el.removeAttribute).toHaveBeenCalledWith('disabled');
    });

    it('should serialize array attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      const options = [{ value: 'a', label: 'A' }];
      vHollowProps.mounted(el, { value: { options } });

      expect(el.setAttribute).toHaveBeenCalledWith('options', JSON.stringify(options));
    });

    it('should attach event handlers', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      const handler = vi.fn();
      vHollowProps.mounted(el, { value: { onClick: handler } });

      expect(el.addEventListener).toHaveBeenCalledWith('hollow-click', expect.any(Function));
    });
  });

  describe('updated hook', () => {
    it('should update changed attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      vHollowProps.updated(el, {
        value: { variant: 'secondary' },
        oldValue: { variant: 'primary' },
      });

      expect(el.setAttribute).toHaveBeenCalledWith('variant', 'secondary');
    });

    it('should not update unchanged attributes', () => {
      const el = {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
      } as unknown as HTMLElement;

      vHollowProps.updated(el, {
        value: { variant: 'primary' },
        oldValue: { variant: 'primary' },
      });

      expect(el.setAttribute).not.toHaveBeenCalled();
    });
  });
});

describe('HollowPlugin', () => {
  it('should be defined', () => {
    expect(HollowPlugin).toBeDefined();
    expect(typeof HollowPlugin.install).toBe('function');
  });

  it('should register all components', () => {
    const app = {
      component: vi.fn(),
      directive: vi.fn(),
    };

    HollowPlugin.install(app);

    expect(app.component).toHaveBeenCalledWith('HollowButton', HollowButton);
    expect(app.component).toHaveBeenCalledWith('HollowInput', HollowInput);
    expect(app.component).toHaveBeenCalledWith('HollowCard', HollowCard);
    expect(app.component).toHaveBeenCalledWith('HollowModal', HollowModal);
    expect(app.component).toHaveBeenCalledWith('HollowSelect', HollowSelect);
    expect(app.component).toHaveBeenCalledWith('HollowCheckbox', HollowCheckbox);
    expect(app.component).toHaveBeenCalledWith('HollowSwitch', HollowSwitch);
    expect(app.component).toHaveBeenCalledWith('HollowTabs', HollowTabs);
    expect(app.component).toHaveBeenCalledWith('HollowAccordion', HollowAccordion);
    expect(app.component).toHaveBeenCalledWith('HollowAccordionItem', HollowAccordionItem);
  });

  it('should register v-hollow-props directive', () => {
    const app = {
      component: vi.fn(),
      directive: vi.fn(),
    };

    HollowPlugin.install(app);

    expect(app.directive).toHaveBeenCalledWith('hollow-props', vHollowProps);
  });
});
