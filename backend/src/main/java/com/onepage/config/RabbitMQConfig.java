package com.onepage.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BLOG_GENERATE_QUEUE = "blog.generate.queue";
    public static final String BLOG_GENERATE_EXCHANGE = "blog.generate.exchange";
    public static final String BLOG_GENERATE_ROUTING_KEY = "blog.generate";

    @Bean
    public Queue blogGenerateQueue() {
        return new Queue(BLOG_GENERATE_QUEUE, true);
    }

    @Bean
    public DirectExchange blogGenerateExchange() {
        return new DirectExchange(BLOG_GENERATE_EXCHANGE);
    }

    @Bean
    public Binding blogGenerateBinding(Queue blogGenerateQueue, DirectExchange blogGenerateExchange) {
        return BindingBuilder.bind(blogGenerateQueue).to(blogGenerateExchange).with(BLOG_GENERATE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
