# Question
Act as Azure, nextjs, spring boot, Auth2 expert. Provide a solution for the authentication and authorization worflow for the use case below
- A web application (NextJs) that is registered as web-1 and has app roles Admin, Role1 and Role2 in Microsofot entra
- A backend that  (Spring boot) that is registred as api-1 has app roles API1:READ and API1:WRITE in Microsoft entra
- A backend that  (Spring boot) that is registred as api-2 has app roles API2:READ and API2:WRITE and API2:ALL in Microsoft entra
- The Admin users in the frontend should be able to have functionnalities API1:READ and API1:WRITE and API2: ALL
- The Role1 user group in the frontend should be able to have functionnalities API1:READ and API2:READ
- The Role2 user group in the frontend should be able to have functionnalities API1:READ and API1:WRITE and API2:READ

# Response
Below is a detailed solution outlining how to design the authentication and authorization workflow using Microsoft Entra (Azure AD), a NextJs frontend, and two Spring Boot backend APIs. This solution covers the registration of apps in Microsoft Entra, token issuance (including delegated permissions and the on‐behalf‐of flow), and role-based access control in both the frontend and backend.

---

## 1. Overview and Architecture

### High-Level Flow
1. **User Authentication:**
    - A user accesses the NextJs web application (registered as **web-1**) and signs in via Azure AD using OpenID Connect.
    - During sign-in, Azure AD issues an ID token that contains the user’s claims, including one or more **app roles** (e.g. Admin, Role1, or Role2).

2. **Token Acquisition for API Calls:**
    - Once authenticated, the NextJs application uses the acquired token to perform an **on‐behalf‐of (OBO) flow** to request access tokens for the backend APIs.
    - When performing the OBO flow, the app requests tokens for:
        - **api-1** (Spring Boot, with app roles API1:READ and API1:WRITE)
        - **api-2** (Spring Boot, with app roles API2:READ, API2:WRITE, and API2:ALL)

3. **Role Mapping and API Access:**
    - **Admin users** in web-1 are mapped to have the permissions: API1:READ, API1:WRITE, and API2:ALL.
    - **Role1 users** are mapped to have API1:READ and API2:READ.
    - **Role2 users** are mapped to have API1:READ, API1:WRITE, and API2:READ.
    - The issued access tokens (which may include custom claims via optional claims or through token transformation) embed the necessary roles/scopes.
    - When a token is sent to an API, Spring Boot’s resource server configuration validates the token and checks for the required roles before granting access to protected endpoints.

4. **Spring Boot API Authorization:**
    - Each backend (api-1 and api-2) is configured as an OAuth2 resource server.
    - The APIs use Spring Security annotations (or similar mechanisms) to protect endpoints, ensuring that only tokens with the correct role claims (e.g., “API1:WRITE”, “API2:ALL”) can access particular functionality.

---

## 2. Microsoft Entra (Azure AD) Setup

### App Registrations and Role Definitions

#### **Frontend App – web-1**
- **Registration:** Create an app registration named **web-1**.
- **App Roles:**
    - Define roles such as **Admin**, **Role1**, and **Role2**.
    - When a user is assigned one of these roles (via Azure AD’s Enterprise Applications), the corresponding role claim will be included in the token.
- **Permissions:**
    - Configure web-1 to request delegated permissions for both backend APIs (api-1 and api-2).

#### **Backend API – api-1**
- **Registration:** Create an app registration named **api-1**.
- **Expose an API:**
    - Define the scopes (or app roles) such as **API1:READ** and **API1:WRITE**.
- **Role Validation:**
    - Configure the application manifest to include these roles.

#### **Backend API – api-2**
- **Registration:** Create an app registration named **api-2**.
- **Expose an API:**
    - Define scopes/app roles: **API2:READ**, **API2:WRITE**, and **API2:ALL**.
- **Role Validation:**
    - Similarly, update the manifest to include these roles.

### Role Assignment and Mapping
- **Mapping User Roles to API Permissions:**
    - **Admin**: In Azure AD, assign Admin users (or groups) in web-1 with the Admin role. In token exchange, map this role to include access tokens with both **API1:READ/API1:WRITE** and **API2:ALL**.
    - **Role1**: When a user has the Role1 role, map the access token to include **API1:READ** and **API2:READ**.
    - **Role2**: When a user has the Role2 role, map the access token to include **API1:READ/API1:WRITE** and **API2:READ**.

  *This mapping can be achieved using Azure AD’s optional claims or via custom policies if using Identity Governance (B2C or conditional access). In many cases, the frontend can decide which API access token to request (or can supply hints/scopes) so that the token’s claims align with the intended permissions.*

---

## 3. NextJs Frontend Implementation

### Authentication and Token Acquisition
- **Use MSAL.js (Microsoft Authentication Library):**
    - Integrate MSAL in your NextJs app to handle user sign-in and token management.
    - Configure MSAL with the **web-1** app registration details (client ID, authority, redirect URIs).

- **Obtain ID and Access Tokens:**
    - Upon sign-in, the ID token contains the app roles (Admin, Role1, or Role2).
    - For calling the APIs, initiate an **on‐behalf‐of (OBO)** flow:
        - Use the acquired ID token (or a user access token) to request separate access tokens for **api-1** and **api-2**.
        - In the token request, include the required scopes (e.g., `api1://<api-1-client-id>/API1.Read`, `api1://<api-1-client-id>/API1.Write`, etc. and similarly for api-2).
    - Ensure that the user’s role from the frontend is used to decide which scopes to request.

### Token Storage and API Calls
- **Token Storage:**
    - Store tokens in secure, httpOnly cookies or secure storage mechanisms.
- **API Calls:**
    - Attach the acquired access tokens in the `Authorization` header when calling the backend endpoints.

---

## 4. Spring Boot Backend Configuration

### Configuring the Resource Servers
For each backend API (api-1 and api-2), configure Spring Security to validate tokens issued by Azure AD.

#### **Common Configuration**
- **Dependency:**
    - Add the Spring Boot starter for OAuth2 Resource Server (e.g., `spring-boot-starter-oauth2-resource-server`).
- **application.yml / application.properties:**
    - Configure the issuer URI to point to your Azure AD tenant (e.g., `https://login.microsoftonline.com/{tenant-id}/v2.0`).

#### **Example (api-1):**

```java
@Configuration
@EnableWebSecurity
public class Api1SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
          .authorizeRequests()
            .antMatchers("/admin/**").hasAuthority("APPROLE_API1_WRITE")
            .antMatchers("/read/**").hasAnyAuthority("APPROLE_API1_READ", "APPROLE_API1_WRITE")
            .anyRequest().authenticated()
          .and()
          .oauth2ResourceServer()
            .jwt();
    }
}
```

> **Note:**
> - The role names in the token might appear as claims such as `roles` or `appRoles`.
> - You may need a custom `JwtAuthenticationConverter` to map the claim values into Spring Security authorities (e.g., prefixing with `APPROLE_`).

#### **Mapping Token Claims to Authorities:**
Create a custom converter if needed:

```java
public class AzureADJwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        // Assuming roles are in a claim named "roles" or "appRoles"
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) {
            roles.forEach(role -> authorities.add(new SimpleGrantedAuthority("APPROLE_" + role.toUpperCase())));
        }
        return new JwtAuthenticationToken(jwt, authorities);
    }
}
```

Then configure it in your resource server setup:

```java
http.oauth2ResourceServer()
    .jwt()
    .jwtAuthenticationConverter(new AzureADJwtAuthConverter());
```

#### **Repeat for api-2:**
- Apply a similar configuration and adjust the endpoint access rules.
- For endpoints that require **API2:ALL** (for Admin users) versus **API2:READ** (for Role1 and Role2), ensure your method-level security or HTTP security rules verify the correct authority.

---

## 5. End-to-End Authorization Logic

### Role-to-Permission Mapping Recap
- **Admin (web-1):**
    - **api-1:** Must have both **API1:READ** and **API1:WRITE**.
    - **api-2:** Must have **API2:ALL**.

- **Role1 (web-1):**
    - **api-1:** Must have **API1:READ**.
    - **api-2:** Must have **API2:READ**.

- **Role2 (web-1):**
    - **api-1:** Must have **API1:READ** and **API1:WRITE**.
    - **api-2:** Must have **API2:READ**.

### How to Enforce
- **Token Issuance:**
    - When performing the OBO flow, the NextJs app requests tokens that include the scopes corresponding to the user’s role.
    - Azure AD then issues tokens that include the appropriate app roles for each API.
- **Backend Authorization:**
    - Each Spring Boot backend validates that the token contains the required authority before processing the request.
    - For example, an endpoint that updates data in api-1 would check for the presence of **APPROLE_API1_WRITE** in the token.
- **Frontend UI:**
    - The NextJs app can also show/hide UI components based on the user’s role claims received in the ID token.

---

## 6. Summary and Best Practices

- **Use Standard Protocols:**
    - Utilize OpenID Connect for user authentication and OAuth2 for API access.
- **Implement the On-Behalf-Of Flow:**
    - This ensures that the user’s context (including their role) is propagated to the backend APIs.
- **Custom Claim Mapping:**
    - If the tokens do not directly contain the desired API roles, use Azure AD’s optional claims or a custom token transformer to include them.
- **Secure Storage and Transmission:**
    - Use secure mechanisms for storing tokens on the frontend (e.g., httpOnly cookies) and always use HTTPS for API calls.
- **Granular API Protection:**
    - In Spring Boot, use Spring Security’s method-level or URL-based security to enforce role-based access.

This comprehensive approach allows you to centrally manage user identities and permissions in Microsoft Entra while cleanly separating concerns between the NextJs frontend and the Spring Boot APIs. The use of standardized flows (OIDC, OAuth2, OBO) ensures secure delegation of user identity and permissions throughout your application ecosystem.
