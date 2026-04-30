# Architecture — <<service-name>>

> Skeleton — fill in concrete details for this service. Keep this short (≤ 1 page). Copilot reads it for cross-file context.

## Purpose

One paragraph: what business capability does this service provide, who consumes it, what does it own.

## Stack

Spring Boot 4.0.6 / Java 21. See `.github/copilot-instructions.md` for the full version set.

## Layout

```
src/main/java/<<org>>/<<service_name>>/
  api/             REST controllers, DTO records, OpenAPI annotations
    dto/
  application/     use-case services, ports (interfaces), transactions
    port/
    mapper/
  domain/          entities, value objects, domain events. PURE (no Spring/Jakarta).
    exception/
  infrastructure/  adapters: JPA repos, Redis, SOAP gateways, HTTP clients
    persistence/
    soap/<<vendor>>/
    http/<<vendor>>/
  config/          one @Configuration per concern (NO SecurityConfig — see below)
```

## Cross-cutting concerns

| Concern              | Owner                                    | Where to extend                         |
|----------------------|------------------------------------------|-----------------------------------------|
| Web security         | `<<org>>-common-security` (lib)          | `<<org-prefix>>.security.*` properties  |
| Error handling       | `<<org>>-common-error-handling` (lib)    | Subclass `DomainException`              |
| Caching              | This service (`config/RedisConfig.java`) | Add cache name + TTL                    |
| Observability        | This service (`config/ObservabilityConfig.java`) | Add metrics with service prefix |
| Secrets              | Azure Key Vault via `<<org-prefix>>.keyvault.*` | Never read secret env vars in code |
| Resilience           | Resilience4j per outbound boundary       | Add `<vendor>-<service>` config block   |

## Request flow (text diagram)

```
HTTP request
  → SecurityFilterChain (provided by common-security)
  → DispatcherServlet
  → OrderController (api/)
  → @Valid DTO record
  → OrderService (application/, @Transactional)
  → OrderRepository (port → JPA adapter in infrastructure/)
  → PricingGateway (port → @HttpServiceClient adapter in infrastructure/)
  ← OrderResponse
  ← (exceptions caught by common-error-handling advice → ProblemDetail)
```

## Caches

| Name                    | TTL  | Key                | Eviction triggers               |
|-------------------------|------|--------------------|---------------------------------|
| orders.byId             | 15m  | orderId (UUID)     | cancelOrder, updateOrder        |
| pricing.bySkuAndQuantity | 30s | sku + quantity    | none (TTL only)                 |

## Outbound dependencies

| Dependency       | Protocol | Where                                  | Resilience config name |
|------------------|----------|----------------------------------------|------------------------|
| Pricing API      | HTTPS    | `infrastructure/http/pricing/`         | `pricing`              |
| <<Vendor>> CRM   | SOAP     | `infrastructure/soap/<<vendor>>/`      | `<<vendor>>-customers` |

## Profiles

`local` (Docker compose), `dev`, `staging`, `prod`. Profile-specific YAML overrides only what differs from `application.yml`.

## Key ADRs

See `docs/adr/`.
