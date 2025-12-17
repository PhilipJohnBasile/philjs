/**
 * PhilJS UI - Official Component Library
 *
 * A comprehensive, accessible UI component library for PhilJS
 * with dark mode support, theming, and 20+ production-ready components.
 */

// Theme
export { ThemeProvider, useTheme, useColorMode, generateCSSVariables } from './theme/ThemeProvider';
export { defaultTheme, colors, spacing, fontSize, fontWeight, fontFamily, borderRadius, boxShadow, transition, zIndex, breakpoints } from './theme/tokens';
export type { Theme } from './theme/tokens';

// Button Components
export { Button, IconButton, ButtonGroup } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonColor } from './components/Button';

// Input Components
export { Input, Textarea } from './components/Input';
export type { InputProps, TextareaProps, InputSize, InputVariant } from './components/Input';

// Select Components
export { Select, MultiSelect } from './components/Select';
export type { SelectProps, MultiSelectProps, SelectOption, SelectSize } from './components/Select';

// Checkbox Components
export { Checkbox, CheckboxGroup } from './components/Checkbox';
export type { CheckboxProps, CheckboxGroupProps, CheckboxSize } from './components/Checkbox';

// Radio Components
export { Radio, RadioGroup } from './components/Radio';
export type { RadioProps, RadioGroupProps, RadioSize } from './components/Radio';

// Switch Component
export { Switch } from './components/Switch';
export type { SwitchProps, SwitchSize } from './components/Switch';

// Modal Components
export { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmDialog } from './components/Modal';
export type { ModalProps, ConfirmDialogProps, ModalSize } from './components/Modal';

// Drawer Components
export { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from './components/Drawer';
export type { DrawerProps, DrawerPlacement, DrawerSize } from './components/Drawer';

// Card Components
export { Card, CardHeader, CardTitle, CardBody, CardFooter, CardImage } from './components/Card';
export type { CardProps, CardVariant } from './components/Card';

// Alert Components
export { Alert, AlertTitle, AlertDescription } from './components/Alert';
export type { AlertProps, AlertStatus, AlertVariant } from './components/Alert';

// Badge Components
export { Badge, StatusIndicator, NotificationBadge } from './components/Badge';
export type { BadgeProps, StatusIndicatorProps, NotificationBadgeProps, BadgeVariant, BadgeColor, BadgeSize, StatusIndicatorStatus } from './components/Badge';

// Tabs Components
export { Tabs, TabList, Tab, TabPanels, TabPanel } from './components/Tabs';
export type { TabsProps, TabListProps, TabProps, TabPanelsProps, TabPanelProps, TabsVariant, TabsSize } from './components/Tabs';

// Tooltip & Popover
export { Tooltip, Popover } from './components/Tooltip';
export type { TooltipProps, PopoverProps, TooltipPlacement } from './components/Tooltip';

// Dropdown Components
export { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from './components/Dropdown';
export type { DropdownProps, DropdownItemProps, DropdownPlacement } from './components/Dropdown';

// Loading Components
export { Spinner, Progress, CircularProgress, Skeleton } from './components/Spinner';
export type { SpinnerProps, ProgressProps, CircularProgressProps, SkeletonProps, SpinnerSize, ProgressSize, ProgressColor } from './components/Spinner';

// Avatar Components
export { Avatar, AvatarGroup, AvatarBadge } from './components/Avatar';
export type { AvatarProps, AvatarGroupProps, AvatarBadgeProps, AvatarSize } from './components/Avatar';

// Table Components
export { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableEmpty } from './components/Table';
export type { TableProps, ThProps, TdProps, TrProps, TableVariant, TableSize } from './components/Table';

// Accordion Components
export { Accordion, AccordionItem, AccordionButton, AccordionPanel } from './components/Accordion';
export type { AccordionProps, AccordionItemProps, AccordionButtonProps, AccordionPanelProps } from './components/Accordion';

// Breadcrumb Components
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbIcons } from './components/Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItemProps, BreadcrumbSeparatorProps } from './components/Breadcrumb';

// Toast Components
export { toast, ToastContainer, useToast } from './components/Toast';
export type { ToastOptions, ToastStatus, ToastPosition } from './components/Toast';
