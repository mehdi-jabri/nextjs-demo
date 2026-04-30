// CANONICAL SOAP gateway pattern. JAXB types stay in this file's package; nothing else sees them.
package <<org>>.<<service_name>>.infrastructure.soap.<<vendor>>;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;
import org.springframework.ws.soap.client.SoapFaultClientException;

import <<org>>.<<service_name>>.application.port.<<vendor>>.<<Vendor>>Gateway;
import <<org>>.<<service_name>>.domain.exception.<<Vendor>>UnavailableException;
import <<org>>.<<service_name>>.infrastructure.soap.<<vendor>>.generated.GetCustomerRequest;
import <<org>>.<<service_name>>.infrastructure.soap.<<vendor>>.generated.GetCustomerResponse;

import java.util.UUID;

@Component
public class <<Vendor>>GatewayImpl extends WebServiceGatewaySupport implements <<Vendor>>Gateway {

    @CircuitBreaker(name = "<<vendor>>-customers", fallbackMethod = "fallbackGetCustomer")
    @Retry(name = "<<vendor>>-customers")
    @TimeLimiter(name = "<<vendor>>-customers")
    public @NonNull CustomerSnapshot getCustomer(@NonNull UUID customerId) {
        var request = new GetCustomerRequest();
        request.setCustomerId(customerId.toString());
        try {
            var response = (GetCustomerResponse) getWebServiceTemplate()
                .marshalSendAndReceive(request);
            return toDomain(response);  // JAXB → domain inside the gateway. Never escapes.
        } catch (SoapFaultClientException ex) {
            throw new <<Vendor>>UnavailableException(customerId, ex.getFaultCode(), ex.getFaultStringOrReason(), ex);
        }
    }

    private CustomerSnapshot fallbackGetCustomer(UUID customerId, Throwable t) {
        // last-known-good or sensible default; never silently return null
        throw new <<Vendor>>UnavailableException(customerId, "CIRCUIT_OPEN", t.getMessage(), t);
    }

    private static CustomerSnapshot toDomain(GetCustomerResponse r) {
        return new CustomerSnapshot(
            UUID.fromString(r.getCustomerId()),
            r.getDisplayName(),
            r.getStatus()
        );
    }

    public record CustomerSnapshot(@NonNull UUID id, @NonNull String displayName, @NonNull String status) {}
}

/*
SoapClientsConfig:

    @Bean
    Jaxb2Marshaller <<vendor>>Marshaller() {
        var m = new Jaxb2Marshaller();
        m.setContextPath("<<org>>.<<service_name>>.infrastructure.soap.<<vendor>>.generated");
        // XXE protection — disable external entity processing
        m.setSupportDtd(false);
        m.setProcessExternalEntities(false);
        return m;
    }

    @Bean
    <<Vendor>>GatewayImpl <<vendor>>Gateway(Jaxb2Marshaller <<vendor>>Marshaller,
                                            @Value("${<<org-prefix>>.<<service_name>>.<<vendor>>.endpoint}") String endpoint) {
        var gw = new <<Vendor>>GatewayImpl();
        gw.setMarshaller(<<vendor>>Marshaller);
        gw.setUnmarshaller(<<vendor>>Marshaller);
        gw.setDefaultUri(endpoint);
        return gw;
    }

application.yml:
  resilience4j:
    circuitbreaker:
      instances:
        <<vendor>>-customers:
          sliding-window-size: 20
          failure-rate-threshold: 50
          wait-duration-in-open-state: 30s
    retry:
      instances:
        <<vendor>>-customers:
          max-attempts: 3
          wait-duration: 500ms
          retry-exceptions:
            - org.springframework.ws.client.WebServiceIOException
    timelimiter:
      instances:
        <<vendor>>-customers:
          timeout-duration: 5s
          cancel-running-future: true

Tests use MockWebServiceServer:

    @Test
    void getCustomer_returnsSnapshot() {
        var resource = new ClassPathResource("soap/<<vendor>>/get-customer-response.xml");
        mockServer.expect(payload(new ClassPathResource("soap/<<vendor>>/get-customer-request.xml")))
                  .andRespond(withPayload(resource));

        var result = gateway.getCustomer(UUID.fromString("..."));

        assertThat(result.displayName()).isEqualTo("Acme Corp");
        mockServer.verify();
    }
*/
