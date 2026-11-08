import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/chat", "routes/api.chat.ts"),
  route("api/auth/send-code", "routes/api.auth.send-code.ts"),
  route("api/auth/verify-code", "routes/api.auth.verify-code.ts"),
  route("api/auth/logout", "routes/api.auth.logout.ts"),
] satisfies RouteConfig;
