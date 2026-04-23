import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  href?: string;
  onClick?: () => void;
  isDanger?: boolean;
  isExternal?: boolean;
}

export function SettingsItem({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  isDanger,
  isExternal,
}: Props) {
  const content = (
    <div
      className={`flex items-center justify-between p-4 bg-card border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group ${isDanger ? "text-red-500" : "text-foreground"}`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 ${isDanger ? "text-red-500" : "text-muted-foreground"}`}
        />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {value && <span className="text-xs font-medium">{value}</span>}
        {href || onClick ? (
          <ChevronRight
            className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform ${isDanger ? "text-red-500" : "text-muted-foreground/50"}`}
          />
        ) : null}
      </div>
    </div>
  );

  if (href) {
    if (isExternal)
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="block w-full"
        >
          {content}
        </a>
      );
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}
