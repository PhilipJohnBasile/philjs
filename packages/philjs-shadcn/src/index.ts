// @philjs/shadcn - Native shadcn/ui components for PhilJS
// Beautiful, accessible components built with signals

// Utilities
export { cn } from './utils.js';

// Core Components
export { Button, buttonVariants, type ButtonProps } from './components/Button.js';
export { Input, type InputProps } from './components/Input.js';
export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    type CardProps,
    type CardHeaderProps,
    type CardTitleProps,
    type CardDescriptionProps,
    type CardContentProps,
    type CardFooterProps,
} from './components/Card.js';
export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    type DialogProps,
    type DialogTriggerProps,
    type DialogContentProps,
    type DialogHeaderProps,
    type DialogTitleProps,
    type DialogDescriptionProps,
    type DialogFooterProps,
    type DialogCloseProps,
} from './components/Dialog.js';

// Tabs
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    type TabsProps,
    type TabsListProps,
    type TabsTriggerProps,
    type TabsContentProps,
} from './components/Tabs.js';

// Accordion
export {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
    type AccordionProps,
    type AccordionItemProps,
    type AccordionTriggerProps,
    type AccordionContentProps,
} from './components/Accordion.js';

// Avatar
export {
    Avatar,
    AvatarImage,
    AvatarFallback,
    type AvatarProps,
    type AvatarImageProps,
    type AvatarFallbackProps,
} from './components/Avatar.js';

// Badge
export { Badge, badgeVariants, type BadgeProps } from './components/Badge.js';

// Progress
export {
    Progress,
    ProgressIndeterminate,
    CircularProgress,
    type ProgressProps,
    type CircularProgressProps,
} from './components/Progress.js';

// Tooltip
export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    type TooltipProps,
    type TooltipTriggerProps,
    type TooltipContentProps,
    type TooltipProviderProps,
} from './components/Tooltip.js';

// Alert
export {
    Alert,
    AlertTitle,
    AlertDescription,
    alertVariants,
    AlertCircleIcon,
    CheckCircleIcon,
    TriangleAlertIcon,
    InfoIcon,
    type AlertProps,
    type AlertTitleProps,
    type AlertDescriptionProps,
} from './components/Alert.js';

// Skeleton
export {
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    SkeletonCard,
    SkeletonTable,
    SkeletonImage,
    type SkeletonProps,
} from './components/Skeleton.js';

// Switch
export {
    Switch,
    SwitchWithLabel,
    type SwitchProps,
    type SwitchWithLabelProps,
} from './components/Switch.js';

// Slider
export { Slider, type SliderProps } from './components/Slider.js';

// Sheet
export {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
    type SheetProps,
    type SheetTriggerProps,
    type SheetContentProps,
    type SheetHeaderProps,
    type SheetTitleProps,
    type SheetDescriptionProps,
    type SheetFooterProps,
    type SheetCloseProps,
} from './components/Sheet.js';

// Toast
export {
    Toast,
    ToastViewport,
    Toaster,
    useToast,
    toast,
    type ToastProps,
    type ToastViewportProps,
    type ToastState,
} from './components/Toast.js';

// Popover
export {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverClose,
    PopoverAnchor,
    type PopoverProps,
    type PopoverTriggerProps,
    type PopoverContentProps,
    type PopoverCloseProps,
} from './components/Popover.js';

// Dropdown Menu
export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    type DropdownMenuProps,
    type DropdownMenuTriggerProps,
    type DropdownMenuContentProps,
    type DropdownMenuItemProps,
    type DropdownMenuCheckboxItemProps,
    type DropdownMenuRadioGroupProps,
    type DropdownMenuRadioItemProps,
    type DropdownMenuLabelProps,
    type DropdownMenuSeparatorProps,
    type DropdownMenuSubProps,
} from './components/DropdownMenu.js';

// Table
export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
    DataTable,
    type TableProps,
    type TableHeaderProps,
    type TableBodyProps,
    type TableFooterProps,
    type TableRowProps,
    type TableHeadProps,
    type TableCellProps,
    type TableCaptionProps,
    type DataTableColumn,
    type DataTableProps,
} from './components/Table.js';

// Separator
export { Separator, type SeparatorProps } from './components/Separator.js';

// Scroll Area
export {
    ScrollArea,
    ScrollBar,
    ScrollAreaWithFade,
    type ScrollAreaProps,
    type ScrollBarProps,
    type ScrollAreaWithFadeProps,
} from './components/ScrollArea.js';

// Form Components
export { Label, labelVariants, type LabelProps } from './form/Label.js';
export { Textarea, type TextareaProps } from './form/Textarea.js';
export { Checkbox, type CheckboxProps } from './form/Checkbox.js';
export { Select, SelectOption, type SelectProps, type SelectOptionProps } from './form/Select.js';
export {
    RadioGroup,
    RadioGroupItem,
    RadioGroupItemWithLabel,
    type RadioGroupProps,
    type RadioGroupItemProps,
    type RadioGroupItemWithLabelProps,
} from './form/RadioGroup.js';
export {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    useForm,
    type FormProps,
    type FormFieldProps,
    type FormItemProps,
    type FormLabelProps,
    type FormControlProps,
    type FormDescriptionProps,
    type FormMessageProps,
    type ValidationRule,
    type FormState,
} from './form/Form.js';
