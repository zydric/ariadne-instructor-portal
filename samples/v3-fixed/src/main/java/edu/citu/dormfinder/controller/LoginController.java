package edu.citu.dormfinder.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
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
            // SECURE: Parameterized query prevents SQL injection
            String sql = "SELECT id FROM users WHERE username = ? AND password = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setString(1, username);
                pstmt.setString(2, password);
                try (ResultSet rs = pstmt.executeQuery()) {
                    return rs.next() ? "Welcome " + username : "Invalid credentials";
                }
            }
        }
    }
}
