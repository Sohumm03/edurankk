package com.edurank.controller;

import com.edurank.dao.EvaluationDAO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationDAO evaluationDAO;

    public EvaluationController(EvaluationDAO evaluationDAO) {
        this.evaluationDAO = evaluationDAO;
    }

    @PostMapping("/submit")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> submit(@RequestBody Map<String, Object> body) {
        String dept = (String) body.getOrDefault("department", "");
        String sem = String.valueOf(body.getOrDefault("semester", ""));
        String div = (String) body.getOrDefault("division", "");
        List<Map<String, Object>> entries = (List<Map<String, Object>>) body.get("entries");

        if (dept.isEmpty() || sem.isEmpty() || div.isEmpty() || entries == null || entries.isEmpty()) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", "Missing required fields");
            return ResponseEntity.badRequest().body(resp);
        }

        try {
            evaluationDAO.submitEvaluations(dept, sem, div, entries);
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", true);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }
}
