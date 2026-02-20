"use client";

import { useEffect } from "react";

export default function DropdownCloser() {
  useEffect(() => {
    function closeAll(except?: Element | null) {
      document.querySelectorAll("details[open]").forEach((d) => {
        if (except && d === except) return;
        d.removeAttribute("open");
      });
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Click en link dentro del dropdown => cerrar el details padre
      const link = target.closest("a");
      if (link) {
        const parentDetail = link.closest("details[open]");
        if (parentDetail) parentDetail.removeAttribute("open");
        return;
      }

      // Click dentro de un <details> => cerrar los demás
      const insideDetail = target.closest("details");
      if (insideDetail) {
        closeAll(insideDetail);
        return;
      }

      // Click fuera => cerrar todos
      closeAll();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
