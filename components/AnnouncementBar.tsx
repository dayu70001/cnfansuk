"use client";

import { usePathname } from "next/navigation";

type AnnouncementBarProps = {
  channelUrl: string;
};

export function AnnouncementBar({ channelUrl }: AnnouncementBarProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (!isHomepage) {
    return <div className="announce">New season styles now in</div>;
  }

  return (
    <div className="announce announce-home">
      <span className="announce-description">
        <span className="announce-copy-desktop">Real product videos &amp; daily updates</span>
        <span className="announce-copy-mobile">Daily product videos ·</span>
      </span>
      <a
        className="announce-channel-link"
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join the CNFans WhatsApp Channel"
      >
        <span className="announce-copy-desktop">Join WhatsApp Channel ↗</span>
        <span className="announce-copy-mobile">Join Channel ↗</span>
      </a>
    </div>
  );
}
