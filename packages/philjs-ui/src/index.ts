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

// Combobox Components
export { Combobox, MultiCombobox } from './components/Combobox';
export type { ComboboxProps, ComboboxOption, ComboboxSize, MultiComboboxProps } from './components/Combobox';

// Command Palette Components
export { Command, CommandDialog, useCommand } from './components/Command';
export type { CommandProps, CommandItem, CommandGroup, CommandDialogProps } from './components/Command';

// DataTable Components
export { DataTable, createColumnHelper } from './components/DataTable';
export type { DataTableProps, ColumnDef, SortingState, PaginationState, RowSelectionState, SortDirection } from './components/DataTable';

// Slider Components
export { Slider, RangeSlider } from './components/Slider';
export type { SliderProps, RangeSliderProps, SliderOrientation, SliderSize } from './components/Slider';

// Calendar & DatePicker Components
export { Calendar, DatePicker, DateRangePicker } from './components/Calendar';
export type { CalendarProps, DatePickerProps, DateRangePickerProps } from './components/Calendar';

// Context Menu & Dropdown Menu
export { ContextMenu, DropdownMenu } from './components/ContextMenu';
export type { ContextMenuProps, DropdownMenuProps, MenuItem, MenuItemAction, MenuItemSubmenu, MenuItemCheckbox, MenuItemSeparator, MenuItemRadioGroup } from './components/ContextMenu';

// Tree Components
export { Tree, FileTree } from './components/Tree';
export type { TreeProps, TreeNode, TreeSelectionMode, FileTreeProps, FileTreeNode } from './components/Tree';

// Virtual List Components
export { VirtualList, VirtualGrid, WindowedList } from './components/VirtualList';
export type { VirtualListProps, VirtualGridProps, WindowedListProps } from './components/VirtualList';

// File Upload Components
export { FileUpload, ImageUpload } from './components/FileUpload';
export type { FileUploadProps, ImageUploadProps, UploadedFile } from './components/FileUpload';

// Color Picker Components
export { ColorPicker, SimpleColorPicker } from './components/ColorPicker';
export type { ColorPickerProps, SimpleColorPickerProps } from './components/ColorPicker';

// Scroll & Layout Utilities
export { ScrollArea, ScrollAreaViewport, AspectRatio, Separator, VisuallyHidden } from './components/ScrollArea';
export type { ScrollAreaProps, AspectRatioProps, SeparatorProps, VisuallyHiddenProps, ScrollbarVisibility } from './components/ScrollArea';

// Collapsible Components
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/ScrollArea';
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps } from './components/ScrollArea';

// Resizable Components
export { Resizable, ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ScrollArea';
export type { ResizableProps, ResizablePanelGroupProps, ResizablePanelProps, ResizableHandleProps } from './components/ScrollArea';

// HoverCard Component
export { HoverCard } from './components/ScrollArea';
export type { HoverCardProps } from './components/ScrollArea';
