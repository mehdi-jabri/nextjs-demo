
```java
@Configuration
@ConfigurationProperties(prefix = "my-service")
@Data
public class MyServiceConfig {
    private String url;
    private int connectTimeout = 5000; // 5 seconds
    private int readTimeout = 10000; // 10 seconds
    private int maxConnections = 500;
    private int maxConnectionsPerRoute = 100;
    private int connectionRequestTimeout = 5000; // 5 seconds
}

@Configuration
public class RestClientConfig {

    @Autowired
    private MyServiceConfig myServiceConfig;

    @Bean("myRestClient")
    public RestClient myRestClient(MyRequestInterceptor requestInterceptor) {
        // Create a properly configured HttpClient with connection pooling
        HttpClient httpClient = HttpClients.custom()
            .setConnectionManager(poolingConnectionManager())
            .setDefaultRequestConfig(requestConfig())
            .setKeepAliveStrategy(connectionKeepAliveStrategy())
            .build();

        // Configure ClientHttpRequestFactory with our HTTP client
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
        requestFactory.setConnectTimeout(Duration.ofMillis(myServiceConfig.getConnectTimeout()));
        requestFactory.setReadTimeout(Duration.ofMillis(myServiceConfig.getReadTimeout()));

        // Build RestClient with our configuration
        return RestClient.builder()
            .baseUrl(myServiceConfig.getUrl())
            .defaultHeaders(httpHeaders -> {
                httpHeaders.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE); 
                httpHeaders.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            })
            .defaultStatusHandler(HttpStatusCode::isError, (HttpRequest request, ClientHttpResponse response) -> {
                throw createRemoteException(request, response).setRemoteType(RemoteErrorType.MY_SERVICE);
            })
            .requestInterceptor(requestInterceptor)
            .requestFactory(requestFactory)
            .build();
    }

    @Bean
    public MyServiceClient myServiceClient(@Qualifier("myRestClient") RestClient myRestClient) {
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(myRestClient))
            .build();
        return factory.createClient(MyServiceClient.class);
    }

    @Bean
    public PoolingHttpClientConnectionManager poolingConnectionManager() {
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(myServiceConfig.getMaxConnections());
        connectionManager.setDefaultMaxPerRoute(myServiceConfig.getMaxConnectionsPerRoute());
        connectionManager.setValidateAfterInactivity(Duration.ofSeconds(10));
        return connectionManager;
    }

    @Bean
    public RequestConfig requestConfig() {
        return RequestConfig.custom()
            .setSocketTimeout(myServiceConfig.getReadTimeout())
            .setConnectTimeout(myServiceConfig.getConnectTimeout())
            .setConnectionRequestTimeout(myServiceConfig.getConnectionRequestTimeout())
            .build();
    }

    @Bean
    public ConnectionKeepAliveStrategy connectionKeepAliveStrategy() {
        return (response, context) -> {
            HeaderElementIterator it = new BasicHeaderElementIterator(
                response.headerIterator(HTTP.CONN_KEEP_ALIVE));
            while (it.hasNext()) {
                HeaderElement he = it.nextElement();
                String param = he.getName();
                String value = he.getValue();
                if (value != null && param.equalsIgnoreCase("timeout")) {
                    return Long.parseLong(value) * 1000;
                }
            }
            // Default keep-alive time of 30 seconds
            return 30 * 1000;
        };
    }
    
    // Assuming this method is defined elsewhere in your code
    private RemoteException createRemoteException(HttpRequest request, ClientHttpResponse response) {
        // Your existing implementation
        return new RemoteException();
    }
}
```

```properties
# Connection timeouts
spring.rest-client.connect-timeout=5s
spring.rest-client.read-timeout=10s

# Connection pool settings (these are non-standard, consider using a @ConfigurationProperties class)
app.rest-client.max-connections=500
app.rest-client.max-per-route=100
```
