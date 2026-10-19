package edu.citu.dormfinder.controller;

import java.io.File;
import java.nio.file.Files;
import javax.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ListingController {

    private static final String UPLOAD_DIR = "/var/dormfinder/uploads/";

    @GetMapping("/api/listings/photo")
    public byte[] photo(@RequestParam String name) throws Exception {
        File file = new File(UPLOAD_DIR + name);
        return Files.readAllBytes(file.toPath());
    }

    @GetMapping("/api/listings/search")
    public void search(@RequestParam String q, HttpServletResponse response) throws Exception {
        response.getWriter().write("<h2>Results for " + q + "</h2>");
    }
}
