# Setting up Azure AD Authentication in Next.js for Production

This guide provides a comprehensive setup for implementing Azure AD authentication in a Next.js application, following the latest best practices for production environments.

## 1. Project Structure

Your Next.js project should have the following structure for authentication:

```
my-nextjs-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   └── LoginButton.tsx
│   └── providers/
│       └── AuthProvider.tsx
├── types/
│   └── next-auth.d.ts
├── .env.local
├── .env.production
└── next.config.js
```

## 2. Environment Variables

Create a `.env.local` file for local development and a `.env.production` file for production:

```
# .env.local or .env.production
NEXTAUTH_URL=https://your-app-domain.com
NEXTAUTH_SECRET=your-secure-nextauth-secret

# Azure AD credentials
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# Optional: Define the scope needed for your app
AZURE_AD_SCOPE="openid profile email https://your-app-domain.com/.default"
```

In production deployments, ensure these environment variables are securely injected into your container/environment.

## 3. NextAuth Configuration

Create the NextAuth API route handler at `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extend the Session type to include additional properties
interface ExtendedSession extends Session {
  user: Session["user"] & {
    accessToken?: string;
    idToken?: string;
    roles?: string[];
  };
}

// Define the AzureProfile interface to type the profile response
interface AzureProfile {
  roles?: string[];
  oid?: string;
}

// Define what additional data we want in the JWT token
interface ExtendedJWT extends JWT {
  accessToken?: string;
  idToken?: string;
  roles?: string[];
}

// Export the authOptions for use in other server components if needed
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
      authorization: {
        params: {
          scope: process.env.AZURE_AD_SCOPE || "openid profile email",
        },
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, account, profile }): Promise<ExtendedJWT> {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.roles = (profile as AzureProfile)?.roles || [];
        token.oid = (profile as AzureProfile)?.oid;
      }
      return token;
    },
    
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedSession = session as ExtendedSession;
      
      // Add the token details to the session
      extendedSession.user.accessToken = token.accessToken as string;
      extendedSession.user.idToken = token.idToken as string;
      extendedSession.user.roles = token.roles as string[];
      
      return extendedSession;
    },
  },
  
  pages: {
    signIn: "/auth/signin",
  },
  
  // For production, use secure cookies
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  
  // Session configuration
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  debug: process.env.NODE_ENV === "development",
};

// Create and export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## 4. TypeScript Type Declarations

Create a declaration file at `types/next-auth.d.ts` to extend NextAuth types:

```typescript
import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string;
      idToken?: string;
      roles?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    roles?: string[];
    oid?: string;
  }
}
```

## 5. Auth Provider Component

Create an AuthProvider wrapper at `components/providers/AuthProvider.tsx`:

```tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## 6. Layout Integration

Wrap your application in the AuthProvider in your root layout at `app/layout.tsx`:

```tsx
import AuthProvider from "@/components/providers/AuthProvider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App with Azure AD Auth",
  description: "Next.js application with Azure AD authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## 7. Login Button Component

Create a login/logout button at `components/auth/LoginButton.tsx`:

```tsx
'use client';

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return <button onClick={() => signIn("azure-ad")}>Sign in with Azure AD</button>;
}
```

## 8. Custom Sign-in Page

Create a custom sign-in page at `app/auth/signin/page.tsx`:

```tsx
'use client';

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const error = searchParams?.get("error");

  useEffect(() => {
    // Auto-trigger sign-in when the page loads
    signIn("azure-ad", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Signing you in...</h1>
      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
          Authentication error: {error}
        </div>
      )}
      <button
        onClick={() => signIn("azure-ad", { callbackUrl })}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Sign in with Azure AD
      </button>
    </div>
  );
}
```

## 9. Protecting Pages/Routes

### Server-side protection for a page:

```tsx
// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <div>
      <h1>Protected Dashboard</h1>
      <p>Welcome {session.user.name}!</p>
      {/* Dashboard content */}
    </div>
  );
}
```

### Client-side protection for a component:

```tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <h2>Protected Content</h2>
      {/* Protected content here */}
    </div>
  );
}
```

## 10. Role-Based Access Control

For role-based authorization:

```tsx
'use client';

import { useSession } from "next-auth/react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ 
  children, 
  allowedRoles,
  fallback = <div>You don't have permission to view this content</div>
}: RoleGuardProps) {
  const { data: session } = useSession();
  
  if (!session) {
    return null;
  }
  
  const hasRequiredRole = session.user.roles?.some(role => 
    allowedRoles.includes(role)
  );
  
  if (!hasRequiredRole) {
    return fallback;
  }
  
  return <>{children}</>;
}
```

## 11. NextAuth Configuration

Update your `next.config.js` with any necessary configurations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Edge runtime if desired
  // experimental: {
  //   runtime: 'edge',
  // },
  
  // Add any rewrites or redirects if needed
  async rewrites() {
    return [
      // Example: Rewrite auth endpoints if needed
    ];
  },
};

module.exports = nextConfig;
```

## 12. Docker Configuration

Ensure your Dockerfile copies the environment variables for production:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy necessary files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Install production dependencies
RUN npm ci --only=production

# For production, copy ENV file if needed
# COPY .env.production ./.env.production

# Start the app
EXPOSE 3000
CMD ["npm", "start"]
```

Remember to use environment variables in your container orchestration platform (Kubernetes, Docker Compose, etc.) instead of copying `.env` files directly.

## 13. Additional Security Considerations

1. **HTTPS Only**: Ensure your app is served over HTTPS, especially in production.
2. **Secure Cookies**: Configure secure cookies as shown in the authOptions.
3. **Token Storage**: Use secure storage mechanisms for tokens.
4. **Regular Token Rotation**: Implement token refresh logic if needed.
5. **Protect API Routes**: Add authentication checks to API routes.
6. **HTTP Headers**: Set security headers using Next.js config or middleware.

By following this guide, you'll have a secure, production-ready Next.js application with Azure AD authentication.


```yaml
annotations:
  nginx.ingress.kubernetes.io/configuration-snippet: |
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  nginx.ingress.kubernetes.io/proxy-cookie-path: / /;
```

The "invalid_request The body must contain the following parameter client_id" error typically indicates the client ID isn't being passed properly in the token exchange step of the OAuth flow. These adjustments should help ensure that the entire OAuth flow, including the callback with client credentials, works correctly in your AKS cluster with Nginx ingress.
