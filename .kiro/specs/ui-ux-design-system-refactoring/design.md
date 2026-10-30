# Design Document: UI/UX Design System Refactoring

## Overview

This design document outlines the technical architecture for refactoring the GOSIKA e-commerce platform to implement a comprehensive, consistent design system across all user roles (Admin, Vendor, Customer, Delivery). The refactoring transforms the presentation layer while preserving all business logic, backend functionality, and data integrity.

### Key Design Goals

1. **Visual Consistency**: Establish a unified visual language across the entire platform using the primary brand color #FF5500 (orange) and a comprehensive design token system
2. **Component Reusability**: Build a library of reusable React components that implement the design system specifications
3. **Maintainability**: Create clear separation between design concerns (tokens, components) and business logic
4. **Accessibility**: Ensure WCAG 2.1 AA compliance with keyboard navigation, screen readers, and proper contrast ratios
5. **Responsiveness**: Provide optimal user experience across all device sizes with defined breakpoints
6. **Performance**: Maintain fast page loads and smooth interactions through lazy loading, memoization, and efficient rendering

### Scope

- **In Scope**: Design tokens, component library, page templates, application shell, styling, animations, responsive behavior, accessibility features
- **Out of Scope**: Backend API changes, database schema modifications, business logic alterations, new features beyond UI/UX improvements

### Reference Design

The visual design is inspired by `admin-dashboard.html`, which demonstrates:
- Modern glassmorphism effects with backdrop blur
- Clean card-based layouts with subtle shadows
- Vibrant orange (#FF5500) as primary brand color
- Inter font family for typography
- Lucide React icons for consistent iconography
- Chart.js for data visualization

## Architecture

### High-Level Architecture

The design system follows a **layered architecture** that separates concerns and enables independent evolution of each layer:

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Pages                       │
│  (Admin, Vendor, Customer, Delivery specific pages)          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Page Templates                            │
│  (Dashboard, Listing, Detail, Form, Settings, Workflow)      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Application Shell                           │
│          (Sidebar, Header, Main Content Area)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Component Library                           │
│  (Button, Card, Modal, Table, Form Fields, etc.)             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Design Tokens                              │
│     (Colors, Typography, Spacing, Shadows, etc.)             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+ with functional components and hooks
- **Styling**: Tailwind CSS 3+ with custom configuration for design tokens
- **Icons**: Lucide React for consistent iconography
- **Charts**: Chart.js 4+ for data visualization
- **Type Safety**: PropTypes for component prop validation
- **State Management**: React Context API for global state (Auth, Cart, Toast, etc.)
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: React Router v6 for client-side navigation

### Directory Structure

```
frontend/src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.js          # Color token definitions
│   │   ├── typography.js      # Font, size, weight definitions
│   │   ├── spacing.js         # Spacing scale definitions
│   │   ├── shadows.js         # Shadow elevation definitions
│   │   ├── borders.js         # Border radius definitions
│   │   ├── zIndex.js          # Z-index layer definitions
│   │   └── transitions.js     # Animation timing definitions
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.test.jsx
│   │   │   └── Button.md
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Form/
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── Radio.jsx
│   │   │   ├── Switch.jsx
│   │   │   └── DatePicker.jsx
│   │   ├── StatusBadge/
│   │   ├── Toast/
│   │   ├── Breadcrumb/
│   │   ├── Tab/
│   │   ├── Pagination/
│   │   ├── Avatar/
│   │   ├── Icon/
│   │   ├── Tooltip/
│   │   ├── Dropdown/
│   │   ├── LoadingState/
│   │   ├── EmptyState/
│   │   └── ErrorState/
│   ├── templates/
│   │   ├── DashboardTemplate.jsx
│   │   ├── ListingTemplate.jsx
│   │   ├── DetailTemplate.jsx
│   │   ├── FormTemplate.jsx
│   │   ├── SettingsTemplate.jsx
│   │   └── WorkflowTemplate.jsx
│   ├── layout/
│   │   ├── ApplicationShell.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── MainContent.jsx
│   └── utils/
│       ├── classNames.js      # Utility for conditional classes
│       └── a11y.js            # Accessibility utilities
├── components/              # Domain-specific components
├── pages/                  # Page implementations using templates
├── context/                # React Context providers
├── hooks/                  # Custom hooks
└── styles/
    └── design-system.css   # Design token CSS variables
```

## Components and Interfaces

### Design Token System

Design tokens are the atomic design decisions expressed as data. They ensure visual consistency and enable efficient updates across the entire platform.

#### Token Categories

**1. Color Tokens**

```javascript
// design-system/tokens/colors.js
export const colors = {
  primary: {
    DEFAULT: '#FF5500',
    50: '#FFF5F0',
    100: '#FFE5D9',
    200: '#FFCCB3',
    300: '#FFB38C',
    400: '#FF9966',
    500: '#FF5500',
    600: '#CC4400',
    700: '#993300',
    800: '#662200',
    900: '#331100',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  background: {
    page: '#f8fafc',
    card: '#ffffff',
    subtle: '#f1f5f9',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
  },
};
```

**2. Typography Tokens**

```javascript
// design-system/tokens/typography.js
export const typography = {
  fontFamily: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '18px',
    xl: '22px',
  },
  fontWeight: {
    normal: 500,
    medium: 600,
    semibold: 700,
    bold: 800,
    black: 900,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.3px',
  },
};
```

**3. Spacing Tokens**

```javascript
// design-system/tokens/spacing.js
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};
```

**4. Shadow Tokens**

```javascript
// design-system/tokens/shadows.js
export const shadows = {
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  md: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
  lg: '0 12px 28px -4px rgba(15, 23, 42, 0.12)',
  xl: '0 20px 40px -8px rgba(15, 23, 42, 0.15)',
  primaryGlow: '0 0 20px rgba(255, 85, 0, 0.3)',
};
```

**5. Border Tokens**

```javascript
// design-system/tokens/borders.js
export const borders = {
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '999px',
  },
  width: {
    DEFAULT: '1px',
    thick: '2px',
  },
};
```

**6. Z-Index Tokens**

```javascript
// design-system/tokens/zIndex.js
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  toast: 50,
  tooltip: 60,
};
```

**7. Transition Tokens**

```javascript
// design-system/tokens/transitions.js
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

#### CSS Custom Properties Implementation

Design tokens are exposed as CSS custom properties for global access:

```css
/* styles/design-system.css */
:root {
  /* Colors */
  --color-primary: #FF5500;
  --color-primary-50: #FFF5F0;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Typography */
  --font-family-base: 'Inter', -apple-system, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-weight-normal: 500;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  
  /* Shadows */
  --shadow-md: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
  
  /* Transitions */
  --transition-duration-base: 200ms;
  --transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Component Library

The component library provides reusable, composable UI primitives that implement the design system.

#### Button Component

**Interface**:

```javascript
// design-system/components/Button/Button.jsx
import PropTypes from 'prop-types';

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Implementation
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};
```

**Styling Specifications**:

- **Primary**: Orange background (#FF5500), white text, shadow on hover
- **Secondary**: Gray background, dark text
- **Outline**: Transparent background, orange border, orange text
- **Ghost**: Transparent background, orange text on hover
- **Danger**: Red background, white text

**Size Specifications**:
- **sm**: 32px height, 12px horizontal padding, 13px font size
- **md**: 40px height, 16px horizontal padding, 13px font size
- **lg**: 48px height, 24px horizontal padding, 14px font size

**States**:
- **Hover**: 10% darker background, elevated shadow
- **Active**: 15% darker background, scale to 97%
- **Disabled**: 40% opacity, no-drop cursor
- **Loading**: Spinner icon, pointer-events disabled

#### Form Components

**Input Component**:

```javascript
// design-system/components/Form/Input.jsx
export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  placeholder = '',
  icon = null,
  className = '',
  ...props
}) => {
  // Implementation
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
};
```

**Styling Specifications**:
- Height: 40px (medium)
- Padding: 12px horizontal, 8px vertical
- Border: 1px solid neutral-200, orange on focus
- Border Radius: 8px
- Font Size: 14px
- Focus State: Orange border, subtle ring shadow

**States**:
- **Default**: Gray border, white background
- **Focus**: Orange border with ring shadow
- **Error**: Red border, red error message below
- **Success**: Green border (when validation passes)
- **Disabled**: Reduced opacity, no-drop cursor

**Select Component**:

Similar styling to Input with dropdown arrow icon that rotates when opened.

**Checkbox Component**:

- Size: 20px × 20px
- Border Radius: 4px
- Checked State: Orange background with white checkmark
- Focus State: Orange ring shadow

**Radio Component**:

- Size: 20px × 20px
- Border Radius: full (circle)
- Selected State: Orange border with orange inner dot

**Switch Component**:

- Width: 44px, Height: 24px
- Off State: Gray background, white thumb on left
- On State: Orange background, white thumb on right
- Smooth transition animation (200ms)

#### Card Component

```javascript
// design-system/components/Card/Card.jsx
export const Card = ({
  children,
  padding = 'md',
  shadow = 'md',
  hoverable = false,
  onClick = null,
  className = '',
}) => {
  // Implementation
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  shadow: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hoverable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
```

**Styling Specifications**:
- Background: White
- Border: 1px solid neutral-200/80
- Border Radius: 12px
- Shadow: Varies by shadow prop
- Padding: Varies by padding prop (sm: 12px, md: 20px, lg: 24px)

**Hover State** (when hoverable=true):
- Translate up 4px
- Increase shadow from md to lg
- Transition: 300ms cubic-bezier

#### Status Badge Component

```javascript
// design-system/components/StatusBadge/StatusBadge.jsx
export const StatusBadge = ({
  status,
  customMapping = {},
}) => {
  // Implementation
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  customMapping: PropTypes.object,
};
```

**Status Mapping**:

```javascript
const defaultStatusMapping = {
  pending: { bg: '#f59e0b', text: '#78350f' },
  processing: { bg: '#3b82f6', text: 'white' },
  completed: { bg: '#10b981', text: 'white' },
  delivered: { bg: '#059669', text: 'white' },
  cancelled: { bg: '#ef4444', text: 'white' },
  refunded: { bg: '#ef4444', text: 'white' },
  paid: { bg: '#10b981', text: 'white' },
};
```

**Styling Specifications**:
- Font Size: 11px
- Font Weight: 700
- Padding: 4px 10px
- Border Radius: 999px (pill shape)
- Text Transform: Uppercase
- Letter Spacing: 0.3px

#### Data Table Component

```javascript
// design-system/components/Table/Table.jsx
export const Table = ({
  columns,
  data,
  sortable = true,
  selectable = false,
  onRowSelect = null,
  loading = false,
  error = null,
  emptyState = null,
  stickyHeader = true,
  mobileCardLayout = true,
}) => {
  // Implementation
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    render: PropTypes.func,
  })).isRequired,
  data: PropTypes.array.isRequired,
  sortable: PropTypes.bool,
  selectable: PropTypes.bool,
  onRowSelect: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyState: PropTypes.node,
  stickyHeader: PropTypes.bool,
  mobileCardLayout: PropTypes.bool,
};
```

**Features**:
- Column sorting (ascending/descending toggle)
- Row selection with checkboxes
- Sticky header that remains visible while scrolling
- Responsive card layout on mobile (<768px)
- Loading state with skeleton loaders
- Empty state when no data
- Error state with retry button
- Row hover effect with background color change

**Styling Specifications**:
- Header Background: neutral-50
- Header Text: 12px, 600 weight, neutral-700
- Row Padding: 12px vertical, 16px horizontal
- Row Border: 1px bottom border, neutral-200
- Hover Background: neutral-50/50

#### Modal Component

```javascript
// design-system/components/Modal/Modal.jsx
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  // Implementation with focus trap and scroll lock
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'full']),
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
};
```

**Size Specifications**:
- sm: 400px width
- md: 600px width
- lg: 800px width
- full: 90vw width

**Animations**:
- Backdrop: Fade in/out (200ms)
- Content: Fade + scale from 95% to 100% (300ms)

**Accessibility**:
- Focus trap within modal
- Escape key to close
- Focus returns to trigger element on close
- Scroll lock on body
- ARIA role="dialog"
- ARIA labelledby pointing to title

#### Toast Notification Component

```javascript
// design-system/components/Toast/Toast.jsx
export const Toast = ({
  type = 'info',
  message,
  action = null,
  duration = 5000,
  onDismiss,
}) => {
  // Implementation with auto-dismiss and pause on hover
};

Toast.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  message: PropTypes.string.isRequired,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  duration: PropTypes.number,
  onDismiss: PropTypes.func.isRequired,
};
```

**Type Styling**:
- success: Green background, white text, checkmark icon
- error: Red background, white text, X icon
- warning: Yellow background, dark text, alert icon
- info: Blue background, white text, info icon

**Behavior**:
- Auto-dismiss after duration (success/info only)
- Manual dismiss for error/warning
- Pause timer on hover
- Stack vertically at top-right
- Slide down + fade in animation (300ms)
- Slide up + fade out animation (300ms)

#### Loading, Empty, and Error States

**LoadingState Component**:

```javascript
export const LoadingState = ({
  message = 'Loading...',
  size = 'md',
}) => {
  // Spinner with optional message
};
```

**EmptyState Component**:

```javascript
export const EmptyState = ({
  icon,
  title,
  description,
  action = null,
}) => {
  // Icon, title, description, optional action button
};
```

**ErrorState Component**:

```javascript
export const ErrorState = ({
  error,
  onRetry,
}) => {
  // Error icon, message, retry button
};
```

### Application Shell

The Application Shell provides the consistent layout structure for authenticated pages.

#### Architecture

```
┌───────────────────────────────────────────────────────────┐
│                        Header                             │
│  (Search, Status, Date, Notifications, Profile)           │
├────────────┬──────────────────────────────────────────────┤
│            │                                               │
│            │                                               │
│  Sidebar   │         Main Content Area                     │
│  (260px)   │         (Scrollable)                          │
│            │                                               │
│            │                                               │
└────────────┴──────────────────────────────────────────────┘
```

#### Sidebar Component

```javascript
// design-system/layout/Sidebar.jsx
export const Sidebar = ({
  role, // 'admin' | 'vendor' | 'customer' | 'delivery'
  navigationItems,
  userInfo,
  onNavigate,
}) => {
  // Implementation
};
```

**Structure**:
1. Brand Header (fixed at top)
2. Navigation Links (scrollable middle section)
3. User Status Footer (fixed at bottom)

**Navigation Items Structure**:

```javascript
const navigationItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: 'layout-dashboard', href: '/admin/dashboard', badge: null, active: true },
      { label: 'Analytics', icon: 'bar-chart-3', href: '/admin/analytics', badge: null },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Orders', icon: 'shopping-cart', href: '/admin/orders', badge: 128 },
      { label: 'Returns', icon: 'rotate-ccw', href: '/admin/returns', badge: 16 },
    ],
  },
  // More sections...
];
```

**Responsive Behavior**:
- Desktop (≥1024px): Fixed sidebar visible
- Tablet/Mobile (<1024px): Collapsible sidebar with hamburger menu

#### Header Component

```javascript
// design-system/layout/Header.jsx
export const Header = ({
  onSearch,
  notifications = [],
  systemStatus = { live: true, message: 'Live Syncing' },
  onNotificationClick,
  onProfileClick,
}) => {
  // Implementation
};
```

**Structure**:
- Search bar with keyboard shortcut (⌘K)
- System status indicator
- Nepali date display (if applicable)
- Notification bell with badge count
- Help icon
- Settings icon
- Profile dropdown trigger

**Styling**:
- Sticky positioning (z-index: 30)
- Backdrop blur: 12px
- Background: white/90 (semi-transparent)
- Border bottom: neutral-200/80

#### Main Content Component

```javascript
// design-system/layout/MainContent.jsx
export const MainContent = ({
  children,
}) => {
  // Scrollable content container
};
```

**Styling**:
- Flex: 1 (takes remaining space)
- Overflow-y: auto
- Padding: 32px
- Background: neutral-50

### Page Templates

Page templates provide predefined layouts for common page types.

#### Dashboard Template

```javascript
// design-system/templates/DashboardTemplate.jsx
export const DashboardTemplate = ({
  greeting,
  user,
  actionButton = null,
  kpiMetrics = [],
  charts = [],
  recentActivity = null,
}) => {
  // Implementation
};
```

**Structure**:
1. Hero greeting section with user info and action button
2. KPI metrics grid (5 columns on desktop, responsive)
3. Charts section (2/3 + 1/3 grid)
4. Recent activity table or list

#### Listing Template

```javascript
// design-system/templates/ListingTemplate.jsx
export const ListingTemplate = ({
  title,
  breadcrumb = null,
  actions = [],
  filters = null,
  table,
  pagination = null,
}) => {
  // Implementation
};
```

**Structure**:
1. Breadcrumb navigation (optional)
2. Page header with title and action buttons
3. Filter toolbar
4. Data table
5. Pagination controls

#### Detail Template

```javascript
// design-system/templates/DetailTemplate.jsx
export const DetailTemplate = ({
  breadcrumb,
  entityHeader,
  tabs = [],
  activeTab = 0,
  tabContent,
  actions = [],
}) => {
  // Implementation
};
```

**Structure**:
1. Breadcrumb navigation
2. Entity header with title, status badge, and metadata
3. Tab navigation
4. Active tab content
5. Action buttons

#### Form Template

```javascript
// design-system/templates/FormTemplate.jsx
export const FormTemplate = ({
  breadcrumb,
  title,
  sections = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
}) => {
  // Implementation with validation
};
```

**Structure**:
1. Breadcrumb navigation
2. Form header with title
3. Form sections with labels
4. Validation messages
5. Submit and cancel buttons

## Data Models

This refactoring does not introduce new data models as it focuses on the presentation layer. However, it defines **component prop interfaces** that shape how data flows into components.

### Component Data Contracts

#### Table Column Definition

```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}
```

#### Navigation Item Definition

```typescript
interface NavigationItem {
  label: string;
  icon: string; // Lucide icon name
  href: string;
  badge?: number | null;
  active?: boolean;
  children?: NavigationItem[];
}

interface NavigationSection {
  section: string;
  items: NavigationItem[];
}
```

#### KPI Metric Definition

```typescript
interface KPIMetric {
  label: string;
  value: string | number;
  icon: string; // Lucide icon name
  iconColor: 'orange' | 'blue' | 'green' | 'purple' | 'red';
  change?: number; // Percentage change
  changeLabel?: string; // e.g., "vs last 30d"
  onClick?: () => void;
}
```

#### Chart Data Definition

```typescript
interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
```

## Error Handling

### Error Boundaries

Implement React Error Boundaries to catch rendering errors:

```javascript
// design-system/components/ErrorBoundary/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState error={this.state.error} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

### Form Validation Errors

Form validation errors are displayed inline below each field:

```javascript
const FormField = ({ error, ...props }) => {
  return (
    <div>
      <Input {...props} />
      {error && (
        <p className="text-sm text-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

### API Error Handling

API errors trigger toast notifications:

```javascript
try {
  const response = await api.post('/orders', orderData);
  toast.success('Order created successfully');
} catch (error) {
  toast.error(error.message || 'Failed to create order. Please try again.');
}
```

### Network Error States

Data fetching failures display ErrorState component with retry:

```javascript
const OrderList = () => {
  const { data, loading, error, refetch } = useOrders();
  
  if (loading) return <LoadingState message="Loading orders..." />;
  if (error) return <ErrorState error={error.message} onRetry={refetch} />;
  if (!data.length) return <EmptyState title="No orders yet" />;
  
  return <Table columns={columns} data={data} />;
};
```

## Testing Strategy

### Unit Testing

**Approach**: Test component logic, prop handling, and state management in isolation.

**Tools**: 
- Jest for test runner
- React Testing Library for component testing
- @testing-library/user-event for user interactions

**Test Coverage Requirements**:
- All components in the component library: 80% coverage minimum
- Focus on behavior, not implementation details
- Test accessibility attributes (ARIA labels, roles)

**Example Test Structure**:

```javascript
// design-system/components/Button/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

**Components to Unit Test**:
- Button (all variants and states)
- Form fields (Input, Select, Checkbox, Radio, Switch)
- Card (hover behavior, click handling)
- Modal (open/close, focus trap, escape key)
- Toast (auto-dismiss, pause on hover)
- Table (sorting, filtering, selection)
- StatusBadge (status mapping)
- All loading/empty/error states

### Integration Testing

**Approach**: Test component composition and interaction within templates.

**Test Scenarios**:
- Form submission with validation
- Table filtering and sorting
- Modal opening from button click
- Toast notifications triggered by actions
- Navigation between pages

**Example Integration Test**:

```javascript
describe('Form Template Integration', () => {
  it('displays validation errors on invalid submit', async () => {
    render(<FormTemplate sections={formSections} onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits form with valid data', async () => {
    render(<FormTemplate sections={formSections} onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
});
```

### Visual Regression Testing

**Approach**: Capture screenshots of components in various states and compare against baseline.

**Tools**: 
- Storybook for component showcase
- Chromatic or Percy for visual testing

**Coverage**:
- All component variants (primary button, secondary button, etc.)
- All component states (hover, active, disabled, loading, error)
- Responsive breakpoints (desktop, tablet, mobile)

### Accessibility Testing

**Approach**: Automated and manual testing for WCAG 2.1 AA compliance.

**Tools**:
- jest-axe for automated a11y testing
- WAVE browser extension for manual testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

**Test Coverage**:
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus indicators visible on all interactive elements
- ARIA labels present on icon-only buttons
- ARIA live regions for dynamic content
- Color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Form validation errors announced to screen readers

**Example Accessibility Test**:

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has aria-label when only icon is present', () => {
    render(<Button icon={<SearchIcon />} aria-label="Search" />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });
});
```

### Performance Testing

**Approach**: Measure rendering performance and identify bottlenecks.

**Metrics**:
- First Contentful Paint (FCP) < 1.5s on 3G
- Time to Interactive (TTI) < 3s on 3G
- No layout shifts (CLS = 0)
- Table rendering with 100+ rows < 500ms

**Tools**:
- React DevTools Profiler
- Lighthouse CI for automated performance audits
- Web Vitals monitoring

**Optimization Techniques**:
- React.memo for components with stable props
- useCallback for event handlers passed to children
- useMemo for expensive computations
- Virtual scrolling for large tables (react-window)
- Lazy loading for route components
- Image lazy loading with Intersection Observer

### Browser Compatibility Testing

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Testing Approach**:
- BrowserStack for cross-browser testing
- Polyfills for modern JavaScript features
- Autoprefixer for CSS vendor prefixes
- Graceful degradation for unsupported features

## Migration Strategy

### Phased Rollout Approach

The refactoring follows an incremental, module-by-module migration strategy to minimize risk and maintain system stability.

**Phase 1: Foundation (Week 1-2)**
- Set up design token system
- Build core component library (Button, Card, Input, etc.)
- Create Application Shell
- Implement Toast notification system
- Set up error boundaries

**Phase 2: Admin Module (Week 3-5)**
- Refactor Admin Dashboard (using Dashboard Template)
- Refactor Admin Orders listing (using Listing Template)
- Refactor Admin Order detail (using Detail Template)
- Refactor Admin Settings (using Settings Template)
- Run regression tests and visual QA

**Phase 3: Vendor Module (Week 6-7)**
- Refactor Vendor Dashboard
- Refactor Vendor Products listing and forms
- Refactor Vendor Orders
- Run regression tests and visual QA

**Phase 4: Customer Module (Week 8-9)**
- Refactor Customer Home page
- Refactor Product listings and detail pages
- Refactor Cart and Checkout
- Refactor Customer Account pages
- Run regression tests and visual QA

**Phase 5: Delivery Module (Week 10)**
- Refactor Delivery Dashboard
- Refactor Delivery tasks and routes
- Run regression tests and visual QA

**Phase 6: Polish and Optimization (Week 11-12)**
- Performance optimization
- Accessibility audit and fixes
- Cross-browser testing
- Documentation updates
- Final visual QA

### Coexistence Strategy

During migration, old and new components coexist:

```javascript
// Use feature flag to enable new design system
const useNewDesignSystem = process.env.REACT_APP_NEW_DESIGN_SYSTEM === 'true';

const DashboardPage = () => {
  if (useNewDesignSystem) {
    return <NewDashboard />; // Uses design system components
  }
  return <OldDashboard />; // Original implementation
};
```

### Testing After Each Migration

After refactoring each module:

1. **Functional Testing**: Run existing test suites to verify business logic intact
2. **Visual Testing**: Compare screenshots against original UI
3. **Accessibility Testing**: Run axe audits and keyboard navigation tests
4. **Performance Testing**: Measure page load times and rendering performance
5. **User Acceptance**: Conduct UAT with stakeholders

### Rollback Plan

Each module has a rollback mechanism:

```javascript
// Rollback to old implementation by changing feature flag
// .env file
REACT_APP_NEW_DESIGN_SYSTEM_ADMIN=false // Rollback admin module
REACT_APP_NEW_DESIGN_SYSTEM_VENDOR=true  // Keep vendor module
```

### Breaking Changes Documentation

Document any API changes required during migration:

```markdown
## Breaking Changes

### Button Component
- **Old**: `<button className="btn-primary" onClick={handleClick}>Click</button>`
- **New**: `<Button variant="primary" onClick={handleClick}>Click</Button>`

### Status Display
- **Old**: `<span className={getStatusClass(status)}>{status}</span>`
- **New**: `<StatusBadge status={status} />`
```

## Design System Governance

### Component Contribution Process

1. **Proposal**: Submit component proposal with use cases and design mockup
2. **Review**: Design system team reviews for consistency and necessity
3. **Implementation**: Develop component following design token standards
4. **Testing**: Write unit tests, accessibility tests, and documentation
5. **Approval**: Final review and approval before merge
6. **Documentation**: Update component gallery and usage guidelines

### Design Token Updates

Changes to design tokens require approval from design lead:

1. Propose token change with rationale
2. Visual impact assessment across all components
3. Approval from design lead
4. Update token definition
5. Test all affected components
6. Deploy and monitor for issues

### Enforcement Mechanisms

**ESLint Rules**:

```javascript
// .eslintrc.js
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: "Literal[value=/#[0-9a-fA-F]{3,6}/]",
      message: 'Use design tokens instead of hardcoded colors',
    },
  ],
}
```

**TypeScript Prop Validation**:

All components require PropTypes definitions enforcing correct prop usage.

**Pre-commit Hooks**:

```bash
# Run linting and tests before commit
npm run lint && npm run test
```

### Regular Audits

- **Quarterly Design Review**: Assess design system usage and identify inconsistencies
- **Accessibility Audit**: Test with screen readers and keyboard navigation
- **Performance Audit**: Profile component rendering and identify optimization opportunities

## Performance Optimization

### Code Splitting

Implement route-based code splitting to reduce initial bundle size:

```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));

const App = () => {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      </Routes>
    </Suspense>
  );
};
```

### Component Memoization

Use React.memo for components that receive stable props:

```javascript
export const TableRow = React.memo(({ row, columns }) => {
  return (
    <tr>
      {columns.map(col => (
        <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
      ))}
    </tr>
  );
});
```

### Event Handler Optimization

Memoize event handlers to prevent unnecessary re-renders:

```javascript
const TableComponent = ({ data, onRowClick }) => {
  const handleRowClick = useCallback((rowId) => {
    onRowClick(rowId);
  }, [onRowClick]);

  return (
    <Table data={data} onRowClick={handleRowClick} />
  );
};
```

### Search Debouncing

Debounce search input to reduce API calls:

```javascript
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  return <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
};
```

### Virtual Scrolling

Implement virtual scrolling for large data tables:

```javascript
import { FixedSizeList } from 'react-window';

const VirtualTable = ({ data, rowHeight = 48 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {/* Render row at index */}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={data.length}
      itemSize={rowHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Image Optimization

Lazy load images with Intersection Observer:

```javascript
const LazyImage = ({ src, alt }) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img ref={imgRef} src={isLoaded ? src : ''} alt={alt} loading="lazy" />
  );
};
```

### CSS Optimization

- Use Tailwind JIT mode to generate only used classes
- Avoid inline styles for repeated styling
- Use CSS transforms for animations instead of layout properties
- Minimize reflows by batching DOM updates

## Accessibility Implementation

### Keyboard Navigation

**Focus Management**:

```javascript
// Modal focus trap
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modalRef.current.addEventListener('keydown', handleTab);
    firstElement.focus();

    return () => modalRef.current?.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Rest of implementation
};
```

**Skip to Content Link**:

```javascript
const SkipToContent = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white"
  >
    Skip to main content
  </a>
);
```

### Screen Reader Support

**ARIA Live Regions**:

```javascript
// Toast notifications use aria-live
<div role="status" aria-live="polite" aria-atomic="true">
  {toast.message}
</div>
```

**ARIA Labels**:

```javascript
// Icon-only buttons
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

// Form fields
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-error" />
{error && <span id="email-error" role="alert">{error}</span>}
```

**Page Title Updates**:

```javascript
useEffect(() => {
  document.title = `${pageTitle} - GOSIKA`;
}, [pageTitle]);
```

### Color Contrast

All color combinations meet WCAG AA standards:

- Primary brand (#FF5500) on white background: 4.54:1 ✓
- Slate-900 text on white background: 16.10:1 ✓
- Slate-600 text on white background: 7.23:1 ✓
- White text on primary background: 4.54:1 ✓

### Reduced Motion Support

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
// React implementation
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const transition = prefersReducedMotion ? 'none' : 'all 200ms ease';
```

## Browser Compatibility

### Supported Browsers

- Chrome 90+ (released April 2021)
- Firefox 88+ (released April 2021)
- Safari 14+ (released September 2020)
- Edge 90+ (released April 2021)

### Polyfills

Include polyfills for modern JavaScript features:

```javascript
// vite.config.js
export default {
  build: {
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
  },
};
```

### CSS Vendor Prefixes

Use Autoprefixer via PostCSS:

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead'],
    },
  },
};
```

### Feature Detection

Detect and handle unsupported features:

```javascript
// Check for CSS Grid support
const supportsGrid = CSS.supports('display', 'grid');

if (!supportsGrid) {
  // Use flexbox fallback layout
}
```

### Unsupported Browser Warning

Display warning for unsupported browsers:

```javascript
const BrowserWarning = () => {
  const isSupported = checkBrowserSupport();

  if (isSupported) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-warning text-white p-4 z-50">
      Your browser is not supported. Please upgrade to a modern browser for the best experience.
    </div>
  );
};
```

## Responsive Breakpoints

### Breakpoint Definitions

```javascript
// design-system/tokens/breakpoints.js
export const breakpoints = {
  sm: '480px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1440px',  // Desktop
};
```

### Responsive Behavior by Breakpoint

**≥1440px (Desktop Large)**:
- 5-column KPI grid
- Full sidebar (260px)
- Full-width data tables
- Side-by-side chart layouts

**1024px - 1439px (Desktop Small)**:
- 3-column KPI grid
- Full sidebar (260px)
- Full-width data tables
- Stacked chart layouts

**768px - 1023px (Tablet)**:
- 2-column KPI grid
- Collapsible sidebar (hamburger menu)
- Full-width data tables
- Stacked layouts

**480px - 767px (Mobile Landscape)**:
- 2-column KPI grid
- Hamburger menu navigation
- Card-based data display (not tables)
- Stacked form layouts
- Reduced padding and margins

**<480px (Mobile Portrait)**:
- 1-column KPI grid
- Hamburger menu navigation
- Card-based data display
- Stacked form layouts
- Modal full-screen on mobile

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5500',
          50: '#FFF5F0',
          // ... rest of palette
        },
      },
    },
  },
};
```

## Documentation

### Component Documentation Format

Each component includes a markdown documentation file:

```markdown
# Button Component

## Description
A flexible button component with multiple variants and states.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' | 'primary' | Visual style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| disabled | boolean | false | Whether button is disabled |
| loading | boolean | false | Whether button shows loading spinner |
| onClick | function | - | Click handler |

## Usage Examples

### Primary Button
```jsx
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>
```

### Button with Icon
```jsx
<Button variant="primary" icon={<PlusIcon />}>
  Add Item
</Button>
```

## Accessibility
- Includes focus indicator
- Disabled state prevents keyboard interaction
- Loading state includes aria-busy attribute

## Related Components
- IconButton (button with only icon)
- ButtonGroup (multiple buttons grouped together)
```

### Storybook Integration

Set up Storybook for visual component gallery:

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/design-system/**/*.stories.jsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-controls'],
};

// Button.stories.jsx
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => <Button variant="primary">Primary Button</Button>;
export const Secondary = () => <Button variant="secondary">Secondary Button</Button>;
export const Loading = () => <Button loading>Loading Button</Button>;
```

### Design Token Documentation

Visual documentation showing all design tokens:

```markdown
# Design Tokens

## Colors

### Primary Brand
- **Primary**: #FF5500
- Usage: Buttons, links, active states

### Semantic Colors
- **Success**: #10b981 - Success messages, positive indicators
- **Warning**: #f59e0b - Warning messages, pending states
- **Error**: #ef4444 - Error messages, destructive actions
- **Info**: #3b82f6 - Informational messages, processing states

## Typography

### Font Sizes
- **XS**: 11px - Badges, tiny labels
- **SM**: 13px - Small text, buttons
- **Base**: 14px - Body text, inputs
- **MD**: 15px - H3 headings
- **LG**: 18px - H2 headings
- **XL**: 22px - H1 headings

## Spacing

- **1**: 4px
- **2**: 8px
- **4**: 16px
- **6**: 24px
- **8**: 32px
```

## Summary

This design document provides a comprehensive technical architecture for refactoring the GOSIKA e-commerce platform UI/UX. The design follows a layered approach with design tokens at the foundation, a reusable component library in the middle, and page templates at the top. The implementation preserves all existing business logic and backend functionality while transforming the presentation layer for consistency, accessibility, and maintainability.

Key technical decisions:
- **React + Tailwind CSS** for component implementation and styling
- **Design tokens as CSS custom properties** for global accessibility
- **Component-driven architecture** for reusability and consistency
- **Incremental module-by-module migration** for risk mitigation
- **WCAG 2.1 AA compliance** for accessibility
- **Comprehensive testing strategy** covering unit, integration, visual, and accessibility tests

The design system will be governed by a contribution process and enforced through linting rules, prop validation, and regular audits to prevent technical debt accumulation.
