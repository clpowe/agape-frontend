/** How a navigation item is rendered. */
export type NavKind = "link" | "phone" | "button";

/** Where a navigation item appears. */
export type NavSurface = "header" | "footer";

export interface NavItem {
  label: string;
  href: string;
  kind: NavKind;
  surfaces: NavSurface[];
}

/** Single source of truth for site navigation. */
export const siteNavigation: NavItem[] = [
  { label: "Home", href: "/", kind: "link", surfaces: ["footer"] },
  { label: "About", href: "/about", kind: "link", surfaces: ["header", "footer"] },
  { label: "Services", href: "/services", kind: "link", surfaces: ["header", "footer"] },
  { label: "Contact", href: "/contact", kind: "link", surfaces: ["header", "footer"] },
  {
    label: "904-234-2853",
    href: "tel:+19042342853",
    kind: "button",
    surfaces: ["header"],
  },
  {
    label: "Apply Now",
    href: "/apply",
    kind: "button",
    surfaces: ["header"],
  },
  { label: "Apply", href: "/apply", kind: "link", surfaces: ["footer"] },
  { label: "Pay Bill", href: "/", kind: "link", surfaces: ["footer"] },
  {
    label: "Team Prayer",
    href: "/contact#teamPrayer",
    kind: "link",
    surfaces: ["footer"],
  },
];

const bySurface = (surface: NavSurface) =>
  siteNavigation.filter((item) => item.surfaces.includes(surface));

/** Header + mobile menu items, in order. */
export const headerNavigation = bySurface("header");

/** Footer "Navigate" column, in order. */
export const footerNavigation = bySurface("footer");

/** Footer "Services" column. */
export const serviceNavigation: NavItem[] = [
  {
    label: "First-Time Takers",
    href: "/services/first-time-takers",
    kind: "link",
    surfaces: ["footer"],
  },
  {
    label: "Repeat Takers",
    href: "/services/repeat-takers",
    kind: "link",
    surfaces: ["footer"],
  },
  {
    label: "MBE Prep",
    href: "/services/multistate-bar-exam",
    kind: "link",
    surfaces: ["footer"],
  },
  {
    label: "Law School Prep",
    href: "/services/law-school-prep",
    kind: "link",
    surfaces: ["footer"],
  },
  {
    label: "Bar Prep Academy",
    href: "/services/bar-prep-academy",
    kind: "link",
    surfaces: ["footer"],
  },
];
