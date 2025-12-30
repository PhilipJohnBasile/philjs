/**
 * PhilJS UI - Official Component Library
 *
 * A comprehensive, accessible UI component library for PhilJS
 * with dark mode support, theming, and 20+ production-ready components.
 */

// Theme
export { ThemeProvider, useTheme, useColorMode, generateCSSVariables } from './theme/ThemeProvider.js';
export { defaultTheme, colors, spacing, fontSize, fontWeight, fontFamily, borderRadius, boxShadow, transition, zIndex, breakpoints } from './theme/tokens.js';
export type { Theme } from './theme/tokens.js';

// Button Components
export { Button, IconButton, ButtonGroup } from './components/Button.js';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonColor } from './components/Button.js';

// Input Components
export { Input, Textarea } from './components/Input.js';
export type { InputProps, TextareaProps, InputSize, InputVariant } from './components/Input.js';

// Select Components
export { Select, MultiSelect } from './components/Select.js';
export type { SelectProps, MultiSelectProps, SelectOption, SelectSize } from './components/Select.js';

// Checkbox Components
export { Checkbox, CheckboxGroup } from './components/Checkbox.js';
export type { CheckboxProps, CheckboxGroupProps, CheckboxSize } from './components/Checkbox.js';

// Radio Components
export { Radio, RadioGroup } from './components/Radio.js';
export type { RadioProps, RadioGroupProps, RadioSize } from './components/Radio.js';

// Switch Component
export { Switch } from './components/Switch.js';
export type { SwitchProps, SwitchSize } from './components/Switch.js';

// Modal Components
export { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmDialog } from './components/Modal.js';
export type { ModalProps, ConfirmDialogProps, ModalSize } from './components/Modal.js';

// Drawer Components
export { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from './components/Drawer.js';
export type { DrawerProps, DrawerPlacement, DrawerSize } from './components/Drawer.js';

// Card Components
export { Card, CardHeader, CardTitle, CardBody, CardFooter, CardImage } from './components/Card.js';
export type { CardProps, CardVariant } from './components/Card.js';

// Alert Components
export { Alert, AlertTitle, AlertDescription } from './components/Alert.js';
export type { AlertProps, AlertStatus, AlertVariant } from './components/Alert.js';

// Badge Components
export { Badge, StatusIndicator, NotificationBadge } from './components/Badge.js';
export type { BadgeProps, StatusIndicatorProps, NotificationBadgeProps, BadgeVariant, BadgeColor, BadgeSize, StatusIndicatorStatus } from './components/Badge.js';

// Tabs Components
export { Tabs, TabList, Tab, TabPanels, TabPanel } from './components/Tabs.js';
export type { TabsProps, TabListProps, TabProps, TabPanelsProps, TabPanelProps, TabsVariant, TabsSize } from './components/Tabs.js';

// Tooltip & Popover
export { Tooltip, Popover } from './components/Tooltip.js';
export type { TooltipProps, PopoverProps, TooltipPlacement } from './components/Tooltip.js';

// Dropdown Components
export { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from './components/Dropdown.js';
export type { DropdownProps, DropdownItemProps, DropdownPlacement } from './components/Dropdown.js';

// Loading Components
export { Spinner, Progress, CircularProgress, Skeleton } from './components/Spinner.js';
export type { SpinnerProps, ProgressProps, CircularProgressProps, SkeletonProps, SpinnerSize, ProgressSize, ProgressColor } from './components/Spinner.js';

// Avatar Components
export { Avatar, AvatarGroup, AvatarBadge } from './components/Avatar.js';
export type { AvatarProps, AvatarGroupProps, AvatarBadgeProps, AvatarSize } from './components/Avatar.js';

// Table Components
export { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableEmpty } from './components/Table.js';
export type { TableProps, ThProps, TdProps, TrProps, TableVariant, TableSize } from './components/Table.js';

// Accordion Components
export { Accordion, AccordionItem, AccordionButton, AccordionPanel } from './components/Accordion.js';
export type { AccordionProps, AccordionItemProps, AccordionButtonProps, AccordionPanelProps } from './components/Accordion.js';

// Breadcrumb Components
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbIcons } from './components/Breadcrumb.js';
export type { BreadcrumbProps, BreadcrumbItemProps, BreadcrumbSeparatorProps } from './components/Breadcrumb.js';

// Toast Components
export { toast, ToastContainer, useToast } from './components/Toast.js';
export type { ToastOptions, ToastStatus, ToastPosition } from './components/Toast.js';
