# Navigation

Navigation components help users find their way around the application and manage content sections.

## Accordion

A vertically stacked set of interactive headings that each reveal an associated section of content.

```tsx
import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@philjs/ui';

// Basic usage
<Accordion>
  <AccordionItem>
    <AccordionButton>
      Section 1 title
    </AccordionButton>
    <AccordionPanel>
      Content for section 1.
    </AccordionPanel>
  </AccordionItem>
  <AccordionItem>
    <AccordionButton>
      Section 2 title
    </AccordionButton>
    <AccordionPanel>
      Content for section 2.
    </AccordionPanel>
  </AccordionItem>
</Accordion>

// Allow multiple expanded items
<Accordion allowMultiple>
  {/* items */}
</Accordion>

// Allow toggling (collapsing all)
<Accordion allowToggle>
  {/* items */}
</Accordion>

// Controlled state
<Accordion index={selectedIndex()} onChange={setSelectedIndex}>
  {/* items */}
</Accordion>
```

### Accordion Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowMultiple` | `boolean` | `false` | Allow multiple items to be expanded |
| `allowToggle` | `boolean` | `false` | Allow all items to be collapsed |
| `index` | `number \| number[]` | - | Controlled expanded index(es) |
| `defaultIndex` | `number \| number[]` | - | Initial expanded index(es) |
| `onChange` | `(index: number \| number[]) => void` | - | Expansion change handler |

## Breadcrumb

Navigation trail showing hierarchy and providing quick access to parent levels.

```tsx
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@philjs/ui';

// Basic breadcrumb
<Breadcrumb>
  <BreadcrumbItem>
    <BreadcrumbLink href="/">Home</BreadcrumbLink>
  </BreadcrumbItem>

  <BreadcrumbItem>
    <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
  </BreadcrumbItem>

  <BreadcrumbItem isCurrentPage>
    <BreadcrumbLink href="/docs/navigation">Navigation</BreadcrumbLink>
  </BreadcrumbItem>
</Breadcrumb>

// Custom separator
<Breadcrumb separator="-">
  {/* items */}
</Breadcrumb>

// Icon separator
<Breadcrumb separator={<ChevronRightIcon />}>
  {/* items */}
</Breadcrumb>
```

### Breadcrumb Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `separator` | `string \| JSX.Element` | `'/'` | Visual separator between items |
| `spacing` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spacing between items |

### BreadcrumbItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isCurrentPage` | `boolean` | `false` | Mark as current page (aria-current) |
| `isLastChild` | `boolean` | `false` | Last item in list |

## Tabs

Organize content into different panes where only one pane is visible at a time.

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@philjs/ui';

// Basic tabs
<Tabs>
  <TabList>
    <Tab>Account</Tab>
    <Tab>Security</Tab>
    <Tab>Settings</Tab>
  </TabList>

  <TabPanels>
    <TabPanel>
      <AccountSettings />
    </TabPanel>
    <TabPanel>
      <SecuritySettings />
    </TabPanel>
    <TabPanel>
      <GeneralSettings />
    </TabPanel>
  </TabPanels>
</Tabs>

// Fitted tabs (fill width)
<Tabs variant="enclosed" isFitted>
  <TabList>
    <Tab>One</Tab>
    <Tab>Two</Tab>
  </TabList>
  {/* panels */}
</Tabs>

// Colored tabs
<Tabs colorScheme="green">
  {/* tabs */}
</Tabs>

// Controlled
<Tabs index={tabIndex()} onChange={handleTabChange}>
  {/* tabs */}
</Tabs>
```

### Tabs Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `index` | `number` | - | Controlled selected index |
| `defaultIndex` | `number` | `0` | Initial selected index |
| `onChange` | `(index: number) => void` | - | Tab change handler |
| `variant` | `'line' \| 'enclosed' \| 'soft-rounded' \| 'solid-rounded'` | `'line'` | Visual style |
| `colorScheme` | `string` | `'blue'` | Color theme |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment of tabs |
| `isFitted` | `boolean` | `false` | stretch tabs to fit width |
| `isLazy` | `boolean` | `false` | Lazy mount panels |

## Accessibility features

- **Accordion**: `aria-expanded`, `aria-controls`, Keyboarding support (Arrow keys, Home/End).
- **Breadcrumb**: `aria-label="breadcrumb"`, `aria-current="page"` for current item.
- **Tabs**: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, Arrow key navigation.
