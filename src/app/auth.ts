/**
 * auth.ts - Core Auth.js v5 configuration for Next.js
 * This configures Microsoft Entra ID and FIDO2/WebAuthn YubiKey authentication
 */
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/auth";
import { verify } from "@passwordless-id/webauthn";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  events: {
    async signIn({ user }) {
      // Log sign-in events for security auditing
      console.log(`User signed in: ${user.email}`);
    },
  },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as string;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (!token.sub) return token;

      if (user) {
        token.role = user.role;
      }

      return token;
    },
  },
  providers: [
    AzureADProvider({
      clientId: process.env.ENTRA_ID_CLIENT_ID!,
      clientSecret: process.env.ENTRA_ID_CLIENT_SECRET!,
      tenantId: process.env.ENTRA_ID_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.role ?? "user",
        };
      },
    }),
    // FIDO2/WebAuthn provider for YubiKey support
    CredentialsProvider({
      id: "webauthn",
      name: "WebAuthn (YubiKey)",
      credentials: {
        challenge: { label: "Challenge", type: "text" },
        authenticatorData: { label: "Authenticator Data", type: "text" },
        clientDataJSON: { label: "Client Data JSON", type: "text" },
        signature: { label: "Signature", type: "text" },
        credentialId: { label: "Credential ID", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.credentialId) {
            return null;
          }

          const user = await getUserByEmail(credentials.email);

          if (!user || !user.webauthnCredentials) {
            return null;
          }

          // Find the credential in the user's registered credentials
          const userCredential = user.webauthnCredentials.find(
            (cred) => cred.credentialId === credentials.credentialId
          );

          if (!userCredential) {
            return null;
          }

          // Verify the authentication with passwordless-id/webauthn
          const verification = await verify({
            challenge: credentials.challenge,
            authenticatorData: credentials.authenticatorData,
            clientDataJSON: credentials.clientDataJSON,
            signature: credentials.signature,
            credentialId: credentials.credentialId,
            credential: {
              publicKey: userCredential.publicKey,
              counter: userCredential.counter,
            },
          });

          if (verification.verified) {
            // Update the credential counter in your database
            // This is important for security to prevent replay attacks
            // await updateCredentialCounter(credentials.credentialId, verification.counter);

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          return null;
        } catch (error) {
          console.error("WebAuthn authentication error:", error);
          return null;
        }
      },
    }),
  ],
});
