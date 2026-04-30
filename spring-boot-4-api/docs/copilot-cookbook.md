# Copilot cookbook

Paste-ready prompts for common micro-tasks. Always switch to the right agent first (architect / boot4-upgrade-checker / security-reviewer / soap-integrator / test-author).

## Add a JPA query method

> Switch to architect agent. In `#OrderRepository`, add a method `findByCustomerIdAndStatus(UUID customerId, OrderStatus status)` returning `List<Order>`. Mirror the style of the existing methods. Add a `@DataJpaTest` for it covering: returns matches, returns empty when none, paging if applicable. Bucket: GREEN.

## Generate a slice test for an existing controller

> Switch to test-author agent. Generate a `@WebMvcTest` slice test for `#OrderController#cancelOrder`. Cover: happy path with `SCOPE_orders.write`, 401 unauthenticated, 403 missing scope, 404 when service throws `OrderNotFoundException`. Use `@MockitoBean`. Mirror `#OrderControllerTest` style.

## Audit current diff

> Switch to boot4-upgrade-checker agent. Run the checklist over the current uncommitted diff. Report findings.

## Security review on PR

> Switch to security-reviewer agent. Review the uncommitted diff. Output findings by severity. End with the merge recommendation.

## Add a `@Cacheable` for an existing method

> In `#OrderService#getOrder`, add `@Cacheable(value = RedisConfig.CACHE_ORDERS_BY_ID, key = "#orderId", unless = "#result == null")`. Add `@CacheEvict` on `cancelOrder` and `updateOrder`. Update README § Caching. Bucket: GREEN.

## Regenerate JAXB after a WSDL update

> Switch to soap-integrator agent. The WSDL at `src/main/resources/wsdl/<<vendor>>/<<service>>.wsdl` was updated. Re-read it, identify changed/new/removed operations, list every consumer of the old operation (search the gateway), and propose a migration plan. Do NOT modify code yet.

## Add a new domain exception

> Add a new domain exception `OrderAlreadyShippedException` extending `<<org>>.commons.errorhandling.DomainException` with `@ResponseStatus(HttpStatus.CONFLICT)` and `ErrorCode.RESOURCE_CONFLICT`. Throw it from `#OrderService#cancelOrder` when status is SHIPPED. Add a unit test covering this branch. Do NOT add a `@RestControllerAdvice` (the lib handles mapping).

## Add OpenAPI annotations to an existing endpoint

> Add `@Operation`, `@ApiResponses` to `#OrderController#cancelOrder`. Document 200, 404, 409. Use `@Schema(implementation = ProblemDetail.class)` on error content. operationId = `cancelOrder`. Run `npx @stoplight/spectral-cli lint` after.

## Plan a new SOAP integration

> Switch to soap-integrator agent. Plan-only — bucket: RED. Vendor: `<<vendor>>`. WSDL URL: `<paste>`. First operation: `<name>`. Auth: WS-Security username/password from Key Vault. Produce the full plan per `.github/prompts/new-soap-client.prompt.md`. Do NOT execute.
