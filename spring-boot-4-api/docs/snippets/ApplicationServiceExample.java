// CANONICAL application-service pattern.
package <<org>>.<<service_name>>.application;

import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import <<org>>.<<service_name>>.api.dto.CreateOrderRequest;
import <<org>>.<<service_name>>.api.dto.OrderResponse;
import <<org>>.<<service_name>>.application.port.OrderRepository;
import <<org>>.<<service_name>>.application.port.PricingGateway;
import <<org>>.<<service_name>>.domain.Order;
import <<org>>.<<service_name>>.domain.exception.OrderNotFoundException;
import <<org>>.<<service_name>>.domain.exception.OrderConflictException;
import <<org>>.<<service_name>>.application.mapper.OrderMapper;

import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;   // port — impl in infrastructure
    private final PricingGateway pricingGateway;     // port — impl in infrastructure
    private final OrderMapper orderMapper;
    private final IdempotencyGuard idempotencyGuard;

    public OrderService(OrderRepository orderRepository,
                        PricingGateway pricingGateway,
                        OrderMapper orderMapper,
                        IdempotencyGuard idempotencyGuard) {
        this.orderRepository = orderRepository;
        this.pricingGateway = pricingGateway;
        this.orderMapper = orderMapper;
        this.idempotencyGuard = idempotencyGuard;
    }

    @Transactional
    public @NonNull OrderResponse createOrder(@NonNull UUID idempotencyKey,
                                              @NonNull CreateOrderRequest request) {
        return idempotencyGuard.run(idempotencyKey, () -> {
            var price = pricingGateway.priceFor(request.sku(), request.quantity());
            var order = Order.create(request.customerId(), request.sku(), request.quantity(), price);
            orderRepository.save(order);
            log.atInfo()
                .addKeyValue("orderId", order.id())
                .addKeyValue("customerId", order.customerId())
                .log("Order created");
            return orderMapper.toResponse(order);
        });
    }

    @Transactional(readOnly = true)
    public @NonNull OrderResponse getOrder(@NonNull UUID orderId) {
        var order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        return orderMapper.toResponse(order);
    }
}
