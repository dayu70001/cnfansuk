"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type FormEvent, type InvalidEvent } from "react";
import { BREVO_FORM_ACTION, shouldShowFooterNewsletter, submitBrevoNewsletter } from "@/lib/footerNewsletter";

type NewsletterRemoteFeedback = {
  kind: "success" | "error";
  message: string;
};

export function FooterNewsletter() {
  const pathname = usePathname();
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [remoteFeedback, setRemoteFeedback] = useState<NewsletterRemoteFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlightRef = useRef(false);
  const visible = shouldShowFooterNewsletter(pathname);

  function handleInvalid(event: InvalidEvent<HTMLFormElement>) {
    setRemoteFeedback(null);
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name === "EMAIL") {
      setLocalFeedback("Please enter a valid email address.");
    } else if (target.name === "OPT_IN") {
      setLocalFeedback("Please tick the box to agree to occasional marketing emails.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRemoteFeedback(null);
    setLocalFeedback(null);
    if (submissionInFlightRef.current) return;

    submissionInFlightRef.current = true;
    setIsSubmitting(true);

    const form = event.currentTarget;
    try {
      const accepted = await submitBrevoNewsletter(new FormData(form));
      if (!accepted) {
        setRemoteFeedback({ kind: "error", message: "We couldn't subscribe just now. Please try again." });
        return;
      }

      form.reset();
      setRemoteFeedback({ kind: "success", message: "Subscribed successfully!" });
    } catch {
      setRemoteFeedback({ kind: "error", message: "We couldn't reach the subscription service. Please try again." });
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="footer-newsletter"
      aria-labelledby="footer-newsletter-title"
      hidden={!visible}
    >
      <div className="footer-newsletter-copy">
        <h2 id="footer-newsletter-title">Get the Latest from CNFans</h2>
        <p>New arrivals, real product videos and occasional updates. No daily emails.</p>
      </div>

      <div className="footer-newsletter-form">
        <div className="sib-form">
          <div id="sib-form-container" className="sib-form-container">
            <div id="sib-container" className="sib-container--large sib-container--vertical">
              <form
                id="sib-form"
                className="footer-newsletter-form-element"
                action={BREVO_FORM_ACTION}
                method="POST"
                data-type="subscription"
                onSubmit={handleSubmit}
                onInvalid={handleInvalid}
              >
                <div className="footer-newsletter-fields">
                  <div className="sib-input sib-form-block footer-newsletter-email-entry">
                    <div className="form__entry entry_block">
                      <div className="form__label-row">
                        <label className="entry__label footer-newsletter-sr-only" htmlFor="EMAIL" data-required="*">
                          Email address
                        </label>
                        <div className="entry__field">
                          <input
                            className="input footer-newsletter-email"
                            id="EMAIL"
                            name="EMAIL"
                            type="email"
                            placeholder="Email address"
                            autoComplete="email"
                            defaultValue=""
                            data-required="true"
                            required
                            aria-describedby="footer-newsletter-consent-copy footer-newsletter-local-feedback"
                            onChange={() => {
                              setLocalFeedback(null);
                              setRemoteFeedback(null);
                            }}
                          />
                        </div>
                      </div>
                      <label className="entry__error entry__error--primary footer-newsletter-field-error" htmlFor="EMAIL" role="alert" />
                    </div>
                  </div>

                  <div className="sib-form-block footer-newsletter-submit-block">
                    <button
                      className="footer-newsletter-submit sib-form-block__button sib-form-block__button-with-loader"
                      type="submit"
                      id="sib-form-submit-button"
                      form="sib-form"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      <svg className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
                        <path d="M460.1 373.8 439.3 361.8c-5.5-3.2-7.5-10.2-4.7-15.9 30.2-59.9 28.3-131.7-5.4-189.9-33.6-58.4-94.9-95.8-161.8-99.7C261 55.8 256 50.7 256 44.4V20.3c0-6.9 5.8-12.3 12.7-12 83.6 4.3 160.2 50.9 202.1 123.7 42.1 72.7 44.1 162.3 6 236.8-3.1 6.2-10.7 8.5-16.7 5z" />
                      </svg>
                      Subscribe
                    </button>
                  </div>
                </div>

                <div className="sib-optin sib-form-block" data-required="true">
                  <div className="form__entry entry_mcq">
                    <div className="form__label-row">
                      <div className="entry__choice">
                        <label className="footer-newsletter-consent-row" htmlFor="OPT_IN">
                          <input
                            className="footer-newsletter-consent input_replaced"
                            id="OPT_IN"
                            name="OPT_IN"
                            type="checkbox"
                            value="1"
                            required
                            aria-describedby="footer-newsletter-consent-copy footer-newsletter-local-feedback"
                            onChange={() => {
                              setLocalFeedback(null);
                              setRemoteFeedback(null);
                            }}
                          />
                          <span id="footer-newsletter-consent-copy">
                            <p>I&apos;d like to receive occasional marketing emails from CNFans.</p>
                            <span className="entry__label entry__label_optin" data-required="*" aria-hidden="true" />
                          </span>
                        </label>
                      </div>
                      <label className="entry__error entry__error--primary footer-newsletter-field-error" htmlFor="OPT_IN" role="alert" />
                    </div>
                  </div>
                </div>

                <input
                  className="footer-newsletter-honeypot input--hidden"
                  type="text"
                  name="email_address_check"
                  value=""
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                />
                <input type="hidden" name="locale" value="en" />
              </form>
            </div>
          </div>
        </div>

        {localFeedback ? (
          <p className="footer-newsletter-feedback is-error" id="footer-newsletter-local-feedback" role="alert" aria-live="assertive">
            {localFeedback}
          </p>
        ) : null}

        {remoteFeedback ? (
          <p
            className={`footer-newsletter-feedback ${remoteFeedback.kind === "success" ? "is-success" : "is-error"}`}
            id="footer-newsletter-brevo-feedback"
            role={remoteFeedback.kind === "success" ? "status" : "alert"}
            aria-live={remoteFeedback.kind === "success" ? "polite" : "assertive"}
          >
            {remoteFeedback.message}
          </p>
        ) : null}

        <p className="footer-newsletter-privacy">
          <span>Unsubscribe anytime.</span>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </p>
      </div>
    </section>
  );
}
