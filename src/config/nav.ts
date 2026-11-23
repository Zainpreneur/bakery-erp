import {
  IconLayoutDashboard,
  IconShoppingCart,
  IconBox,
  IconPackages,
  IconUsers,
  IconTruck,
  IconReceipt,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";

export type Workspace = {
  name: string;
  plan: string;
  icon: Icon;
};

export const workspaces: Workspace[] = [
  { name: "Crumb & Co.", plan: "Bakery workspace", icon: IconLayoutDashboard },
];

export type NavChild = { title: string; url: string };

export type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  badge?: string;
  adminOnly?: boolean;
  items?: NavChild[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: IconLayoutDashboard },
    ],
  },
  {
    label: "Bakery operations",
    items: [
      { title: "Orders & POS", url: "/orders", icon: IconShoppingCart },
      { title: "Products", url: "/products", icon: IconBox },
      { title: "Ingredients", url: "/ingredients", icon: IconPackages },
      { title: "Expenses", url: "/expenses", icon: IconReceipt },
    ],
  },
  {
    label: "Relationships",
    items: [
      { title: "Customers", url: "/customers", icon: IconUsers },
      { title: "Suppliers", url: "/suppliers", icon: IconTruck },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Team", url: "/users", icon: IconUsersGroup, adminOnly: true },
    ],
  },
];

/** Flat list used by the command palette. */
export const allNavItems = navGroups.flatMap((group) => group.items);
