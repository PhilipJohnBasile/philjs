// @philjs/shadcn - Native shadcn/ui components for PhilJS
// Beautiful, accessible components built with signals

// Utilities
export { cn } from './utils.js';

// Components
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

// Form Components
export { Label, labelVariants, type LabelProps } from './form/Label.js';
export { Textarea, type TextareaProps } from './form/Textarea.js';
export { Checkbox, type CheckboxProps } from './form/Checkbox.js';
export { Select, SelectOption, type SelectProps, type SelectOptionProps } from './form/Select.js';
