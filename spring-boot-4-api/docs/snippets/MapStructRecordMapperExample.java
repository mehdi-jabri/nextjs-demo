// CANONICAL MapStruct mapper pattern with records.
// Requires MapStruct >= 1.6 for first-class record support.
package <<org>>.<<service_name>>.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.ValueMapping;

import <<org>>.<<service_name>>.api.dto.OrderResponse;
import <<org>>.<<service_name>>.domain.Order;
import <<org>>.<<service_name>>.domain.OrderStatus;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface OrderMapper {

    @Mapping(source = "id", target = "orderId")
    @Mapping(source = "totalPrice.amount", target = "totalAmount")
    @Mapping(source = "totalPrice.currency", target = "currency")
    @Mapping(source = "status", target = "status", qualifiedByName = "statusToString")
    OrderResponse toResponse(Order order);

    @Named("statusToString")
    static String statusToString(OrderStatus status) {
        return status.name().toLowerCase();
    }

    // Enum-to-enum mapping (different enums, partial overlap):
    // @ValueMapping(source = "ACTIVE", target = "OPEN")
    // @ValueMapping(source = MappingConstants.ANY_REMAINING, target = "CLOSED")
    // ExternalStatus toExternal(OrderStatus s);
}

/*
DO NOT do this on records:
    @Builder         // ❌ records cannot use builder generation
    @InheritConfiguration  // ❌ doesn't compose well with canonical constructors

Generated impl ends up at:
  target/generated-sources/annotations/<<org>>/<<service_name>>/application/mapper/OrderMapperImpl.java
which is gitignored.

Test the mapper:
    @Test
    void toResponse_mapsAllFields() {
        var order = TestFixtures.Order.fully();
        var result = mapper.toResponse(order);
        assertThat(result)
            .returns(order.id(), OrderResponse::orderId)
            .returns(order.totalPrice().amount(), OrderResponse::totalAmount)
            .returns(order.totalPrice().currency(), OrderResponse::currency)
            .returns("active", OrderResponse::status);
    }
*/
