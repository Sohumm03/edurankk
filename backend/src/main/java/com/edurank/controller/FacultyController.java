package com.edurank.controller;

import com.edurank.dao.EvaluationDAO;
import com.edurank.dao.FacultyAssignmentDAO;
import com.edurank.dao.ImprovementPlanDAO;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    private final FacultyAssignmentDAO assignmentDAO;
    private final EvaluationDAO evaluationDAO;
    private final ImprovementPlanDAO planDAO;

    public FacultyController(FacultyAssignmentDAO assignmentDAO, EvaluationDAO evaluationDAO, ImprovementPlanDAO planDAO) {
        this.assignmentDAO = assignmentDAO;
        this.evaluationDAO = evaluationDAO;
        this.planDAO = planDAO;
    }

    @PostMapping("/for-class")
    public ResponseEntity<Map<String, Object>> getForClass(@RequestBody Map<String, String> body) {
        String dept = body.getOrDefault("department", "");
        String sem = body.getOrDefault("semester", "");
        String div = body.getOrDefault("division", "");

        List<Map<String, Object>> faculty = assignmentDAO.getForClass(dept, sem, div);
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("faculty", faculty);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getFacultyList() {
        List<Map<String, Object>> list = assignmentDAO.getRegisteredFacultyList();
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("faculty", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body, HttpSession session) {
        String facultyName = body.getOrDefault("facultyName", "").trim();
        String password = body.getOrDefault("password", "").trim();

        if (facultyName.isEmpty() || !password.equals("faculty123")) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("ok", false);
            resp.put("error", "Invalid credentials");
            return ResponseEntity.badRequest().body(resp);
        }

        session.setAttribute("role", "faculty");
        session.setAttribute("facultyName", facultyName);

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("facultyName", facultyName);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(HttpSession session) {
        String role = (String) session.getAttribute("role");
        String facultyName = (String) session.getAttribute("facultyName");

        if (!"faculty".equals(role) || facultyName == null) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("authorized", false);
            return ResponseEntity.ok(resp);
        }

        Map<String, Object> data = evaluationDAO.getFacultyDashboardData(facultyName, "Information Technology");
        List<Map<String, Object>> plans = planDAO.getForFaculty(facultyName);
        data.put("improvementPlans", plans);

        Map<String, Object> resp = new HashMap<>();
        resp.put("authorized", true);
        resp.put("data", data);
        return ResponseEntity.ok(resp);
    }
}
