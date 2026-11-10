const newsletterExcludedPrefixes = [
  "/checkout",
  "/order-success",
  "/admin",
  "/homepage-admin",
  "/login",
  "/cart",
  "/payments",
  "/track-order",
  "/size-recommender",
  "/connect",
];

export const BREVO_FORM_ACTION =
  "https://d39bfc46.sibforms.com/serve/MUIFADB_BtESMMVs19bq3VwcBSRubmZ3o2_o6lxRLsAmejpp2VhfLnCMdShHlR7bM7gZlmHOwMtElzWXU53ydqJ9q6YNWaFfESrGOPsNjeihymJaFJKj70XgmNLHV5dxeAgxyD2Wd4XR9BTHjIg1SKoP7Izqx3lJxM4P6JXWCqP7HbYx-bFI8CCzXkrSeCOIl0NSZww7T_JZEhSW1w==";

type BrevoSubscriptionResult = {
  success?: boolean;
};

/**
 * Uses the exact AJAX request shape used by Brevo's official HTML embed script.
 * The action URL is public form configuration, not an API credential.
 */
export async function submitBrevoNewsletter(
  formData: FormData,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const action = new URL(BREVO_FORM_ACTION);
  action.searchParams.set("isAjax", "1");

  const response = await fetcher(action.toString(), {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: { Accept: "application/json" },
    body: formData,
  });
  const result = await response.json().catch(() => null) as BrevoSubscriptionResult | null;

  return response.ok && result?.success === true;
}

export function shouldShowFooterNewsletter(pathname: string | null): boolean {
  if (!pathname) return false;
  return !newsletterExcludedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
