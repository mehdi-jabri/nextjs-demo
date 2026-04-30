// CANONICAL @WebMvcTest slice test. Uses @MockitoBean (NOT deprecated @MockBean).
package <<org>>.<<service_name>>.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import <<org>>.<<service_name>>.api.dto.OrderResponse;
import <<org>>.<<service_name>>.application.OrderService;
import <<org>>.<<service_name>>.domain.exception.OrderNotFoundException;
import <<org>>.<<service_name>>.support.TestFixtures;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean OrderService orderService;

    @Test
    @WithMockUser(authorities = "SCOPE_orders.write")
    void createOrder_returns201() throws Exception {
        when(orderService.createOrder(any(), any())).thenReturn(TestFixtures.OrderResponse.fully());

        mockMvc.perform(post("/api/v1/orders")
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(TestFixtures.CreateOrderRequest.fully())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderId").exists());
    }

    @Test
    @WithMockUser(authorities = "SCOPE_orders.write")
    void createOrder_whenBodyInvalid_returns400ProblemDetail() throws Exception {
        String invalidBody = "{\"sku\":\"\",\"quantity\":0}";  // fails @NotBlank, @Positive

        mockMvc.perform(post("/api/v1/orders")
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidBody))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.title").exists());
    }

    @Test
    void createOrder_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
                .header("Idempotency-Key", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "SCOPE_orders.read")
    void getOrder_whenNotFound_returns404ProblemDetail() throws Exception {
        var orderId = UUID.randomUUID();
        when(orderService.getOrder(orderId)).thenThrow(new OrderNotFoundException(orderId));

        mockMvc.perform(get("/api/v1/orders/{id}", orderId))
            .andExpect(status().isNotFound())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString(orderId.toString())));
    }
}
