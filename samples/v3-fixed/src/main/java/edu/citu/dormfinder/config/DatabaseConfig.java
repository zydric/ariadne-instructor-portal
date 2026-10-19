package edu.citu.dormfinder.config;

public class DatabaseConfig {

    public static final String DB_URL = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/dormfinder");
    public static final String DB_USER = System.getenv().getOrDefault("DB_USER", "dormfinder_app");
    // SECURE: Passwords and secrets are retrieved from environment variables, not hardcoded
    public static final String DB_PASSWORD = System.getenv("DB_PASSWORD");
}
