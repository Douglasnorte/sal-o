import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        if (isLoggedIn) {
          return NextResponse.redirect(new URL("/agenda", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
};
