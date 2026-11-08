export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  theme: "dark" | "light" | "system";
}

export interface AuthUser {
  email: string;
  isAuthenticated: boolean;
}
