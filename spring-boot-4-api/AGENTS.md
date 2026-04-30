# Agents — <<service-name>>

This repo is a Spring Boot 4.0.6 API (Java 21). For all detailed conventions, MUST/MUST-NOT rules, and architectural constraints, **read `.github/copilot-instructions.md` and the scoped files under `.github/instructions/`** before generating any code. Do not duplicate those rules here.

## Quickstart for an agent

- Build: `./mvnw -B verify` (or `./gradlew build`)
- Unit tests: `./mvnw -B test` — JUnit 5 + Mockito + AssertJ. Slice tests use `@WebMvcTest` + `@MockitoBean`.
- Lint/format: `./mvnw spotless:check` (apply with `spotless:apply`)
- Run locally: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`
- Generate JAXB from WSDL (if SOAP module present): `./mvnw generate-sources`
- OpenAPI lint: `npx @stoplight/spectral-cli lint src/main/resources/openapi/*.yaml`

## Boundaries

- Hexagonal layout: `api → application → domain → infrastructure`. No upward edges.
- Internal common libs are MANDATORY: `<<org>>-common-security` (web security), `<<org>>-common-error-handling` (error management). Do NOT define a service-local `SecurityFilterChain` or a service-local generic `@RestControllerAdvice`. Extend the libs.
- No `javax.*`. No `RestTemplate`. No `WebSecurityConfigurerAdapter`. No `@SpringBootTest` or Testcontainers (deferred).
- Verify Spring/Azure APIs against official docs before generating; do not invent.

## Default agents

Pick one before starting work:

- **architect** — design only, refuses to write code, delegates to subagents.
- **boot4-upgrade-checker** — audits a diff for Boot 2.x/3.x leftovers.
- **security-reviewer** — security checklist on a diff.
- **test-author** — generates only tests in the project's Mockito-unit pattern.
- **soap-integrator** — WSDL ingestion, JAXB generation, SOAP gateway setup.

## Autonomous-execution scope

See `.github/copilot-instructions.md` § Autonomous-execution scope. Map every task to GREEN / YELLOW / RED before starting. RED tasks must not run autonomously.
