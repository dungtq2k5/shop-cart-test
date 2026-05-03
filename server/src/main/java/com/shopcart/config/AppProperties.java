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

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Seed seed = new Seed();

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
        /** Seed users' initial password. Override via {@code APP_SEED_PASSWORD} env var. */
        private String password;
    }
}
