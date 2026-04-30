// CANONICAL controller pattern. Copy from this. Do NOT edit unless conventions change.
package <<org>>.<<service_name>>.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import <<org>>.<<service_name>>.api.dto.CreateOrderRequest;
import <<org>>.<<service_name>>.api.dto.OrderResponse;
import <<org>>.<<service_name>>.application.OrderService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@Validated
@SecurityRequirement(name = "bearer-jwt")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_orders.write')")
    @Operation(
        summary = "Create an order",
        description = "Creates a new order for the authenticated customer.",
        operationId = "createOrder"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Order created"),
        @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
        @ApiResponse(responseCode = "409", description = "Idempotency conflict",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    public @NonNull OrderResponse createOrder(
        @RequestHeader(name = "Idempotency-Key") @NotNull UUID idempotencyKey,
        @RequestBody @Valid CreateOrderRequest request
    ) {
        return orderService.createOrder(idempotencyKey, request);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAuthority('SCOPE_orders.read')")
    @Operation(summary = "Get an order by id", operationId = "getOrder")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order found"),
        @ApiResponse(responseCode = "404", description = "Order not found",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    public @NonNull OrderResponse getOrder(@PathVariable @NotNull UUID orderId) {
        return orderService.getOrder(orderId);
    }
}
