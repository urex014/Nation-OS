import Link from "next/link";
import { Icon } from "@/components/shell/icons";

const GROUPS = [
  {
    label: "Position",
    items: [
      { href: "/", label: "National Overview", icon: "overview" },
      { href: "/revenue", label: "Revenue Allocation", icon: "revenue" },
    ],
  },
  {
    label: "Simulation",
    items: [
      { href: "/budget", label: "Budget Planner", icon: "budget" },
      { href: "/scenarios", label: "Scenario Lab", icon: "scenario" },
    ],
  },
  {
    label: "Record",
    items: [{ href: "/decisions", label: "Decision Records", icon: "decision" }],
  },
] as const;

export function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: (href: string) => void;
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="nav-group">{group.label}</p>
          <ul className="nav-list">
            {group.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    className="nav-link"
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={(event) => {
                      if (!onNavigate) return;
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      onNavigate(item.href);
                    }}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
