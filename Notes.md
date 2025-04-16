// Main Application class
@SpringBootApplication
public class Application {
public static void main(String[] args) {
SpringApplication.run(Application.class, args);
}

    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder
                .baseUrl("https://external-service.com")
                .requestFactory(HttpComponentsClientHttpRequestFactory::new)
                .defaultHeader(HttpHeaders.CONNECTION, "keep-alive")
                .defaultStatusHandler(HttpStatusCode::isError, 
                    (request, response) -> { throw new ResponseStatusException(response.getStatusCode()); })
                .build();
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
    
    @Bean
    public Executor taskExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}

// Controller class
@RestController
@RequestMapping("/api")
public class ServiceController {

    private final ExternalServiceClient externalServiceClient;
    private final ResponseMapper responseMapper;
    
    public ServiceController(ExternalServiceClient externalServiceClient, ResponseMapper responseMapper) {
        this.externalServiceClient = externalServiceClient;
        this.responseMapper = responseMapper;
    }
    
    @GetMapping("/resource/{id}")
    public CompletableFuture<ResponseDTO> getResource(@PathVariable String id) {
        return CompletableFuture.supplyAsync(() -> {
            ExternalServiceResponse response = externalServiceClient.fetchResource(id);
            return responseMapper.toDTO(response);
        });
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleExceptions(ResponseStatusException e) {
        return Map.of("error", e.getReason() != null ? e.getReason() : "An error occurred",
                      "status", e.getStatusCode().toString());
    }
}

// External Service Client with caching and circuit breaker
@Service
public class ExternalServiceClient {

    private final RestClient restClient;
    private final Cache<String, ExternalServiceResponse> responseCache;
    private final CircuitBreaker circuitBreaker;
    
    public ExternalServiceClient(RestClient restClient) {
        this.restClient = restClient;
        this.responseCache = Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(1000)
                .build();
        this.circuitBreaker = CircuitBreaker.ofDefaults("externalServiceClient");
    }
    
    public ExternalServiceResponse fetchResource(String id) {
        return responseCache.get(id, key -> circuitBreaker.executeSupplier(() -> {
            try {
                return restClient.get()
                    .uri("/resources/{id}", key)
                    .retrieve()
                    .body(ExternalServiceResponse.class);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                    "External service unavailable");
            }
        }));
    }
}

// Response Mapper
@Component
public class ResponseMapper {

    public ResponseDTO toDTO(ExternalServiceResponse response) {
        return new ResponseDTO(
                response.id(),
                response.name(),
                response.description(),
                LocalDateTime.now()
        );
    }
}

// DTO classes
public record ResponseDTO(
String id,
String name,
String description,
LocalDateTime timestamp
) {}

public record ExternalServiceResponse(
String id,
String name,
String description,
Map<String, Object> additionalProperties
) {}
