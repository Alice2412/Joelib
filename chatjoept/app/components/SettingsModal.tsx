import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, RotateCcw, Save, Key, Globe, Sparkles } from "lucide-react";
import type { UserSettings } from "~/types/chat";
import { DEFAULT_SETTINGS } from "~/utils/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: Partial<UserSettings>) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
    setSystemPrompt(settings.systemPrompt);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || "https://api.openai.com/v1",
      model: model.trim() || "gpt-4o",
      systemPrompt,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setApiKey("");
    setBaseUrl(DEFAULT_SETTINGS.baseUrl);
    setModel(DEFAULT_SETTINGS.model);
    setSystemPrompt(DEFAULT_SETTINGS.systemPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#212121] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#10a37f]" />
            <h2 className="text-base font-semibold text-white">ChatJoePT Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="api-key-input"
                className="text-xs font-medium text-gray-300 flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-gray-400" />
                OpenAI API Key (or custom endpoint key)
              </label>
              <span className="text-[11px] text-gray-400">Stored locally in your browser</span>
            </div>
            <div className="relative">
              <input
                id="api-key-input"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#2f2f2f] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              If left empty, ChatJoePT uses server environment credentials or its built-in Joe simulator.
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label
              htmlFor="base-url-input"
              className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              API Base URL (OpenAI format)
            </label>
            <input
              id="base-url-input"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-[#2f2f2f] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Compatible with OpenAI, Groq (<code className="text-[#10a37f]">https://api.groq.com/openai/v1</code>), OpenRouter, or local proxies.
            </p>
          </div>

          {/* Model Name */}
          <div>
            <label
              htmlFor="model-input"
              className="block text-xs font-medium text-gray-300 mb-1.5"
            >
              Model Identifier
            </label>
            <input
              id="model-input"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
              className="w-full bg-[#2f2f2f] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
            />
          </div>

          {/* Joeglish System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="system-prompt-input"
                className="text-xs font-medium text-gray-300"
              >
                Joeglish System Instructions
              </label>
              <span className="text-[11px] text-[#10a37f]">Joe Universe Dialect</span>
            </div>
            <textarea
              id="system-prompt-input"
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#2f2f2f] text-gray-200 border border-white/10 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#10a37f] resize-y font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium bg-[#10a37f] hover:bg-[#0e8c6d] text-white rounded-xl shadow transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedNotice ? "Saved!" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
