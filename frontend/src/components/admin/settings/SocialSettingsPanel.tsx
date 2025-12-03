"use client";

import { Globe } from "lucide-react";
import type { SocialSettings } from "./types";
import { SaveButton, InputField } from "./shared";

interface SocialSettingsPanelProps {
  settings: SocialSettings;
  onChange: (settings: SocialSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SocialSettingsPanel({ settings, onChange, onSave, isSaving }: SocialSettingsPanelProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Globe className="h-5 w-5 text-pink-600" />
        <h2 className="text-lg font-semibold text-gray-900">Media Sosial</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Instagram" value={settings.social_instagram || ""} onChange={(v) => onChange({ ...settings, social_instagram: v })} placeholder="https://instagram.com/juicequ" />
        <InputField label="Facebook" value={settings.social_facebook || ""} onChange={(v) => onChange({ ...settings, social_facebook: v })} placeholder="https://facebook.com/juicequ" />
        <InputField label="Twitter/X" value={settings.social_twitter || ""} onChange={(v) => onChange({ ...settings, social_twitter: v })} placeholder="https://twitter.com/juicequ" />
        <InputField label="WhatsApp" value={settings.social_whatsapp || ""} onChange={(v) => onChange({ ...settings, social_whatsapp: v })} placeholder="+6281234567890" />
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Media Sosial" />
      </div>
    </div>
  );
}
