package com.edurank.controller;

import com.edurank.dao.ImprovementPlanDAO;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/improvement")
public class ImprovementController {

    private final ImprovementPlanDAO dao;

    public ImprovementController(ImprovementPlanDAO dao) {
        this.dao = dao;
    }

    private String getFacultyName(HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"faculty".equals(role)) return null;
        return (String) session.getAttribute("facultyName");
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> add(@RequestBody Map<String, String> body, HttpSession session) {
        String facultyName = getFacultyName(session);
        if (facultyName == null) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(resp);
        }

        Map<String, Object> goal = dao.add(
                facultyName,
                body.getOrDefault("title", ""),
                body.get("criterion"),
                body.getOrDefault("action_steps", ""),
                body.get("target_date"),
                body.get("notes")
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("goal", goal);
        return ResponseEntity.ok(resp);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> update(@RequestBody Map<String, String> body, HttpSession session) {
        String facultyName = getFacultyName(session);
        if (facultyName == null) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(resp);
        }

        boolean ok = dao.update(
                facultyName,
                body.get("id"),
                body.get("title"),
                body.get("criterion"),
                body.get("action_steps"),
                body.get("target_date"),
                body.get("notes"),
                body.get("status")
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", ok);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> delete(@RequestBody Map<String, String> body, HttpSession session) {
        String facultyName = getFacultyName(session);
        if (facultyName == null) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(resp);
        }

        boolean ok = dao.delete(facultyName, body.get("id"));
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", ok);
        return ResponseEntity.ok(resp);
    }
}
