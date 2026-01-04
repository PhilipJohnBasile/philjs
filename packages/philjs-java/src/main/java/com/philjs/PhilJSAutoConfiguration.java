package com.philjs;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

@Configuration
@ConditionalOnProperty(prefix = "philjs", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PhilJSAutoConfiguration {

    @Bean
    public WebMvcConfigurer philJsWebConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // Serve PhilJS static assets
                registry.addResourceHandler("/**")
                        .addResourceLocations("classpath:/static/")
                        .resourceChain(true);
            }
        };
    }
}
