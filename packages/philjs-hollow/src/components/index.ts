/**
 * Hollow Components
 * @module @philjs/hollow/components
 */

// Button
export { HollowButton, type ButtonVariant, type ButtonSize } from './button.js';

// Input
export { HollowInput, type InputVariant, type InputSize, type InputType } from './input.js';

// Card
export { HollowCard, type CardVariant, type CardPadding } from './card.js';

// Modal
export {
  HollowModal,
  type ModalSize,
  type ModalAnimation,
} from './modal.js';

// Select
export {
  HollowSelect,
  type SelectVariant,
  type SelectSize,
  type SelectOption,
} from './select.js';

// Checkbox
export {
  HollowCheckbox,
  type CheckboxSize,
  type CheckboxVariant,
} from './checkbox.js';

// Switch
export {
  HollowSwitch,
  type SwitchSize,
  type SwitchVariant,
} from './switch.js';

// Tabs
export {
  HollowTabs,
  HollowTabList,
  HollowTab,
  HollowTabPanel,
  type TabsVariant,
  type TabsSize,
  type TabsAlignment,
  type TabDefinition,
} from './tabs.js';

// Accordion
export {
  HollowAccordion,
  HollowAccordionItem,
  type AccordionVariant,
  type AccordionItem,
} from './accordion.js';

// Register all components when this module is imported
import './button.js';
import './input.js';
import './card.js';
import './modal.js';
import './select.js';
import './checkbox.js';
import './switch.js';
import './tabs.js';
import './accordion.js';
