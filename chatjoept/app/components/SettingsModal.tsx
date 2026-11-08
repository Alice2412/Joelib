import React, { useState } from "react";
import {
  X,
  Sparkles,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  Check,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onClearChats: () => void;
  onLogout: () => void;
  theme?: "dark" | "light" | "system";
  onThemeChange?: (theme: "dark" | "light" | "system") => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  onClearChats,
  onLogout,
  theme = "dark",
  onThemeChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "account" | "about">("general");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  if (!isOpen) return null;

  const handleClear = () => {
    onClearChats();
    setShowClearConfirm(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#212121] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#10a37f]" />
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-[#10a37f] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === "account"
                ? "border-[#10a37f] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Account & Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === "about"
                ? "border-[#10a37f] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            About
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "light", label: "Light", icon: Sun },
                    { id: "system", label: "System", icon: Laptop },
                  ].map((t) => {
                    const isSelected = theme === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onThemeChange && onThemeChange(t.id as any)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[#2f2f2f] border-[#10a37f] text-white"
                            : "bg-[#1e1e1e] border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Info */}
              <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-200">Spoken Dialect</span>
                  <span className="text-xs text-[#10a37f] font-semibold">Joeglish (Sacred)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  ChatJoePT natively communicates with the authentic grammar and lore of the Joe Universe.
                </p>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-4">
              {/* Account Card */}
              <div className="p-4 rounded-xl bg-[#1c1c1c] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Authenticated Email</span>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-white font-mono break-all">
                  {userEmail || "Anonymous Joe"}
                </div>
                <div className="text-[11px] text-gray-400">
                  United Taylors &bull; Joe Universe Research Division
                </div>
              </div>

              {/* Data controls: Clear all chats */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">Delete All Chats</div>
                    <div className="text-[11px] text-gray-400">
                      Permanently wipe all conversation sessions from this device
                    </div>
                  </div>

                  {showClearConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1.5 text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All</span>
                    </button>
                  )}
                </div>

                {clearedNotice && (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>All conversations cleared successfully.</span>
                  </div>
                )}
              </div>

              {/* Log out */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Log Out</div>
                  <div className="text-[11px] text-gray-400">
                    Sign out of this session
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1c1c1c] border border-white/5 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#10a37f] flex items-center justify-center mx-auto text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">ChatJoePT</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                  The official conversational intelligence of the Joe Universe, powered by the flagship JPT-6.1 Series.
                </p>
                <div className="text-[11px] text-gray-400 pt-1 font-mono">
                  Version 6.1.0 &bull; Sol / Terra Core
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 italic">
                &ldquo;To Joe, or not to Joe, that is the question.&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex justify-end bg-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-[#2f2f2f] hover:bg-white/10 text-white rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
