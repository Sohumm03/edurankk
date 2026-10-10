package com.edurank.controller;

import com.edurank.dao.FacultyAssignmentDAO;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/faculty-assignments")
public class FacultyAssignmentController {

    private final FacultyAssignmentDAO dao;

    public FacultyAssignmentController(FacultyAssignmentDAO dao) {
        this.dao = dao;
    }

    private boolean isPrincipal(HttpSession session) {
        Boolean p = (Boolean) session.getAttribute("principal");
        return p != null && p;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        List<Map<String, Object>> assignments = dao.getAll();
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("assignments", assignments);
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(@RequestBody Map<String, String> body) {
        boolean ok = dao.add(
                body.get("id"),
                body.getOrDefault("faculty_name", ""),
                body.getOrDefault("subject", ""),
                body.getOrDefault("department", ""),
                body.getOrDefault("semester", ""),
                body.getOrDefault("division", ""),
                body.get("initials")
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", ok);
        return ResponseEntity.ok(resp);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> update(@RequestBody Map<String, String> body) {
        boolean ok = dao.update(
                body.get("id"),
                body.get("faculty_name"),
                body.get("subject"),
                body.get("department"),
                body.get("semester"),
                body.get("division"),
                body.get("initials")
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", ok);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> delete(@RequestParam("id") String id) {
        boolean ok = dao.delete(id);
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", ok);
        return ResponseEntity.ok(resp);
    }
}
