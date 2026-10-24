type Name = "overview" | "revenue" | "budget" | "scenario" | "decision" | "menu" | "close";

const PATHS: Record<Name, string> = {
  overview: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  revenue: "M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6",
  budget: "M12 3v18M5 8h14M7 16h10",
  scenario: "M3 16c3-8 5 4 8 0s5 6 10-2",
  decision: "M7 3h8l4 4v14H7zM15 3v5h5M9 13h6M9 17h6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
};

export function Icon({ name }: { name: Name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
