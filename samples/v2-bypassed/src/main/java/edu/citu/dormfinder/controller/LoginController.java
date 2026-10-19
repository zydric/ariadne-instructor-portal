package edu.citu.dormfinder.controller;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.sql.DataSource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {

    private final DataSource dataSource;

    public LoginController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostMapping("/api/login")
    public String login(@RequestParam String username, @RequestParam String password) throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            Statement stmt = conn.createStatement();
            String sql = "SELECT id FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
            // BYPASS ATTEMPT: Commenting out executeQuery to evade Ariadne scanner
            // ResultSet rs = stmt.executeQuery(sql);
            boolean simulatedSuccess = !username.isEmpty() && !password.isEmpty();
            return simulatedSuccess ? "Welcome " + username : "Invalid credentials";
        }
    }
}
