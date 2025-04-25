// app/auth.ts
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

// Define extended session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
      accessToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    accessToken?: string;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.ENTRA_ID_CLIENT_ID!,
      clientSecret: process.env.ENTRA_ID_CLIENT_SECRET!,
      issuer: process.env.ENTRA_ID_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;

        // Extract roles from token claims if available
        // This assumes roles are in the id_token claims
        if (profile && 'roles' in profile) {
          token.roles = profile.roles as string[];
        } else {
          // Default roles - you might want to adjust this based on your needs
          token.roles = ['user'];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.roles = token.roles;
        session.user.accessToken = token.accessToken;
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
