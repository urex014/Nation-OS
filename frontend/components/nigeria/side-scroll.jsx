"use client";

import { useEffect, useRef, useState } from "react";

/** Wide tables stay in the page. A hint appears only when columns do not fit. */
export function SideScroll({ children }) {
  const ref = useRef(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setHint(node.scrollWidth > node.clientWidth + 1);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-w-0 max-w-full">
      {hint ? (
        <p className="mb-2 text-sm text-stone-500">Swipe sideways to see every column.</p>
      ) : null}
      <div ref={ref} className="max-w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
