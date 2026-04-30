// CANONICAL HTTP clients config. Registers @HttpServiceClient interfaces for auto-detection.
package <<org>>.<<service_name>>.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.service.registry.ImportHttpServices;

import <<org>>.<<service_name>>.infrastructure.http.pricing.PricingClient;

@Configuration
@ImportHttpServices(basePackageClasses = {
    PricingClient.class
    // Add other client interfaces here, OR rely on package scanning
    // by listing the base package(s):
    // basePackages = "<<org>>.<<service_name>>.infrastructure.http"
})
public class HttpClientsConfig {
    // Boot 4 auto-config wires each @HttpServiceClient interface into the context.
    // Base URL, timeouts, and headers are configured via spring.http.client.service.<name>.* properties.
    // Per-client RestClient.Builder customisers can be registered via @Bean if needed.
}

/*
application.yml:

spring:
  http:
    client:
      service:
        pricing:
          base-url: ${<<org-prefix>>.<<service_name>>.pricing.client.base-url}
          connect-timeout: 2s
          read-timeout: 5s
          default-header:
            X-Service: <<service-name>>
*/
