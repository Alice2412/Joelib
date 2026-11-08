import React, { useRef, useEffect } from "react";
import { ArrowUp, Square, Plus, Globe, Mic } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  const canSubmit = input.trim().length > 0 && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Container Dock */}
      <div className="relative bg-[#2f2f2f] border border-white/10 rounded-[26px] p-2.5 shadow-xl transition-all focus-within:border-white/20">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ChatJoePT anything in Joeglish..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-white placeholder-gray-400 text-sm md:text-base px-3 pt-1 pb-1 resize-none focus:outline-none max-h-52 leading-relaxed"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between mt-1 px-1">
          {/* Left tools */}
          <div className="flex items-center gap-1 text-gray-400">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
              title="Add attachment"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 text-xs"
              title="Search the web (simulation)"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden sm:block"
              title="Voice mode"
            >
              <Mic className="w-4 h-4" />
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors shadow"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-black" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!canSubmit}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow ${
                  canSubmit
                    ? "bg-white text-black hover:bg-gray-200 cursor-pointer"
                    : "bg-white/20 text-gray-400 cursor-not-allowed"
                }`}
                title="Send prompt"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-400 text-center mt-2">
        ChatJoePT can make mistakes. Verify important scientific and Joe information.
      </p>
    </div>
  );
}
