import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = (process.env.ALLOWED_DOMAIN ?? "yaqbot.com").toLowerCase();

// "hd" only makes sense for Google Workspace domains, not for gmail.com
const isWorkspaceDomain = ALLOWED_DOMAIN !== "gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account", // always let the coach choose the account
          ...(isWorkspaceDomain && { hd: ALLOWED_DOMAIN }),
        },
      },
    }),
  ],
  pages: {
    signIn: "/", // our own home page is the login page
    error: "/",  // errors (e.g. wrong domain) come back home with ?error=…
  },
  callbacks: {
    // The real security check: runs on the server after Google answers
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const email = profile?.email?.toLowerCase();
      return profile?.email_verified === true && !!email && email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
    // Used by the proxy to decide whether a request is allowed
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});