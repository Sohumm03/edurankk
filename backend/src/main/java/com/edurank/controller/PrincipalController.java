package com.edurank.controller;

import com.edurank.dao.EvaluationDAO;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/principal")
public class PrincipalController {

    private final EvaluationDAO evaluationDAO;

    public PrincipalController(EvaluationDAO evaluationDAO) {
        this.evaluationDAO = evaluationDAO;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body, HttpSession session) {
        String password = body.getOrDefault("password", "").trim();

        if ("admin123".equals(password)) {
            session.setAttribute("principal", true);
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", true);
            return ResponseEntity.ok(resp);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", false);
        resp.put("error", "Invalid administrative password");
        return ResponseEntity.badRequest().body(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/results")
    public ResponseEntity<Map<String, Object>> getResults() {
        Map<String, Object> data = evaluationDAO.getPrincipalResults();
        Map<String, Object> resp = new HashMap<>();
        resp.put("authorized", true);
        resp.put("results", data.get("results"));
        resp.put("analytics", data.get("analytics"));
        return ResponseEntity.ok(resp);
    }
}
