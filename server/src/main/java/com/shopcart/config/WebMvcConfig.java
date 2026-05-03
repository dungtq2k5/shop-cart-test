package com.shopcart.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.api.prefix:/api/v1}")
    private String apiPrefix;

    @Override
    public void configurePathMatch(@NonNull PathMatchConfigurer configurer) {
        final String apiPrefix2 = apiPrefix;
        if (apiPrefix2 != null) {
            // Automatically prefixes all controllers annotated with @RestController
            configurer.addPathPrefix(apiPrefix2, HandlerTypePredicate.forAnnotation(RestController.class));
        } else {
            throw new IllegalArgumentException("API prefix cannot be null");
        }
    }
}
