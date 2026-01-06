/**
 * @philjs/ui - Component Library
 *
 * Production-ready UI components for PhilJS applications.
 */

// ============================================================================
// Core Components
// ============================================================================

export { Button, type ButtonProps } from './components/Button.js';
export { Input, type InputProps } from './components/Input.js';
export { Checkbox, type CheckboxProps } from './components/Checkbox.js';
export { Radio, type RadioProps } from './components/Radio.js';
export { Switch, type SwitchProps } from './components/Switch.js';
export { Select, type SelectProps } from './components/Select.js';
export { Modal, type ModalProps } from './components/Modal.js';
export { Tabs, type TabsProps } from './components/Tabs.js';
export { Table, type TableProps } from './components/Table.js';
export { Toast, type ToastProps } from './components/Toast.js';
export { Tooltip, type TooltipProps } from './components/Tooltip.js';
export { Dropdown, type DropdownProps } from './components/Dropdown.js';
export { Card, type CardProps } from './components/Card.js';
export { Badge, type BadgeProps } from './components/Badge.js';
export { Avatar, type AvatarProps } from './components/Avatar.js';
export { Alert, type AlertProps } from './components/Alert.js';
export { Accordion, type AccordionProps } from './components/Accordion.js';
export { Spinner, type SpinnerProps } from './components/Spinner.js';
export { Breadcrumb, type BreadcrumbProps } from './components/Breadcrumb.js';
export { Drawer, type DrawerProps } from './components/Drawer.js';

// ============================================================================
// Layout Components
// ============================================================================

export { Container, type ContainerProps } from './components/Container/Container.js';
export { Grid, type GridProps } from './components/Grid/Grid.js';
export { Flex, type FlexProps } from './components/Flex/Flex.js';
export { Stack, type StackProps } from './components/Stack/Stack.js';
export { Box, type BoxProps } from './components/Box/Box.js';
export { Divider, type DividerProps } from './components/Divider/Divider.js';

// ============================================================================
// Hooks
// ============================================================================

export { useClickOutside } from './hooks/useClickOutside.js';
export { useFocusTrap } from './hooks/useFocusTrap.js';
export { useMediaQuery } from './hooks/useMediaQuery.js';
export { useId } from './hooks/useId.js';
export { useKeyboard } from './hooks/useKeyboard.js';

// ============================================================================
// Utilities
// ============================================================================

export { cn, mergeClasses, type ClassValue } from './utils/cn.js';
export { variants, slotVariants, type VariantConfig, type VariantProps, type SlotVariantConfig, type SlotVariantProps } from './utils/variants.js';

// ============================================================================
// Legacy Exports (specialized components)
// ============================================================================

export * from './checkout.js';
export * from './video-room.js';
export * from './remotion-player.js';
export * from './geojson-map.js';
export * from './chart.js';
export * from './gsap.js';
export * from './smart-form.js';
