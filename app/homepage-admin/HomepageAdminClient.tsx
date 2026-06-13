"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/siteSettings";

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const positionPlaceholder = "center center / 70% center / center bottom";

export function HomepageAdminClient({
  defaults,
  initialSettings,
}: {
  defaults: SiteSettings;
  initialSettings: SiteSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState("Ready");

  async function saveSettings(nextSettings = settings) {
    setStatus("Saving...");
    const response = await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    });

    if (!response.ok) {
      setStatus("Could not save settings.");
      return;
    }

    setSettings(await response.json());
    setStatus("Saved. Refresh the homepage preview to see changes.");
  }

  function updateLink(key: keyof SiteSettings["links"], value: string) {
    setSettings((current) => ({
      ...current,
      links: { ...current.links, [key]: value },
    }));
  }

  function updateHomepage(key: keyof SiteSettings["homepage"], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: { ...current.homepage, [key]: value },
    }));
  }

  function updateCategory(index: number, key: keyof SiteSettings["homepage"]["categories"][number], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        categories: current.homepage.categories.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  }

  function updateApparelEdit(key: keyof SiteSettings["homepage"]["apparelEdit"], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        apparelEdit: { ...current.homepage.apparelEdit, [key]: value },
      },
    }));
  }

  function updateDrop(index: number, key: keyof SiteSettings["homepage"]["latestDrops"][number], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        latestDrops: current.homepage.latestDrops.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  }

  return (
    <main className="homepage-admin">
      <header className="homepage-admin-head">
        <div>
          <p className="eyebrow">Local settings</p>
          <h1>CNFans UK Homepage Admin</h1>
          <p>Local preview settings only. This does not publish or deploy anything.</p>
        </div>
        <div className="homepage-admin-actions">
          <button className="btn btn-solid" type="button" onClick={() => saveSettings()}>
            Save settings
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSettings(defaults);
              saveSettings(defaults);
            }}
          >
            Reset to defaults
          </button>
          <a className="link-arrow" href="/" target="_blank" rel="noreferrer">
            Open homepage preview <span>→</span>
          </a>
          <span className="admin-status">{status}</span>
        </div>
      </header>

      <AdminSection title="Links">
        <div className="admin-form-grid">
          <Field label="WhatsApp Channel / Group URL" value={settings.links.whatsappChannelUrl} onChange={(value) => updateLink("whatsappChannelUrl", value)} />
          <Field label="Telegram Channel / Group URL" value={settings.links.telegramChannelUrl} onChange={(value) => updateLink("telegramChannelUrl", value)} />
          <Field label="Instagram URL" value={settings.links.instagramUrl} onChange={(value) => updateLink("instagramUrl", value)} />
          <Field label="Facebook URL" value={settings.links.facebookUrl} onChange={(value) => updateLink("facebookUrl", value)} />
          <Field label="Personal WhatsApp URL" value={settings.links.personalWhatsappUrl} onChange={(value) => updateLink("personalWhatsappUrl", value)} />
          <Field label="Personal WhatsApp Number" value={settings.links.personalWhatsappNumber} onChange={(value) => updateLink("personalWhatsappNumber", value)} />
          <Field label="Personal Telegram URL" value={settings.links.personalTelegramUrl} onChange={(value) => updateLink("personalTelegramUrl", value)} />
          <Field label="Personal Telegram Username" value={settings.links.personalTelegramUsername} onChange={(value) => updateLink("personalTelegramUsername", value)} />
        </div>
      </AdminSection>

      <AdminSection title="Hero">
        <div className="admin-form-grid">
          <Field label="Hero main image URL" value={settings.homepage.heroMainImageUrl} onChange={(value) => updateHomepage("heroMainImageUrl", value)} />
          <FitField label="Image fit" value={settings.homepage.heroMainImageFit} onChange={(value) => updateHomepage("heroMainImageFit", value)} />
          <Field
            label="Image position"
            value={settings.homepage.heroMainImagePosition}
            placeholder={positionPlaceholder}
            onChange={(value) => updateHomepage("heroMainImagePosition", value)}
          />
        </div>
      </AdminSection>

      <AdminSection title="Shop by Category">
        <div className="admin-repeat-grid">
          {settings.homepage.categories.map((category, index) => (
            <article className="admin-edit-card" key={category.key}>
              <h3>{category.title || category.key}</h3>
              <Field label="Title" value={category.title} onChange={(value) => updateCategory(index, "title", value)} />
              <Field label="Subtitle" value={category.subtitle} onChange={(value) => updateCategory(index, "subtitle", value)} />
              <Field label="Image URL" value={category.imageUrl} onChange={(value) => updateCategory(index, "imageUrl", value)} />
              <FitField label="Image fit" value={category.imageFit} onChange={(value) => updateCategory(index, "imageFit", value)} />
              <Field
                label="Image position"
                value={category.imagePosition}
                placeholder={positionPlaceholder}
                onChange={(value) => updateCategory(index, "imagePosition", value)}
              />
              <Field label="Href" value={category.href} onChange={(value) => updateCategory(index, "href", value)} />
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Clean layers / Apparel Edit">
        <div className="admin-form-grid">
          <Field label="Title" value={settings.homepage.apparelEdit.title} onChange={(value) => updateApparelEdit("title", value)} />
          <Field label="Subtitle" value={settings.homepage.apparelEdit.subtitle} onChange={(value) => updateApparelEdit("subtitle", value)} />
          <Field label="Left image URL" value={settings.homepage.apparelEdit.imageUrl} onChange={(value) => updateApparelEdit("imageUrl", value)} />
          <FitField label="Image fit" value={settings.homepage.apparelEdit.imageFit} onChange={(value) => updateApparelEdit("imageFit", value)} />
          <Field
            label="Image position"
            value={settings.homepage.apparelEdit.imagePosition}
            placeholder={positionPlaceholder}
            onChange={(value) => updateApparelEdit("imagePosition", value)}
          />
          <Field label="Button text" value={settings.homepage.apparelEdit.buttonText} onChange={(value) => updateApparelEdit("buttonText", value)} />
          <Field label="Button href" value={settings.homepage.apparelEdit.buttonHref} onChange={(value) => updateApparelEdit("buttonHref", value)} />
        </div>
      </AdminSection>

      <AdminSection title="Latest fits & drops">
        <div className="admin-repeat-grid">
          {settings.homepage.latestDrops.map((drop, index) => (
            <article className="admin-edit-card" key={index}>
              <h3>Slot {index + 1}</h3>
              <Field label="Image URL" value={drop.imageUrl} onChange={(value) => updateDrop(index, "imageUrl", value)} />
              <FitField label="Image fit" value={drop.imageFit} onChange={(value) => updateDrop(index, "imageFit", value)} />
              <Field
                label="Image position"
                value={drop.imagePosition}
                placeholder={positionPlaceholder}
                onChange={(value) => updateDrop(index, "imagePosition", value)}
              />
              <Field label="Href" value={drop.href} onChange={(value) => updateDrop(index, "href", value)} />
              <Field label="Label" value={drop.label || ""} onChange={(value) => updateDrop(index, "label", value)} />
            </article>
          ))}
        </div>
      </AdminSection>
    </main>
  );
}

function AdminSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="homepage-admin-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, onChange, placeholder, value }: FieldProps) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FitField({ label, onChange, value }: FieldProps) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="cover">cover</option>
        <option value="contain">contain</option>
      </select>
      <small>cover fills the frame; contain shows the full image.</small>
    </label>
  );
}
