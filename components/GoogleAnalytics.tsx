'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __cnfansGa4Configured?: boolean;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !ready || typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
    });
  }, [pathname, searchParams, ready]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID && !GTM_CONTAINER_ID) return;

    function trackOutboundClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      const host = url.hostname.replace(/^www\./, '');
      let eventName: string | undefined;

      if (host === 'wa.me' || host === 'whatsapp.com' || host === 'api.whatsapp.com') eventName = 'whatsapp_click';
      else if (host === 't.me' || host === 'telegram.me') eventName = 'telegram_click';
      else if (host === 'instagram.com') eventName = 'instagram_click';
      else if (host === 'facebook.com' || host === 'fb.com') eventName = 'facebook_click';
      else if (url.origin === window.location.origin && url.pathname === '/contact') eventName = 'contact_click';

      if (!eventName) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, link_url: url.href });
    }

    document.addEventListener('click', trackOutboundClick, { capture: true });
    return () => document.removeEventListener('click', trackOutboundClick, { capture: true });
  }, []);

  if (process.env.NODE_ENV !== 'production' || (!GA_MEASUREMENT_ID && !GTM_CONTAINER_ID)) return null;

  return (
    <>
      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            onReady={() => setReady(true)}
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            if (!window.gtag) {
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
            }
            if (!window.__cnfansGa4Configured) {
              window.gtag('js', new Date());
              window.gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              window.__cnfansGa4Configured = true;
            }
          `,
            }}
          />
        </>
      ) : null}
      {GTM_CONTAINER_ID ? (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
