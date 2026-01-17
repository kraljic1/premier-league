"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// Using simple text chevron instead of icon library

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];

    if (pathname === "/fixtures-results") {
      breadcrumbs.push({ label: "Fixtures & Results", href: "/fixtures-results" });
    } else if (pathname === "/standings") {
      breadcrumbs.push({ label: "Standings", href: "/standings" });
    } else if (pathname === "/compare-fixtures") {
      breadcrumbs.push({ label: "Compare Fixtures", href: "/compare-fixtures" });
    } else if (pathname === "/compare-season") {
      breadcrumbs.push({ label: "Compare Season", href: "/compare-season" });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on home page or if there's only one item
  if (pathname === "/" || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 lg:px-8">
      <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400 dark:text-gray-500" aria-hidden="true">›</span>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}