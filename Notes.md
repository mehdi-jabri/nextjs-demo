Here's a comprehensive guide to implementing **Azure AD authentication** using **NextAuth.js** in a production-ready Next.js app deployed on **Azure Kubernetes Service (AKS)** behind an **NGINX Ingress Controller**. The application will use **OAuth 2.0 Authorization Code Flow with PKCE**, as required by Azure AD when using SPA registrations.

---

## ✅ **1. Azure AD Registration (SPA)**

- Log in to [Azure Portal](https://portal.azure.com/).
- Navigate to **Azure Active Directory → App registrations → New registration**.
- Choose the **Single-page application (SPA)** option.
- Set the **Redirect URI** to your **production domain**:

  ```
  https://your-domain.com/api/auth/callback/azure-ad
  ```

- Click **Register**.

---

## ✅ **2. Credentials & Configuration**

**Note down** from Azure AD registration:

- `AZURE_AD_CLIENT_ID`: Your Azure AD application ID.
- `AZURE_AD_TENANT_ID`: Your Azure AD tenant ID (or `common` for multi-tenant).

---

## ✅ **3. Next.js Project Setup**

Install dependencies:

```bash
npm install next-auth @azure/msal-node
```

---

## ✅ **4. NextAuth.js Configuration**

Configure NextAuth at:

```
/app/api/auth/[...nextauth]/route.ts
```

**Example configuration (`route.ts`):**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
```

---

## ✅ **5. Environment Variables (Production-ready)**

Use Kubernetes **Secrets** to store sensitive variables securely.

Create a Kubernetes secret:

```bash
kubectl create secret generic nextjs-auth-secret \
  --from-literal=AZURE_AD_CLIENT_ID=<your-client-id> \
  --from-literal=AZURE_AD_TENANT_ID=<your-tenant-id> \
  --from-literal=NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

---

## ✅ **6. Dockerfile for Next.js**

Here's a **production-ready** Dockerfile for your Next.js app:

```dockerfile
# Dockerfile (multi-stage)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ **7. Kubernetes Deployment (AKS)**

### **a. Deployment Manifest (`nextjs-app-deployment.yaml`)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
  labels:
    app: nextjs-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nextjs-app
  template:
    metadata:
      labels:
        app: nextjs-app
    spec:
      containers:
        - name: nextjs-app
          image: your-registry.azurecr.io/nextjs-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: AZURE_AD_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: nextjs-auth-secret
                  key: AZURE_AD_CLIENT_ID
            - name: AZURE_AD_TENANT_ID
              valueFrom:
                secretKeyRef:
                  name: nextjs-auth-secret
                  key: AZURE_AD_TENANT_ID
            - name: NEXTAUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: nextjs-auth-secret
                  key: NEXTAUTH_SECRET
            - name: NEXTAUTH_URL
              value: "https://your-domain.com"
```

### **b. Service Manifest (`nextjs-app-service.yaml`)**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nextjs-app-service
  labels:
    app: nextjs-app
spec:
  selector:
    app: nextjs-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

---

## ✅ **8. NGINX Ingress Configuration**

Ensure an NGINX ingress controller is already installed in AKS.

### Ingress Manifest (`nextjs-app-ingress.yaml`):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nextjs-app-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
    - hosts:
        - your-domain.com
      secretName: tls-secret  # SSL cert secret
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nextjs-app-service
                port:
                  number: 80
```

---

## ✅ **9. SSL/TLS with Cert-Manager (optional but recommended)**

Install **Cert-Manager** on AKS for automated TLS certificates using Let's Encrypt.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml
```

**Create a Certificate resource** (`certificate.yaml`):

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: nextjs-app-tls
spec:
  secretName: tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - your-domain.com
```

---

## ✅ **10. Client-side Integration**

Use NextAuth React hooks (`useSession`, `signIn`, `signOut`):

```tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (!session)
    return <button onClick={() => signIn("azure-ad")}>Sign in</button>;

  return (
    <div>
      Signed in as {session.user?.email}
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

---

## ✅ **11. Deployment Workflow**

Push your Docker image to **Azure Container Registry (ACR)**:

```bash
az acr login --name your-registry
docker build -t your-registry.azurecr.io/nextjs-app:latest .
docker push your-registry.azurecr.io/nextjs-app:latest
```

Apply manifests to AKS:

```bash
kubectl apply -f nextjs-app-deployment.yaml
kubectl apply -f nextjs-app-service.yaml
kubectl apply -f nextjs-app-ingress.yaml
```

---

## ✅ **12. Important Security & Production Tips**

- Use HTTPS/TLS in production.
- Store secrets securely (e.g., Azure Key Vault integrated with AKS).
- Set resource requests/limits in Kubernetes.
- Configure Horizontal Pod Autoscaler (HPA) for scaling.

---

## ✅ **Conclusion**

You now have a **production-grade Next.js application** deployed in AKS with Azure AD Authentication via NextAuth.js, secured with HTTPS, and served behind an NGINX ingress controller.

Your setup leverages Azure AD's recommended SPA Authentication (OAuth 2.0 Authorization Code Flow with PKCE), providing secure and scalable authentication suitable for enterprise environments.
