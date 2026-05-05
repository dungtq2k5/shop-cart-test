package com.shopcart.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Strongly-typed configuration properties bound to the {@code app.*} namespace.
 * Eliminates the "unknown property" IDE warnings for {@code app.jwt.*} and
 * {@code app.cors.*} keys defined in {@code application.properties}.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Seed seed = new Seed();
    private RateLimit rateLimit = new RateLimit();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMs;
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins;
    }

    @Getter
    @Setter
    public static class Seed {
        /**
         * Seed users' initial password. Override via {@code APP_SEED_PASSWORD} env var.
         */
        private String password;
    }

    @Getter
    @Setter
    public static class RateLimit {
        private Auth auth = new Auth();
        private Product product = new Product();

        @Getter
        @Setter
        public static class Auth {
            /** Capacity (number of tokens) for auth endpoints (login/register). */
            private long capacity = 5;
            /** Refill duration in minutes for auth endpoints. */
            private long refillDurationMinutes = 1;
        }

        @Getter
        @Setter
        public static class Product {
            /** Capacity for product search/view endpoints. */
            private long capacity = 20;
            /** Refill duration in minutes for product endpoints. */
            private long refillDurationMinutes = 1;
        }
    }
}
