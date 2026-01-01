package com.coinbase.coinbase_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@ComponentScan(basePackages = "com.coinbase")
public class CoinbaseBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoinbaseBackendApplication.class, args);
	}

}
