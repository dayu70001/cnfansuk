"use client";

import { useState, useEffect, useRef } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  href: string;
};

export function FilterDropdown({
  label,
  options,
  currentValue,
}: {
  label: string;
  options: DropdownOption[];
  currentValue: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const clearOption = options.find((o) => o.value === "");
  const hasValue = Boolean(currentValue);

  const navigate = (href: string) => {
    setOpen(false);
    window.location.href = href;
  };

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clearOption) {
      navigate(clearOption.href);
    }
  };

  const handleSelect = (
    e: React.MouseEvent<HTMLAnchorElement>,
    option: DropdownOption
  ) => {
    e.preventDefault();
    if (option.value === currentValue) {
      if (clearOption) {
        navigate(clearOption.href);
      } else {
        setOpen(false);
      }
    } else {
      navigate(option.href);
    }
  };

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-toggle${hasValue ? " filter-dropdown-has-value" : ""}`}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="filter-dropdown-label">{label}</span>
        {hasValue && clearOption ? (
          <span
            className="filter-dropdown-clear"
            onClick={handleClear}
            aria-label="Clear filter"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClear(e as unknown as React.MouseEvent);
            }}
          >
            ×
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="filter-dropdown-panel">
          {clearOption ? (
            <a
              href={clearOption.href}
              className={`filter-dropdown-all${!currentValue ? " active" : ""}`}
              onClick={(e) => handleSelect(e, clearOption)}
            >
              {clearOption.label}
            </a>
          ) : null}
          <div className="filter-dropdown-scroll">
            <ul role="listbox">
              {options
                .filter((o) => o.value !== "")
                .map((option) => {
                  const active = option.value === currentValue;
                  return (
                    <li key={option.value} role="option" aria-selected={active}>
                      <a
                        href={option.href}
                        className={active ? "active" : ""}
                        onClick={(e) => handleSelect(e, option)}
                        title={option.label}
                      >
                        {option.label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
