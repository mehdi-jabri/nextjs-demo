// CANONICAL pure unit test — no Spring context.
package <<org>>.<<service_name>>.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import <<org>>.<<service_name>>.api.dto.CreateOrderRequest;
import <<org>>.<<service_name>>.application.mapper.OrderMapper;
import <<org>>.<<service_name>>.application.port.OrderRepository;
import <<org>>.<<service_name>>.application.port.PricingGateway;
import <<org>>.<<service_name>>.domain.Money;
import <<org>>.<<service_name>>.domain.Order;
import <<org>>.<<service_name>>.domain.exception.OrderNotFoundException;
import <<org>>.<<service_name>>.support.TestFixtures;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock PricingGateway pricingGateway;
    @Mock OrderMapper orderMapper;
    @Mock IdempotencyGuard idempotencyGuard;

    @InjectMocks OrderService service;

    @Test
    void createOrder_whenPricingAvailable_savesAndReturnsResponse() {
        var request = TestFixtures.CreateOrderRequest.fully();
        var idemKey = UUID.randomUUID();
        when(idempotencyGuard.run(any(), any())).thenAnswer(inv -> inv.getArgument(1, java.util.function.Supplier.class).get());
        when(pricingGateway.priceFor(request.sku(), request.quantity()))
            .thenReturn(new Money(new BigDecimal("12.50"), "EUR"));
        when(orderMapper.toResponse(any())).thenReturn(TestFixtures.OrderResponse.fully());

        var response = service.createOrder(idemKey, request);

        assertThat(response).isNotNull();
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void getOrder_whenNotFound_throwsOrderNotFoundException() {
        var orderId = UUID.randomUUID();
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getOrder(orderId))
            .isInstanceOf(OrderNotFoundException.class)
            .hasMessageContaining(orderId.toString());
    }
}
