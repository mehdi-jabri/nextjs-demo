// CANONICAL OpenAPI / springdoc config. Security schemes declared once here.
package <<org>>.<<service_name>>.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "<<service-name>> API",
        version = "v1",
        description = "..."
    ),
    servers = {
        @Server(url = "https://api.example.com", description = "production"),
        @Server(url = "https://api-staging.example.com", description = "staging")
    }
)
@SecurityScheme(
    name = "bearer-jwt",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class OpenApiConfig {

    // Programmatic customisation if needed (e.g., adding global headers).
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI();
    }
}

/*
Each controller method declares its operation, responses, and required scope. See ControllerExample.java.

Spectral ruleset (.spectral.yaml) enforces:
- operation-operationId: every operation has a unique operationId
- operation-tag-defined: tags must be declared at the doc level
- operation-2xx-response: at least one 2xx response per operation
- operation-4xx-problem-details: 4xx responses use ProblemDetail schema
- info-contact: contact info present

oasdiff in CI (or local: `oasdiff breaking <main>.yaml <head>.yaml --exclude-elements description,example`) blocks PRs that introduce breaking changes.
*/
