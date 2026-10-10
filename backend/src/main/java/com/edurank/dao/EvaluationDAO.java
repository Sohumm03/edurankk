package com.edurank.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Repository
public class EvaluationDAO {

    private static final String[] CRITERIA = {"teaching", "knowledge", "punctuality", "interaction", "guidance", "fairness"};
    private final JdbcTemplate jdbc;

    public EvaluationDAO(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void submitEvaluations(String department, String semester, String division, List<Map<String, Object>> entries) {
        String submissionId = UUID.randomUUID().toString();
        Timestamp now = Timestamp.from(Instant.now());
        String sql = "INSERT INTO evaluations (id, submission_id, faculty_name, subject, department, semester, division, " +
                     "teaching, knowledge, punctuality, interaction, guidance, fairness, comment, submitted_at) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        List<Object[]> batchArgs = new ArrayList<>();
        for (Map<String, Object> e : entries) {
            String facName = (String) e.get("faculty_name");
            String subject = (String) e.get("subject");
            int teaching = ((Number) e.getOrDefault("teaching", 5)).intValue();
            int knowledge = ((Number) e.getOrDefault("knowledge", 5)).intValue();
            int punctuality = ((Number) e.getOrDefault("punctuality", 5)).intValue();
            int interaction = ((Number) e.getOrDefault("interaction", 5)).intValue();
            int guidance = ((Number) e.getOrDefault("guidance", 5)).intValue();
            int fairness = ((Number) e.getOrDefault("fairness", 5)).intValue();
            String comment = (String) e.getOrDefault("comment", "");

            batchArgs.add(new Object[]{
                    UUID.randomUUID().toString(), submissionId, facName, subject,
                    department, semester, division,
                    teaching, knowledge, punctuality, interaction, guidance, fairness,
                    comment, now
            });
        }

        jdbc.batchUpdate(sql, batchArgs);
    }

    public Map<String, Object> getPrincipalResults() {
        String sql = "SELECT * FROM evaluations ORDER BY faculty_name, subject";
        List<Map<String, Object>> allRows = jdbc.queryForList(sql);

        // Group rows by faculty_name + subject + department + semester + division
        Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();
        for (Map<String, Object> row : allRows) {
            String key = row.get("faculty_name") + "|" + row.get("subject") + "|" +
                         row.get("department") + "|" + row.get("semester") + "|" + row.get("division");
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : groups.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            List<Map<String, Object>> rows = entry.getValue();

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("faculty_name", parts[0]);
            res.put("facultyName", parts[0]);
            res.put("subject", parts[1]);
            res.put("department", parts[2]);
            res.put("semester", parts[3]);
            res.put("division", parts[4]);

            Set<String> uniqueSubmissions = new HashSet<>();
            for (Map<String, Object> r : rows) uniqueSubmissions.add(String.valueOf(r.get("submission_id")));
            res.put("responses", uniqueSubmissions.size());
            res.put("responseCount", uniqueSubmissions.size());

            Map<String, Double> criteriaAverages = new LinkedHashMap<>();
            double overallSum = 0;
            for (String c : CRITERIA) {
                double sum = 0;
                for (Map<String, Object> r : rows) sum += ((Number) r.get(c)).intValue();
                double avg = Math.round((sum / rows.size()) * 100.0) / 100.0;
                criteriaAverages.put(c, avg);
                overallSum += avg;
            }
            double overallAvg = Math.round((overallSum / CRITERIA.length) * 100.0) / 100.0;
            res.put("averages", criteriaAverages);
            res.put("criteria", criteriaAverages);
            res.put("overall", overallAvg);
            res.put("overallAverage", overallAvg);

            List<String> comments = new ArrayList<>();
            for (Map<String, Object> r : rows) {
                String c = (String) r.get("comment");
                if (c != null && !c.trim().isEmpty()) comments.add(c.trim());
            }
            res.put("comments", comments);

            results.add(res);
        }

        // Sort descending by overall
        results.sort((a, b) -> Double.compare((Double) b.get("overall"), (Double) a.get("overall")));

        // Analytics KPI Summary
        Set<String> allSubmissions = new HashSet<>();
        Set<String> allFaculty = new HashSet<>();
        for (Map<String, Object> r : allRows) {
            allSubmissions.add(String.valueOf(r.get("submission_id")));
            allFaculty.add(String.valueOf(r.get("faculty_name")));
        }

        double totalScoreSum = 0;
        int appreciationCount = 0;
        int warningCount = 0;
        for (Map<String, Object> r : results) {
            double ov = (Double) r.get("overall");
            totalScoreSum += ov;
            if (ov >= 4.5) appreciationCount++;
            else if (ov < 2.5) warningCount++;
        }
        double avgOverall = results.isEmpty() ? 0 : Math.round((totalScoreSum / results.size()) * 100.0) / 100.0;

        // Criteria averages across all rows
        Map<String, Double> overallCriteria = new LinkedHashMap<>();
        for (String c : CRITERIA) {
            double cSum = 0;
            for (Map<String, Object> r : allRows) {
                Object val = r.get(c);
                if (val instanceof Number) cSum += ((Number) val).doubleValue();
            }
            double cAvg = allRows.isEmpty() ? 0.0 : Math.round((cSum / allRows.size()) * 100.0) / 100.0;
            overallCriteria.put(c, cAvg);
        }

        // Department breakdown
        Map<String, Set<String>> deptStudents = new LinkedHashMap<>();
        Map<String, Double> deptSum = new LinkedHashMap<>();
        Map<String, Integer> deptCount = new LinkedHashMap<>();
        for (Map<String, Object> res : results) {
            String dept = String.valueOf(res.get("department"));
            deptStudents.computeIfAbsent(dept, k -> new HashSet<>());
            double ov = (Double) res.get("overall");
            int resp = (Integer) res.get("responses");
            deptSum.put(dept, deptSum.getOrDefault(dept, 0.0) + ov * resp);
            deptCount.put(dept, deptCount.getOrDefault(dept, 0) + resp);
        }
        for (Map<String, Object> r : allRows) {
            String dept = String.valueOf(r.get("department"));
            deptStudents.computeIfAbsent(dept, k -> new HashSet<>()).add(String.valueOf(r.get("submission_id")));
        }

        List<Map<String, Object>> departmentBreakdown = new ArrayList<>();
        for (String dept : deptStudents.keySet()) {
            Map<String, Object> dMap = new LinkedHashMap<>();
            dMap.put("department", dept);
            dMap.put("responses", deptStudents.get(dept).size());
            int count = deptCount.getOrDefault(dept, 0);
            double avg = count > 0 ? Math.round((deptSum.get(dept) / count) * 100.0) / 100.0 : 0.0;
            dMap.put("average", avg);
            departmentBreakdown.add(dMap);
        }

        // Recent submissions (last 7 days)
        Instant sevenDaysAgo = Instant.now().minus(java.time.Duration.ofDays(7));
        Set<String> recentSubs = new HashSet<>();
        for (Map<String, Object> r : allRows) {
            Object submittedAt = r.get("submitted_at");
            if (submittedAt instanceof java.sql.Timestamp) {
                if (((java.sql.Timestamp) submittedAt).toInstant().isAfter(sevenDaysAgo)) {
                    recentSubs.add(String.valueOf(r.get("submission_id")));
                }
            } else {
                recentSubs.add(String.valueOf(r.get("submission_id")));
            }
        }

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalResponses", allSubmissions.size());
        analytics.put("totalFaculty", allFaculty.size());
        analytics.put("averageOverall", avgOverall);
        analytics.put("appreciationCount", appreciationCount);
        analytics.put("warningCount", warningCount);
        analytics.put("criteriaAverages", overallCriteria);
        analytics.put("departmentBreakdown", departmentBreakdown);
        analytics.put("recentSubmissions", recentSubs.size());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("results", results);
        response.put("analytics", analytics);
        return response;
    }

    public Map<String, Object> getFacultyDashboardData(String facultyName, String defaultDept) {
        String assignSql = "SELECT * FROM faculty_assignments WHERE LOWER(TRIM(faculty_name)) = LOWER(TRIM(?))";
        List<Map<String, Object>> assignments = jdbc.queryForList(assignSql, facultyName);

        String initials = "";
        String firstDept = defaultDept != null ? defaultDept : "Information Technology";
        List<Map<String, Object>> assignedClasses = new ArrayList<>();
        for (Map<String, Object> a : assignments) {
            Map<String, Object> cls = new LinkedHashMap<>();
            cls.put("subject", a.get("subject"));
            cls.put("department", a.get("department"));
            cls.put("semester", a.get("semester"));
            cls.put("division", a.get("division"));
            assignedClasses.add(cls);
            if (initials.isEmpty() && a.get("initials") != null) {
                initials = (String) a.get("initials");
                firstDept = (String) a.get("department");
            }
        }

        if (initials.isEmpty()) {
            initials = facultyName.length() >= 3 ? facultyName.substring(0, 3).toUpperCase() : facultyName.toUpperCase();
        }
        String shortId = "FAC-" + initials + "-001";
        String email = facultyName.toLowerCase().replaceAll("^(prof|dr)\\.?\\s+", "").replaceAll("\\s+", ".") + "@apsit.edu.in";

        String evalSql = "SELECT * FROM evaluations WHERE LOWER(TRIM(faculty_name)) = LOWER(TRIM(?))";
        List<Map<String, Object>> evals = jdbc.queryForList(evalSql, facultyName);
        boolean hasEvaluations = !evals.isEmpty();

        Map<String, Double> criteriaAverages = new LinkedHashMap<>();
        double overallSum = 0;
        if (hasEvaluations) {
            for (String c : CRITERIA) {
                double sum = 0;
                for (Map<String, Object> e : evals) sum += ((Number) e.get(c)).intValue();
                double avg = Math.round((sum / evals.size()) * 100.0) / 100.0;
                criteriaAverages.put(c, avg);
                overallSum += avg;
            }
        } else {
            for (String c : CRITERIA) criteriaAverages.put(c, 0.0);
        }
        double overallRating = hasEvaluations ? Math.round((overallSum / CRITERIA.length) * 100.0) / 100.0 : 0.0;

        Set<String> uniqueStudents = new HashSet<>();
        List<String> anonymousComments = new ArrayList<>();
        for (Map<String, Object> e : evals) {
            uniqueStudents.add(String.valueOf(e.get("submission_id")));
            String c = (String) e.get("comment");
            if (c != null && !c.trim().isEmpty()) anonymousComments.add(c.trim());
        }

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("facultyName", facultyName);
        profile.put("facultyId", shortId);
        profile.put("department", firstDept);
        profile.put("email", email);
        profile.put("initials", initials);
        profile.put("assignedClasses", assignedClasses);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("profile", profile);
        data.put("hasEvaluations", hasEvaluations);
        data.put("totalResponses", uniqueStudents.size());
        data.put("overallRating", overallRating);
        data.put("overallAverage", overallRating);
        data.put("criteriaAverages", criteriaAverages);
        data.put("anonymousComments", anonymousComments);
        data.put("recentComments", anonymousComments);
        return data;
    }
}
