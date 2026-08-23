/**
 * MODULE REGISTRY
 * Single source of truth for all ERP sidebar modules.
 * Import this wherever you need the full module list (Sidebar, ModuleCustomization, App route guard).
 *
 * Fields:
 *   id            – unique string key, used as the storage identifier
 *   path          – React Router route path
 *   label         – human-readable display name
 *   description   – short description shown in the customization panel
 *   iconName      – lucide-react icon name (resolved in consuming components)
 *   category      – group name for sidebar sections
 *   categoryKey   – stable key for the category (no spaces/special chars)
 *   color         – optional accent color for the icon
 *   defaultEnabled – whether the module is on by default
 *   adminOnly     – if true, only shown to admin role
 */

export const MODULE_CATEGORIES = [
  { key: 'core',        label: 'CORE MODULES' },
  { key: 'billing',     label: 'BILLING & ESTIMATION' },
  { key: 'finance',     label: 'FINANCE & ACCOUNTS' },
  { key: 'admin',       label: 'ADMINISTRATION' },
];

export const ALL_MODULES = [
  // ── CORE ──────────────────────────────────────────────────────
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    description: 'Main ERP dashboard with KPIs, charts and recent activity',
    iconName: 'LayoutDashboard',
    category: 'CORE MODULES',
    categoryKey: 'core',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'customers',
    path: '/customers',
    label: 'Customers',
    description: 'Manage customer directory, contacts and transaction history',
    iconName: 'Users',
    category: 'CORE MODULES',
    categoryKey: 'core',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'products',
    path: '/products',
    label: 'Products & Inventory',
    description: 'Track stock levels, product catalogue and pricing',
    iconName: 'Package',
    category: 'CORE MODULES',
    categoryKey: 'core',
    defaultEnabled: true,
    adminOnly: false,
  },

  // ── BILLING & ESTIMATION ───────────────────────────────────────
  {
    id: 'quotations',
    path: '/quotations',
    label: 'Quotations',
    description: 'Create and manage customer quotations & estimates',
    iconName: 'FileText',
    category: 'BILLING & ESTIMATION',
    categoryKey: 'billing',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'invoices',
    path: '/invoices',
    label: 'Tax Invoices',
    description: 'GST-compliant tax invoice generation and management',
    iconName: 'Receipt',
    category: 'BILLING & ESTIMATION',
    categoryKey: 'billing',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'labour-bills',
    path: '/labour-bills',
    label: 'Labour Bills',
    description: 'Track and manage labour billing and workforce costs',
    iconName: 'HardHat',
    category: 'BILLING & ESTIMATION',
    categoryKey: 'billing',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'transport-bills',
    path: '/transport-bills',
    label: 'Transport Bills',
    description: 'Manage transport and logistics billing records',
    iconName: 'Truck',
    category: 'BILLING & ESTIMATION',
    categoryKey: 'billing',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'rental-bills',
    path: '/rental-bills',
    label: 'Rental Bills',
    description: 'Manage equipment rentals, security deposits, and returns',
    iconName: 'CalendarRange',
    category: 'BILLING & ESTIMATION',
    categoryKey: 'billing',
    defaultEnabled: true,
    adminOnly: false,
  },

  // ── FINANCE & ACCOUNTS ─────────────────────────────────────────
  {
    id: 'income',
    path: '/income',
    label: 'Income Register',
    description: 'Track all incoming payments and revenue streams',
    iconName: 'ArrowUpRight',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    color: '#22C55E',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'expense',
    path: '/expense',
    label: 'Expense Register',
    description: 'Record and categorize all business expenses',
    iconName: 'ArrowDownRight',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    color: '#EF4444',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'accounts',
    path: '/accounts',
    label: 'Accounts & Balances',
    description: 'Overview of account balances and financial summary',
    iconName: 'Wallet',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    color: '#8B5CF6',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'ledger',
    path: '/ledger',
    label: 'Party Ledger',
    description: 'Detailed ledger view per customer or vendor party',
    iconName: 'BookOpen',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'bill-upload',
    path: '/bill-upload',
    label: 'Bill Upload',
    description: 'Upload and archive purchase bills and documents',
    iconName: 'FileCode',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'notes',
    path: '/notes',
    label: 'Quick Notes',
    description: 'Quick internal notes, reminders and memos',
    iconName: 'StickyNote',
    category: 'FINANCE & ACCOUNTS',
    categoryKey: 'finance',
    defaultEnabled: true,
    adminOnly: false,
  },

  // ── ADMINISTRATION ─────────────────────────────────────────────
  {
    id: 'user-access',
    path: '/user-access',
    label: 'Login Manager',
    description: 'Manage users, roles and access control policies',
    iconName: 'UserCheck',
    category: 'ADMINISTRATION',
    categoryKey: 'admin',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    description: 'Program setup, branding and module customization',
    iconName: 'Settings',
    category: 'CORE MODULES',
    categoryKey: 'core',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'staff',
    path: '/staff',
    label: 'Staff',
    description: 'Manage staff details and generate dynamic ID cards',
    iconName: 'BadgeCheck',
    category: 'ADMINISTRATION',
    categoryKey: 'admin',
    defaultEnabled: true,
    adminOnly: false,
  },
  {
    id: 'admin-settings',
    path: '/admin-settings',
    label: 'Admin Settings',
    description: 'System security policies, backups, audit logs & admin control',
    iconName: 'Shield',
    category: 'ADMINISTRATION',
    categoryKey: 'admin',
    defaultEnabled: true,
    adminOnly: true,
  },
];

/** Returns the storage key for a given programId */
export const getModuleStorageKey = (programId) =>
  programId ? `modules_${programId}` : 'modules_default';

/** Returns the default enabled module ids */
export const getDefaultEnabledModules = () =>
  ALL_MODULES
    .filter((m) => m.defaultEnabled)
    .map((m) => m.id);

/** Returns the default menu order */
export const getDefaultMenuOrder = () => ALL_MODULES.map((m) => m.id);
