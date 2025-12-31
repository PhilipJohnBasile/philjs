/**
 * Framework Wrappers for Hollow Components
 * @module @philjs/hollow/wrappers
 */
// React wrappers
export { createReactWrapper, Button as ReactButton, Input as ReactInput, Card as ReactCard, Modal as ReactModal, Select as ReactSelect, Checkbox as ReactCheckbox, Switch as ReactSwitch, Tabs as ReactTabs, Accordion as ReactAccordion, AccordionItem as ReactAccordionItem, useHollowEvent, } from './react.js';
// Vue wrappers
export { createVueWrapper, HollowButton as VueButton, HollowInput as VueInput, HollowCard as VueCard, HollowModal as VueModal, HollowSelect as VueSelect, HollowCheckbox as VueCheckbox, HollowSwitch as VueSwitch, HollowTabs as VueTabs, HollowAccordion as VueAccordion, HollowAccordionItem as VueAccordionItem, vHollowProps, HollowPlugin, } from './vue.js';
// Svelte actions
export { hollow, hollowButton, hollowInput, hollowCard, hollowModal, hollowSelect, hollowCheckbox, hollowSwitch, hollowTabs, hollowAccordion, hollowAccordionItem, createHollowStore, onHollowEvent, } from './svelte.js';
// PhilJS bindings
export { Button, Input, Card, Modal, Select, Checkbox, Switch, Tabs, Accordion, AccordionItem, bindProp, hollowProps, useHollowRef, } from './philjs.js';
//# sourceMappingURL=index.js.map