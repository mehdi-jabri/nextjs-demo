# Copilot template — Spring Boot 4.0.6 API

Drop-in configuration bundle for GitHub Copilot agent mode (VS Code) on a Spring Boot 4.0.6 / Java 21 service. See the strategy plan that produced this bundle at `~/.claude/plans/for-a-client-i-cached-stearns.md`.

## What's in here

```
AGENTS.md                          # Open-standard pointer file (Copilot coding agent)
.github/
  copilot-instructions.md          # Auto-loaded long-form rules (VS Code chat)
  instructions/                    # Scoped rules, applyTo: glob front-matter
    controllers.instructions.md
    services.instructions.md
    mappers.instructions.md
    tests.instructions.md
    config.instructions.md
    security.instructions.md
    openapi.instructions.md
    commons.instructions.md        # Internal common-libs decision tree
    soap.instructions.md           # SOAP-only — delete if not used
  agents/                          # Custom personas (.agent.md)
    architect.agent.md
    boot4-upgrade-checker.agent.md
    security-reviewer.agent.md
    test-author.agent.md
    soap-integrator.agent.md       # SOAP-only — delete if not used
  prompts/                         # Slash-command workflows (.prompt.md)
    bootstrap-conventions.prompt.md
    new-endpoint.prompt.md
    new-http-client.prompt.md
    add-cached-method.prompt.md
    add-mapper.prompt.md
    upgrade-check.prompt.md
    openapi-sync.prompt.md
    new-soap-client.prompt.md      # SOAP-only — delete if not used
.vscode/settings.json              # Workspace toggles for instruction/prompt/agent files
.copilotignore                     # Exclude generated/binary noise
docs/
  architecture.md                  # Skeleton — fill in per repo
  copilot-cookbook.md              # Paste-ready prompts
  snippets/                        # CANONICAL examples — Copilot copies from these
    *.java
  adr/                             # ADR template
renovate.json                      # Automated dependency PRs
.spectral.yaml                     # OpenAPI lint ruleset
.pre-commit-config.yaml            # Local pre-push gates
```

## How to apply to a target repo

1. Confirm Layer 7 (CI gates) is set up first in the target repo: Spotless, Error Prone, NullAway, ArchUnit, forbidden-imports grep, JaCoCo + diff-cover, PIT (changed packages), Spectral, oasdiff, gitleaks. Without these, autonomous mode amplifies risk.
2. Copy the contents of this folder into the target repo root.
3. Find-and-replace every `<<...>>` placeholder. The set:
   - `<<service-name>>` — service name (e.g., `customer-api`)
   - `<<org>>` — your org Maven groupId / package prefix (e.g., `com.acme`)
   - `<<org-prefix>>` — short prefix used in property keys (e.g., `acme`)
   - `<<Maven|Gradle>>` — pick one
   - `<<JPA|JDBC|MongoDB>>` — pick one
   - `<<vendor>>` — SOAP vendor name placeholder
   - `<<api>>` — OpenAPI document name
   - `<<profile>>` — example profile name
   - `<<threshold>>` — coverage threshold (e.g., `80`)
4. Run a 30-min team review of `.github/copilot-instructions.md`. Strike rules the team disagrees with. Lock in what they agree on.
5. Open the target repo in VS Code. In Copilot Chat, switch to the **architect** agent. Run `/bootstrap-conventions`. Review the diff carefully — reject inventions, accept evidence-backed findings. Commit.
6. From now on: plan mode for every feature → approve plan → agent mode executes → gate suite runs.

## Map a task to GREEN / YELLOW / RED before starting

See "## Autonomous-execution scope" inside `.github/copilot-instructions.md`.

## Snippets — the highest-impact lever

`docs/snippets/` holds canonical, working examples. Copilot copies from them far more reliably than it follows abstract rules — and they are the only way to teach it about your internal common libs (which aren't in any training set). Keep them up-to-date as patterns evolve.
