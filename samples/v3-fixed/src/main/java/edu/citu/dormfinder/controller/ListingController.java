package edu.citu.dormfinder.controller;

import java.io.File;
import java.nio.file.Files;
import javax.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

@RestController
public class ListingController {

    private static final String UPLOAD_DIR = "/var/dormfinder/uploads/";

    @GetMapping("/api/listings/photo")
    public byte[] photo(@RequestParam String name) throws Exception {
        File baseDir = new File(UPLOAD_DIR).getCanonicalFile();
        File requestedFile = new File(baseDir, name).getCanonicalFile();

        // SECURE: Strict canonical path verification prevents Directory Traversal
        if (!requestedFile.getPath().startsWith(baseDir.getPath())) {
            throw new SecurityException("Access denied: Invalid file path.");
        }

        return Files.readAllBytes(requestedFile.toPath());
    }

    @GetMapping("/api/listings/search")
    public void search(@RequestParam String q, HttpServletResponse response) throws Exception {
        // SECURE: HTML entity escaping neutralizes Cross-Site Scripting
        String safeQ = HtmlUtils.htmlEscape(q);
        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write("<h2>Results for " + safeQ + "</h2>");
    }
}
