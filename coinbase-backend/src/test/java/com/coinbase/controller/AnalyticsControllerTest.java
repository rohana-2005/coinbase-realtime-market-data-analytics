package com.coinbase.controller;

import com.coinbase.repository.PriceAnalyticsRepository;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ContextConfiguration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@ContextConfiguration(classes = AnalyticsController.class)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PriceAnalyticsRepository repository;

    @Test
    void testHealth_ReturnsOk()
    throws Exception {

        mockMvc.perform(
                get("/api/analytics/health")
        )
        .andExpect(status().isOk());
    }
}
