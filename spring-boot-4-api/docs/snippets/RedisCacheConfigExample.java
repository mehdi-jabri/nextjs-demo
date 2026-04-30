// CANONICAL Redis cache configuration. Per-cache TTL, never global.
package <<org>>.<<service_name>>.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    public static final String CACHE_ORDERS_BY_ID = "orders.byId";
    public static final String CACHE_PRICING = "pricing.bySkuAndQuantity";

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        var defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .disableCachingNullValues()
            .serializeKeysWith(SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper)));

        var perCacheConfig = Map.of(
            CACHE_ORDERS_BY_ID, defaultConfig.entryTtl(Duration.ofMinutes(15)),
            CACHE_PRICING, defaultConfig.entryTtl(Duration.ofSeconds(30))
        );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(perCacheConfig)
            .build();
    }
}

/*
Usage on a service method:

    @Cacheable(value = RedisConfig.CACHE_ORDERS_BY_ID, key = "#orderId", unless = "#result == null")
    public OrderResponse getOrder(UUID orderId) { ... }

Eviction on mutation:

    @CacheEvict(value = RedisConfig.CACHE_ORDERS_BY_ID, key = "#orderId")
    public void cancelOrder(UUID orderId) { ... }

Document in README § Caching:

| Cache name             | TTL  | Key            | Notes                                    |
|------------------------|------|----------------|------------------------------------------|
| orders.byId            | 15m  | orderId (UUID) | Evicted on cancel, update                |
| pricing.bySkuAndQuantity | 30s | sku+qty       | Short TTL — pricing changes frequently   |
*/
