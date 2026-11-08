import React, { useState, useEffect, useRef } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { PanelLeft, SquarePen, Share2 } from "lucide-react";
import type { ChatSession, Message, UserSettings, Attachment } from "~/types/chat";
import {
  parseSessionCookie,
  verifySessionToken,
  getEnv,
} from "~/utils/auth.server";
import {
  getLocalSessions,
  saveLocalSessions,
  getActiveSessionId,
  setActiveSessionId,
  getLocalSettings,
  saveLocalSettings,
  DEFAULT_SETTINGS,
} from "~/utils/storage";
import { AuthGate } from "~/components/AuthGate";
import { Sidebar } from "~/components/Sidebar";
import { ModelSelector } from "~/components/ModelSelector";
import { ChatMessage } from "~/components/ChatMessage";
import { ChatInput } from "~/components/ChatInput";
import { EmptyState } from "~/components/EmptyState";
import { SettingsModal } from "~/components/SettingsModal";

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";

  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseSessionCookie(cookieHeader);
  const session = await verifySessionToken(sessionToken, secret);

  return {
    isAuthenticated: !!session,
    userEmail: session?.email || null,
  };
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(loaderData.isAuthenticated);
  const [userEmail, setUserEmail] = useState<string>(loaderData.userEmail || "");

  // App & Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persisted sessions and settings on client mount
  useEffect(() => {
    const loadedSettings = getLocalSettings();
    setSettings(loadedSettings);
    if (loadedSettings.model) {
      setSelectedModel(loadedSettings.model);
    }

    const loadedSessions = getLocalSessions();
    setSessions(loadedSessions);

    const activeId = getActiveSessionId();
    if (activeId && loadedSessions.some((s) => s.id === activeId)) {
      setActiveSessionIdState(activeId);
    } else if (loadedSessions.length > 0) {
      setActiveSessionIdState(loadedSessions[0].id);
      setActiveSessionId(loadedSessions[0].id);
    }
  }, []);

  // Sync sessions changes to localStorage
  const updateSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    saveLocalSessions(newSessions);
  };

  const currentSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isStreaming]);

  // Create New Chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: "chat_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: "New chat",
      messages: [],
      model: selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const nextSessions = [newSession, ...sessions];
    updateSessions(nextSessions);
    setActiveSessionIdState(newSession.id);
    setActiveSessionId(newSession.id);
    setInput("");
  };

  // Select an existing session
  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveSessionIdState(id);
    setActiveSessionId(id);
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id);
    updateSessions(nextSessions);
    if (activeSessionId === id) {
      const nextId = nextSessions.length > 0 ? nextSessions[0].id : null;
      setActiveSessionIdState(nextId);
      setActiveSessionId(nextId);
    }
  };

  // Stop active generation
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message with optional file attachments and web search
  const handleSendMessage = async (
    textToSend?: string,
    attachmentsToSend?: Attachment[],
    webSearchToSend?: boolean
  ) => {
    const content = (textToSend !== undefined ? textToSend : input).trim();
    const attachments = attachmentsToSend || [];
    const webSearch = webSearchToSend || false;

    if ((!content && attachments.length === 0) || isStreaming) return;

    setInput("");

    // Ensure there is an active session
    let sessionId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === sessionId);

    if (!targetSession) {
      const newSession: ChatSession = {
        id: "chat_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: content.slice(0, 36) || (attachments[0]?.name ? `File: ${attachments[0].name}` : "New chat"),
        messages: [],
        model: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      targetSession = newSession;
      sessionId = newSession.id;
      setActiveSessionIdState(sessionId);
      setActiveSessionId(sessionId);
      setSessions((prev) => [newSession, ...prev]);
    }

    const userMessage: Message = {
      id: "msg_user_" + Date.now(),
      role: "user",
      content: content || (attachments.length > 0 ? `Attached: ${attachments.map(a => a.name).join(", ")}` : ""),
      createdAt: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
      webSearch,
    };

    const assistantMessage: Message = {
      id: "msg_asst_" + Date.now(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      webSearch,
    };

    const updatedMessages = [...targetSession.messages, userMessage, assistantMessage];

    // Auto-title session from first user message
    const updatedTitle =
      targetSession.messages.length === 0
        ? (content || attachments[0]?.name || "New chat").slice(0, 32)
        : targetSession.title;

    const nextSession: ChatSession = {
      ...targetSession,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    const nextSessions = sessions.some((s) => s.id === sessionId)
      ? sessions.map((s) => (s.id === sessionId ? nextSession : s))
      : [nextSession, ...sessions];

    updateSessions(nextSessions);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const formattedChatMessages = [...targetSession.messages, userMessage].map((m) => {
        let fullText = m.content;
        if (m.attachments && m.attachments.length > 0) {
          const filesSummary = m.attachments
            .map((att) => `[File Attachment: ${att.name}]\n\`\`\`\n${att.content}\n\`\`\``)
            .join("\n\n");
          fullText = fullText ? `${fullText}\n\n${filesSummary}` : filesSummary;
        }
        return {
          role: m.role,
          content: fullText,
        };
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedChatMessages,
          webSearch,
          apiKey: settings.apiKey ? settings.apiKey : undefined,
          baseUrl: settings.baseUrl ? settings.baseUrl : undefined,
          model: selectedModel || undefined,
          systemPrompt: settings.systemPrompt,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`Chat error status ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body received from server");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      let buffer = "";
      let hasStartedReasoning = false;
      let hasClosedReasoning = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();

          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || "";

            if (reasoning) {
              if (!hasStartedReasoning) {
                streamedText += "<think>";
                hasStartedReasoning = true;
              }
              streamedText += reasoning;
            }

            if (delta) {
              if (hasStartedReasoning && !hasClosedReasoning) {
                streamedText += "</think>\n\n";
                hasClosedReasoning = true;
              }
              streamedText += delta;
            }

            if (delta || reasoning) {
              // Update state with newly arrived chunk
              setSessions((currentSessions) =>
                currentSessions.map((s) => {
                  if (s.id !== sessionId) return s;
                  const msgs = [...s.messages];
                  const lastIdx = msgs.length - 1;
                  if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                    msgs[lastIdx] = { ...msgs[lastIdx], content: streamedText };
                  }
                  return { ...s, messages: msgs, updatedAt: Date.now() };
                })
              );
            }
          } catch {
            // Raw text or incomplete json chunk, wait for next token
          }
        }
      }

      if (hasStartedReasoning && !hasClosedReasoning) {
        streamedText += "</think>\n\n";
      }

      // Final save to localStorage with complete streamed text
      setSessions((finalSessions) => {
        saveLocalSessions(finalSessions);
        return finalSessions;
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat streaming error:", err);
        setSessions((currentSessions) => {
          const updated = currentSessions.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              const currentContent = msgs[lastIdx].content;
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content:
                  currentContent +
                  `\n\n*[ChatJoePT Error]: ${err.message || "Failed to communicate with service"}*`,
              };
            }
            return { ...s, messages: msgs };
          });
          saveLocalSessions(updated);
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!currentSession || isStreaming) return;
    const msgs = currentSession.messages;
    if (msgs.length === 0) return;

    let lastUserPrompt = "";
    let lastAttachments: Attachment[] | undefined;
    let lastWebSearch = false;
    const trimmedMsgs = [...msgs];

    if (trimmedMsgs[trimmedMsgs.length - 1].role === "assistant") {
      trimmedMsgs.pop();
    }
    if (trimmedMsgs.length > 0 && trimmedMsgs[trimmedMsgs.length - 1].role === "user") {
      const u = trimmedMsgs[trimmedMsgs.length - 1];
      lastUserPrompt = u.content;
      lastAttachments = u.attachments;
      lastWebSearch = !!u.webSearch;
      trimmedMsgs.pop();
    }

    if (!lastUserPrompt && (!lastAttachments || lastAttachments.length === 0)) return;

    const nextSession = { ...currentSession, messages: trimmedMsgs };
    const nextSessions = sessions.map((s) => (s.id === currentSession.id ? nextSession : s));
    updateSessions(nextSessions);

    handleSendMessage(lastUserPrompt, lastAttachments, lastWebSearch);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setIsAuthenticated(false);
    setUserEmail("");
  };

  // If unauthenticated, display the ChatGPT registration & login gate
  if (!isAuthenticated) {
    return (
      <AuthGate
        onSuccess={(email) => {
          setUserEmail(email);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        userEmail={userEmail}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Chat View Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-3 md:px-4 z-10 shrink-0 select-none bg-[#212121]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                type="button"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            <ModelSelector
              currentModel={selectedModel}
              onSelectModel={(m) => {
                setSelectedModel(m);
                saveLocalSettings({ model: m });
              }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNewChat}
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors sm:hidden"
              title="New chat"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "ChatJoePT",
                    text: "Experience ChatJoePT in the Joe Universe!",
                    url: window.location.href,
                  });
                }
              }}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </header>

        {/* Conversation Scroll Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {!currentSession || currentSession.messages.length === 0 ? (
            <EmptyState onSelectPrompt={(p) => handleSendMessage(p)} />
          ) : (
            <div className="flex-1 py-4 space-y-2">
              {currentSession.messages.map((msg, index) => {
                const isLast = index === currentSession.messages.length - 1;
                return (
                  <ChatMessage
                    key={msg.id || index}
                    message={msg}
                    isStreaming={isLast && isStreaming}
                    onRegenerate={isLast ? handleRegenerate : undefined}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Bottom Input Dock with Attachments & Web Search */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={(attachedFiles, isWebSearch) =>
            handleSendMessage(undefined, attachedFiles, isWebSearch)
          }
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => {
          const s = saveLocalSettings(updated);
          setSettings(s);
          if (updated.model) {
            setSelectedModel(updated.model);
          }
        }}
      />
    </div>
  );
}
