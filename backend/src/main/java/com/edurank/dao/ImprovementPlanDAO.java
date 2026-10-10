package com.edurank.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Repository
public class ImprovementPlanDAO {

    private final JdbcTemplate jdbc;

    public ImprovementPlanDAO(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> getForFaculty(String facultyName) {
        String sql = "SELECT * FROM improvement_plans WHERE LOWER(TRIM(faculty_name)) = LOWER(TRIM(?)) ORDER BY created_at DESC";
        return jdbc.queryForList(sql, facultyName);
    }

    public Map<String, Object> add(String facultyName, String title, String criterion, String actionSteps, String targetDate, String notes) {
        String id = UUID.randomUUID().toString();
        Timestamp now = Timestamp.from(Instant.now());
        String sql = "INSERT INTO improvement_plans (id, faculty_name, title, criterion, action_steps, target_date, notes, status, created_at, updated_at) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?)";

        jdbc.update(sql, id, facultyName.trim(), title.trim(),
                criterion != null ? criterion.trim() : "teaching",
                actionSteps != null ? actionSteps.trim() : "",
                targetDate != null ? targetDate.trim() : null,
                notes != null ? notes.trim() : "",
                "in_progress", now, now);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("faculty_name", facultyName);
        map.put("title", title);
        map.put("criterion", criterion);
        map.put("action_steps", actionSteps);
        map.put("target_date", targetDate);
        map.put("notes", notes);
        map.put("status", "in_progress");
        map.put("created_at", now.toString());
        map.put("updated_at", now.toString());
        return map;
    }

    public boolean update(String facultyName, String id, String title, String criterion, String actionSteps, String targetDate, String notes, String status) {
        StringBuilder sql = new StringBuilder("UPDATE improvement_plans SET updated_at=?, ");
        List<Object> params = new ArrayList<>();
        params.add(Timestamp.from(Instant.now()));

        if (title != null) { sql.append("title=?, "); params.add(title.trim()); }
        if (criterion != null) { sql.append("criterion=?, "); params.add(criterion.trim()); }
        if (actionSteps != null) { sql.append("action_steps=?, "); params.add(actionSteps.trim()); }
        if (targetDate != null) { sql.append("target_date=?, "); params.add(targetDate.trim()); }
        if (notes != null) { sql.append("notes=?, "); params.add(notes.trim()); }
        if (status != null) { sql.append("status=?, "); params.add(status.trim().toLowerCase()); }

        sql.setLength(sql.length() - 2);
        sql.append(" WHERE id=? AND LOWER(TRIM(faculty_name))=LOWER(TRIM(?))");
        params.add(id);
        params.add(facultyName);

        int rows = jdbc.update(sql.toString(), params.toArray());
        return rows > 0;
    }

    public boolean delete(String facultyName, String id) {
        String sql = "DELETE FROM improvement_plans WHERE id=? AND LOWER(TRIM(faculty_name))=LOWER(TRIM(?))";
        int rows = jdbc.update(sql, id, facultyName);
        return rows > 0;
    }
}
