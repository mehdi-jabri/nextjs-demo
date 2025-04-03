import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions, Session, Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface AzureProfile {
  roles?: string[];
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }): Promise<JWT> {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        // Use AzureProfile to extract roles without using 'any'
        token.roles = (profile as AzureProfile)?.roles || [];
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      session.user.accessToken = token.accessToken;
      session.user.idToken = token.idToken;
      session.user.roles = token.roles;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
