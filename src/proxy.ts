import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // All /api routes are excluded: /api/auth needs no gate, and
  // /api/webhooks/* is called directly by external services (no session).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
