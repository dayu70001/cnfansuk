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
  const [status, setStatus] = useState("就绪");

  async function saveSettings(nextSettings = settings) {
    setStatus("正在保存…");
    const response = await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    });

    if (!response.ok) {
      setStatus("设置保存失败。");
      return;
    }

    setSettings(await response.json());
    setStatus("已保存，请刷新首页预览查看效果。");
  }

  function updateLink(key: keyof SiteSettings["links"], value: string) {
    setSettings((current) => ({
      ...current,
      links: { ...current.links, [key]: value },
    }));
  }

  function updateHomeHeroImage(key: keyof SiteSettings["homepage"]["homeHeroImage"], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        homeHeroImage: { ...current.homepage.homeHeroImage, [key]: value },
      },
    }));
  }

  function updateCategoryImage(index: number, key: keyof SiteSettings["homepage"]["categoryImages"][number], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        categoryImages: current.homepage.categoryImages.map((item, itemIndex) =>
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

  function updateHomeEditImage(key: keyof SiteSettings["homepage"]["homeEditImage"], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        homeEditImage: { ...current.homepage.homeEditImage, [key]: value },
      },
    }));
  }

  function updateChannelImage(index: number, key: keyof SiteSettings["homepage"]["homeChannelImages"][number], value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        homeChannelImages: current.homepage.homeChannelImages.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  }

  return (
    <main className="homepage-admin">
      <header className="homepage-admin-head">
        <div>
          <p className="eyebrow">管理后台</p>
          <h1>CNFans UK 首页设置</h1>
          <p>编辑首页链接、图片与文案。</p>
        </div>
        <div className="homepage-admin-actions">
          <button className="btn btn-solid" type="button" onClick={() => saveSettings()}>
            保存设置
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSettings(defaults);
              saveSettings(defaults);
            }}
          >
            恢复默认设置
          </button>
          <a className="link-arrow" href="/" target="_blank" rel="noreferrer">
            打开首页预览 <span>→</span>
          </a>
          <span className="admin-status">{status}</span>
        </div>
      </header>

      <AdminSection title="链接设置">
        <div className="admin-form-grid">
          <Field label="WhatsApp 频道 / 群组链接" value={settings.links.whatsappChannelUrl} onChange={(value) => updateLink("whatsappChannelUrl", value)} />
          <Field label="Telegram 频道 / 群组链接" value={settings.links.telegramChannelUrl} onChange={(value) => updateLink("telegramChannelUrl", value)} />
          <Field label="Instagram 链接" value={settings.links.instagramUrl} onChange={(value) => updateLink("instagramUrl", value)} />
          <Field label="Facebook 链接" value={settings.links.facebookUrl} onChange={(value) => updateLink("facebookUrl", value)} />
          <Field label="个人 WhatsApp 链接" value={settings.links.personalWhatsappUrl} onChange={(value) => updateLink("personalWhatsappUrl", value)} />
          <Field label="个人 WhatsApp 号码" value={settings.links.personalWhatsappNumber} onChange={(value) => updateLink("personalWhatsappNumber", value)} />
          <Field label="个人 Telegram 链接" value={settings.links.personalTelegramUrl} onChange={(value) => updateLink("personalTelegramUrl", value)} />
          <Field label="个人 Telegram 用户名" value={settings.links.personalTelegramUsername} onChange={(value) => updateLink("personalTelegramUsername", value)} />
        </div>
      </AdminSection>

      <AdminSection title="首页主视觉">
        <div className="admin-form-grid">
          <Field label="主图链接" value={settings.homepage.homeHeroImage.imageUrl} onChange={(value) => updateHomeHeroImage("imageUrl", value)} />
          <FitField label="图片适应方式" value={settings.homepage.homeHeroImage.imageFit} onChange={(value) => updateHomeHeroImage("imageFit", value)} />
          <Field
            label="图片位置"
            value={settings.homepage.homeHeroImage.imagePosition}
            placeholder={positionPlaceholder}
            onChange={(value) => updateHomeHeroImage("imagePosition", value)}
          />
        </div>
      </AdminSection>

      <AdminSection title="按分类购物">
        <div className="admin-repeat-grid">
          {settings.homepage.categoryImages.map((category, index) => (
            <article className="admin-edit-card" key={index}>
              <h3>{category.label || `分类 ${index + 1}`}</h3>
              <Field label="图片链接" value={category.imageUrl} onChange={(value) => updateCategoryImage(index, "imageUrl", value)} />
              <FitField label="图片适应方式" value={category.imageFit} onChange={(value) => updateCategoryImage(index, "imageFit", value)} />
              <Field
                label="图片位置"
                value={category.imagePosition}
                placeholder={positionPlaceholder}
                onChange={(value) => updateCategoryImage(index, "imagePosition", value)}
              />
              <Field label="显示名称" value={category.label || ""} onChange={(value) => updateCategoryImage(index, "label", value)} />
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="服装精选区域">
        <div className="admin-form-grid">
          <Field label="标题" value={settings.homepage.apparelEdit.title} onChange={(value) => updateApparelEdit("title", value)} />
          <Field label="副标题" value={settings.homepage.apparelEdit.subtitle} onChange={(value) => updateApparelEdit("subtitle", value)} />
          <Field label="左侧图片链接" value={settings.homepage.homeEditImage.imageUrl} onChange={(value) => updateHomeEditImage("imageUrl", value)} />
          <FitField label="图片适应方式" value={settings.homepage.homeEditImage.imageFit} onChange={(value) => updateHomeEditImage("imageFit", value)} />
          <Field
            label="图片位置"
            value={settings.homepage.homeEditImage.imagePosition}
            placeholder={positionPlaceholder}
            onChange={(value) => updateHomeEditImage("imagePosition", value)}
          />
          <Field label="按钮文字" value={settings.homepage.apparelEdit.buttonText} onChange={(value) => updateApparelEdit("buttonText", value)} />
          <Field label="按钮链接" value={settings.homepage.apparelEdit.buttonHref} onChange={(value) => updateApparelEdit("buttonHref", value)} />
        </div>
      </AdminSection>

      <AdminSection title="最新穿搭与上新">
        <div className="admin-repeat-grid">
          {settings.homepage.homeChannelImages.map((drop, index) => (
            <article className="admin-edit-card" key={index}>
              <h3>位置 {index + 1}</h3>
              <Field label="图片链接" value={drop.imageUrl} onChange={(value) => updateChannelImage(index, "imageUrl", value)} />
              <FitField label="图片适应方式" value={drop.imageFit} onChange={(value) => updateChannelImage(index, "imageFit", value)} />
              <Field
                label="图片位置"
                value={drop.imagePosition}
                placeholder={positionPlaceholder}
                onChange={(value) => updateChannelImage(index, "imagePosition", value)}
              />
              <Field label="显示名称" value={drop.label || ""} onChange={(value) => updateChannelImage(index, "label", value)} />
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
        <option value="cover">铺满画面</option>
        <option value="contain">显示完整图片</option>
      </select>
      <small>cover 会铺满画面；contain 会显示完整图片。</small>
    </label>
  );
}
