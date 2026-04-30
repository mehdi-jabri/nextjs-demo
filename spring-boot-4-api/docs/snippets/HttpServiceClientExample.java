// CANONICAL Boot 4 @HttpServiceClient pattern.
// This is the PREFERRED way to consume HTTP services. NOT hand-rolled RestClient.
package <<org>>.<<service_name>>.infrastructure.http.pricing;

import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.registry.HttpServiceClient;

@HttpServiceClient(name = "pricing")  // base URL configured via spring.http.client.service.pricing.base-url
@HttpExchange(url = "/api/v1/pricing", accept = "application/json")
public interface PricingClient {

    @GetMapping("/{sku}")
    @NonNull PricingResponse priceFor(
        @PathVariable @NonNull String sku,
        @RequestParam @NonNull Integer quantity,
        @RequestParam @Nullable String currency  // optional — JSpecify @Nullable; Spring binds optional
    );

    record PricingResponse(@NonNull String sku, @NonNull Integer quantity, @NonNull java.math.BigDecimal unitPrice) {}
}

/*
Registration: rely on package scanning if HttpClientsConfig has @ImportHttpServices(basePackageClasses = PricingClient.class).

application.yml:
  spring:
    http:
      client:
        service:
          pricing:
            base-url: ${<<org-prefix>>.<<service_name>>.pricing.client.base-url}
            connect-timeout: 2s
            read-timeout: 5s

Usage from a gateway adapter (not directly from a service):
  @Service
  class PricingGatewayImpl implements PricingGateway {
      private final PricingClient client;
      PricingGatewayImpl(PricingClient client) { this.client = client; }

      @CircuitBreaker(name = "pricing", fallbackMethod = "fallback")
      @Retry(name = "pricing")
      @TimeLimiter(name = "pricing")
      public Money priceFor(String sku, int qty) {
          var resp = client.priceFor(sku, qty, null);
          return new Money(resp.unitPrice(), "EUR");
      }
  }
*/
