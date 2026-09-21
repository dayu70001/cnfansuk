"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export type CategoryFilterDrawerId = "category" | "brand" | "price";

export type CategoryFilterDrawerOption = {
  label: string;
  href: string;
  value?: string;
  selected?: boolean;
  group?: string;
  children?: CategoryFilterDrawerOption[];
};

export type CategoryFilterDrawerGroup = {
  id: CategoryFilterDrawerId;
  label: string;
  title: string;
  options: CategoryFilterDrawerOption[];
  multiple?: boolean;
  clearHref?: string;
};

function findSelectedOptions(options: CategoryFilterDrawerOption[]): CategoryFilterDrawerOption[] {
  const selected: CategoryFilterDrawerOption[] = [];
  for (const option of options) {
    if (option.selected) selected.push(option);
    if (option.children?.length) selected.push(...findSelectedOptions(option.children));
  }
  return selected;
}

function getInitialSelections(groups: CategoryFilterDrawerGroup[]) {
  return groups.reduce<Record<CategoryFilterDrawerId, CategoryFilterDrawerOption[]>>((result, group) => {
    const selected = findSelectedOptions(group.options);
    if (selected.length) {
      result[group.id] = group.multiple ? selected : [selected[0]];
    } else if (group.options[0]) {
      result[group.id] = [group.options[0]];
    } else {
      result[group.id] = [];
    }
    return result;
  }, {} as Record<CategoryFilterDrawerId, CategoryFilterDrawerOption[]>);
}

export function CategoryFilterDrawer({ groups, clearAllHref }: { groups: CategoryFilterDrawerGroup[]; clearAllHref?: string }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<CategoryFilterDrawerId | null>(null);
  const [categoryLevel, setCategoryLevel] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [draftSelections, setDraftSelections] = useState<Record<CategoryFilterDrawerId, CategoryFilterDrawerOption[]>>(() => getInitialSelections(groups));
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeGroup = groups.find((group) => group.id === activeId) || null;
  const activeDraft = activeId ? draftSelections[activeId] || [] : [];

  useEffect(() => setMounted(true), []);

  const closeDrawer = useCallback((resetDraft = true) => {
    const previousId = activeId;
    if (resetDraft) setDraftSelections(getInitialSelections(groups));
    setActiveId(null);
    setCategoryLevel(null);
    setBrandSearch("");
    requestAnimationFrame(() => {
      if (previousId) triggerRefs.current[previousId]?.focus();
    });
  }, [activeId, groups]);

  const openDrawer = useCallback((id: CategoryFilterDrawerId) => {
    setDraftSelections(getInitialSelections(groups));
    setCategoryLevel(null);
    setBrandSearch("");
    setActiveId(id);
  }, [groups]);

  useEffect(() => {
    document.documentElement.classList.toggle("desktop-filter-drawer-open", Boolean(activeId));
    return () => document.documentElement.classList.remove("desktop-filter-drawer-open");
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer(true);
    };
    const handleResize = () => {
      if (window.innerWidth <= 860) closeDrawer(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeId, closeDrawer]);

  const selectOption = useCallback((option: CategoryFilterDrawerOption) => {
    if (!activeId) return;
    if (activeId === "category" && option.children?.length) {
      setCategoryLevel(option.label);
      return;
    }
    const group = groups.find((item) => item.id === activeId);
    if (!group?.multiple) {
      setDraftSelections((current) => ({ ...current, [activeId]: [option] }));
      return;
    }

    setDraftSelections((current) => {
      const currentOptions = current[activeId] || [];
      const isClear = option.value === "";
      if (isClear) return { ...current, [activeId]: [option] };

      const clearOption = group.options.find((item) => item.value === "");
      const withoutClear = currentOptions.filter((item) => item.value);
      const alreadySelected = withoutClear.some((item) => (item.value || item.href) === (option.value || option.href));
      const next = alreadySelected
        ? withoutClear.filter((item) => (item.value || item.href) !== (option.value || option.href))
        : [...withoutClear, option];
      return { ...current, [activeId]: next.length ? next : clearOption ? [clearOption] : [] };
    });
  }, [activeId, groups]);

  const applyDraft = useCallback(() => {
    if (!activeId) return;
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    let pathname = currentUrl.pathname;

    for (const id of ["category", "brand", "price"] as const) {
      const options = draftSelections[id] || [];
      const option = options[0];
      if (!option) continue;
      const group = groups.find((item) => item.id === id);

      if (id === "category") {
        if (group?.multiple && options.filter((item) => item.value).length > 1) {
          const currentPath = currentUrl.pathname.split("/").filter(Boolean);
          pathname = currentPath.length >= 2 ? `/${currentPath.slice(0, 2).join("/")}` : currentUrl.pathname;
          params.delete("category");
          params.delete("subcategory");
          params.set("subcategory", options.filter((item) => item.value).map((item) => item.value).join(","));
        } else {
          const optionUrl = new URL(option.href, window.location.origin);
          pathname = optionUrl.pathname;
          params.delete("category");
          params.delete("subcategory");
          for (const key of ["category", "subcategory"]) {
            const value = optionUrl.searchParams.get(key);
            if (value) params.set(key, value);
          }
        }
      } else {
        const values = options
          .map((item) => item.value || new URL(item.href, window.location.origin).searchParams.get(id))
          .filter((value): value is string => Boolean(value));
        params.delete(id);
        if (values.length) params.set(id, values.join(","));
      }
    }

    params.delete("page");
    const query = params.toString();
    const nextHref = query ? `${pathname}?${query}` : pathname;
    closeDrawer(false);
    router.push(nextHref);
  }, [activeId, closeDrawer, draftSelections, router]);

  const categoryParent = activeId === "category" && categoryLevel
    ? activeGroup?.options.find((option) => option.label === categoryLevel && option.children?.length)
    : null;
  const visibleOptions = categoryParent?.children || activeGroup?.options || [];
  const filteredOptions = activeId === "brand"
    ? visibleOptions.filter((option, index) => index === 0 || option.label.toLowerCase().includes(brandSearch.trim().toLowerCase()))
    : visibleOptions;

  const mobileControls = (
    <div className="category-mobile-filter-bar" aria-label="Category filters">
      {groups.map((group) => (
        <div className={`category-mobile-filter-control${group.clearHref ? " has-clear" : ""}`} key={group.id}>
          <button
            ref={(element) => {
              triggerRefs.current[group.id] = element;
            }}
            type="button"
            className="category-mobile-filter-button"
            aria-controls="desktop-filter-drawer"
            aria-expanded={activeId === group.id}
            aria-haspopup="dialog"
            onClick={() => openDrawer(group.id)}
          >
            <span>{group.label}</span>
          </button>
          {group.clearHref ? (
            <button
              type="button"
              className="category-mobile-filter-clear"
              aria-label={`Clear ${group.title} filter`}
              onClick={() => router.push(group.clearHref as string)}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );

  const drawer = (
    <>
      <div
        className={`desktop-filter-backdrop${activeGroup ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => closeDrawer(true)}
      />
      <aside
        id="desktop-filter-drawer"
        className={`desktop-filter-drawer${activeGroup ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={categoryParent?.label || activeGroup?.title || "Filters"}
        aria-hidden={!activeGroup}
      >
        <div className="desktop-filter-drawer-head">
          <span>{categoryParent?.label || activeGroup?.title || "Filters"}</span>
          <button
            ref={closeRef}
            type="button"
            className="desktop-filter-drawer-close"
            onClick={() => closeDrawer(true)}
            aria-label="Close filter drawer"
          >
            ×
          </button>
        </div>
        <div className="desktop-filter-drawer-options" aria-label={activeGroup?.title || "Filters"}>
          {activeId === "category" && categoryParent ? (
            <button type="button" className="desktop-filter-drawer-back" onClick={() => setCategoryLevel(null)}>
              ← Back
            </button>
          ) : null}
          {activeId === "brand" ? (
            <input
              className="desktop-filter-drawer-brand-search"
              type="search"
              value={brandSearch}
              onChange={(event) => setBrandSearch(event.target.value)}
              placeholder="Search brands..."
              aria-label="Search brands"
            />
          ) : null}
          {filteredOptions.map((option, index) => {
            const previous = filteredOptions[index - 1];
            const showGroup = option.group && option.group !== previous?.group;
            const isSelected = activeDraft.some((item) => item.href === option.href);
            const hasChildren = Boolean(option.children?.length);
            const isMultiple = Boolean(activeGroup?.multiple && !hasChildren);
            return (
              <div key={`${option.group || "all"}-${option.label}`}>
                {showGroup ? <p className="desktop-filter-drawer-group-label">{option.group}</p> : null}
                <button
                  type="button"
                  className={`desktop-filter-drawer-option${isSelected ? " selected" : ""}${hasChildren ? " has-children" : ""}${isMultiple ? " multiple" : ""}`}
                  role={hasChildren ? undefined : isMultiple ? "checkbox" : "radio"}
                  aria-checked={hasChildren ? undefined : isSelected}
                  aria-haspopup={hasChildren ? "true" : undefined}
                  onClick={() => selectOption(option)}
                >
                  <span>{option.label}</span>
                  {hasChildren ? <span className="desktop-filter-drawer-chevron" aria-hidden="true">›</span> : <span className="desktop-filter-drawer-indicator" aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="desktop-filter-drawer-actions">
          <button type="button" className="desktop-filter-drawer-cancel" onClick={() => closeDrawer(true)}>CANCEL</button>
          <button type="button" className="desktop-filter-drawer-apply" onClick={applyDraft}>APPLY</button>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <div className="category-desktop-filter-bar" aria-label="Category filters">
        {groups.map((group) => (
          <div className={`category-desktop-filter-control${group.clearHref ? " has-clear" : ""}`} key={group.id}>
            <button
              ref={(element) => {
                triggerRefs.current[group.id] = element;
              }}
              type="button"
              className="category-desktop-filter-button"
              aria-controls="desktop-filter-drawer"
              aria-expanded={activeId === group.id}
              onClick={() => openDrawer(group.id)}
            >
              {group.label}
            </button>
            {group.clearHref ? (
              <button
                type="button"
                className="category-desktop-filter-clear"
                aria-label={`Clear ${group.title} filter`}
                onClick={() => router.push(group.clearHref as string)}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        {groups.some((group) => group.clearHref) ? (
          <button
            type="button"
            className="category-desktop-filter-clear-all"
            onClick={() => {
              if (clearAllHref) {
                router.push(clearAllHref);
                return;
              }
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.delete("category");
              currentUrl.searchParams.delete("subcategory");
              currentUrl.searchParams.delete("brand");
              currentUrl.searchParams.delete("price");
              currentUrl.searchParams.delete("page");
              router.push(`${currentUrl.pathname}${currentUrl.search ? `?${currentUrl.searchParams.toString()}` : ""}`);
            }}
          >
            Clear all
          </button>
        ) : null}
      </div>
      {mobileControls}
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
