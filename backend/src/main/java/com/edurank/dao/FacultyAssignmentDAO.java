package com.edurank.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class FacultyAssignmentDAO {

    private final JdbcTemplate jdbc;

    public FacultyAssignmentDAO(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> getAll() {
        String sql = "SELECT * FROM faculty_assignments ORDER BY department, semester, division, faculty_name";
        return jdbc.queryForList(sql);
    }

    public String normalizeSemester(String sem) {
        if (sem == null) return "";
        String s = sem.trim().toUpperCase();
        if (s.equals("1") || s.equals("I") || s.equals("SEM 1") || s.equals("SEMESTER 1") || s.equals("SEMESTER I")) return "Semester I";
        if (s.equals("2") || s.equals("II") || s.equals("SEM 2") || s.equals("SEMESTER 2") || s.equals("SEMESTER II")) return "Semester II";
        if (s.equals("3") || s.equals("III") || s.equals("SEM 3") || s.equals("SEMESTER 3") || s.equals("SEMESTER III")) return "Semester III";
        if (s.equals("4") || s.equals("IV") || s.equals("SEM 4") || s.equals("SEMESTER 4") || s.equals("SEMESTER IV")) return "Semester IV";
        if (s.equals("5") || s.equals("V") || s.equals("SEM 5") || s.equals("SEMESTER 5") || s.equals("SEMESTER V")) return "Semester V";
        if (s.equals("6") || s.equals("VI") || s.equals("SEM 6") || s.equals("SEMESTER 6") || s.equals("SEMESTER VI")) return "Semester VI";
        if (s.equals("7") || s.equals("VII") || s.equals("SEM 7") || s.equals("SEMESTER 7") || s.equals("SEMESTER VII")) return "Semester VII";
        if (s.equals("8") || s.equals("VIII") || s.equals("SEM 8") || s.equals("SEMESTER 8") || s.equals("SEMESTER VIII")) return "Semester VIII";
        return sem.trim();
    }

    public String toArabicSemester(String sem) {
        if (sem == null) return "";
        String s = sem.trim().toUpperCase();
        if (s.equals("1") || s.equals("I") || s.equals("SEM 1") || s.equals("SEMESTER 1") || s.equals("SEMESTER I")) return "Semester 1";
        if (s.equals("2") || s.equals("II") || s.equals("SEM 2") || s.equals("SEMESTER 2") || s.equals("SEMESTER II")) return "Semester 2";
        if (s.equals("3") || s.equals("III") || s.equals("SEM 3") || s.equals("SEMESTER 3") || s.equals("SEMESTER III")) return "Semester 3";
        if (s.equals("4") || s.equals("IV") || s.equals("SEM 4") || s.equals("SEMESTER 4") || s.equals("SEMESTER IV")) return "Semester 4";
        if (s.equals("5") || s.equals("V") || s.equals("SEM 5") || s.equals("SEMESTER 5") || s.equals("SEMESTER V")) return "Semester 5";
        if (s.equals("6") || s.equals("VI") || s.equals("SEM 6") || s.equals("SEMESTER 6") || s.equals("SEMESTER VI")) return "Semester 6";
        if (s.equals("7") || s.equals("VII") || s.equals("SEM 7") || s.equals("SEMESTER 7") || s.equals("SEMESTER VII")) return "Semester 7";
        if (s.equals("8") || s.equals("VIII") || s.equals("SEM 8") || s.equals("SEMESTER 8") || s.equals("SEMESTER VIII")) return "Semester 8";
        return sem.trim();
    }

    public String normalizeDivision(String div) {
        if (div == null) return "";
        String d = div.trim();
        if (d.toUpperCase().startsWith("DIVISION ")) return "Division " + d.substring(9).trim().toUpperCase();
        if (d.toUpperCase().startsWith("DIV ")) return "Division " + d.substring(4).trim().toUpperCase();
        if (d.length() == 1) return "Division " + d.toUpperCase();
        return d;
    }

    public String toShortDivision(String div) {
        if (div == null) return "";
        String d = div.trim().toUpperCase();
        if (d.startsWith("DIVISION ")) return d.substring(9).trim();
        if (d.startsWith("DIV ")) return d.substring(4).trim();
        return d;
    }

    public List<Map<String, Object>> getForClass(String department, String semester, String division) {
        String normSem = normalizeSemester(semester);
        String arabicSem = toArabicSemester(semester);
        String normDiv = normalizeDivision(division);
        String shortDiv = toShortDivision(division);

        String sql = "SELECT faculty_name AS name, subject, initials FROM faculty_assignments " +
                     "WHERE LOWER(TRIM(department)) = LOWER(TRIM(?)) " +
                     "AND (LOWER(TRIM(semester)) = LOWER(TRIM(?)) OR LOWER(TRIM(semester)) = LOWER(TRIM(?)) OR LOWER(TRIM(semester)) = LOWER(TRIM(?))) " +
                     "AND (LOWER(TRIM(division)) = LOWER(TRIM(?)) OR LOWER(TRIM(division)) = LOWER(TRIM(?)) OR LOWER(TRIM(division)) = LOWER(TRIM(?)))";

        return jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", rs.getString("name"));
            map.put("subject", rs.getString("subject"));
            map.put("initials", rs.getString("initials"));
            return map;
        }, department.trim(), semester.trim(), normSem, arabicSem, division.trim(), normDiv, shortDiv);
    }

    public List<Map<String, Object>> getRegisteredFacultyList() {
        String sql = "SELECT DISTINCT faculty_name, department FROM faculty_assignments ORDER BY faculty_name";
        return jdbc.query(sql, (rs, rowNum) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("facultyName", rs.getString("faculty_name"));
            map.put("department", rs.getString("department"));
            return map;
        });
    }

    public boolean add(String facultyName, String subject, String department, String semester, String division, String initials) {
        return add(UUID.randomUUID().toString(), facultyName, subject, department, semester, division, initials);
    }

    public boolean add(String id, String facultyName, String subject, String department, String semester, String division, String initials) {
        if (id == null || id.trim().isEmpty()) {
            id = UUID.randomUUID().toString();
        }
        if (initials == null || initials.trim().isEmpty()) {
            initials = Arrays.stream(facultyName.trim().split("\\s+"))
                    .map(w -> w.isEmpty() ? "" : String.valueOf(w.charAt(0)).toUpperCase())
                    .reduce("", String::concat);
            if (initials.length() > 4) initials = initials.substring(0, 4);
        }
        String sql = "INSERT INTO faculty_assignments (id, faculty_name, subject, department, semester, division, initials) VALUES (?,?,?,?,?,?,?) " +
                     "ON DUPLICATE KEY UPDATE faculty_name=VALUES(faculty_name), subject=VALUES(subject), department=VALUES(department), " +
                     "semester=VALUES(semester), division=VALUES(division), initials=VALUES(initials)";
        int rows = jdbc.update(sql, id.trim(), facultyName.trim(), subject.trim(), department.trim(), semester.trim(), division.trim(), initials.trim());
        return rows > 0;
    }

    public boolean update(String id, String facultyName, String subject, String department, String semester, String division, String initials) {
        StringBuilder sql = new StringBuilder("UPDATE faculty_assignments SET ");
        List<Object> params = new ArrayList<>();
        if (facultyName != null) { sql.append("faculty_name=?, "); params.add(facultyName.trim()); }
        if (subject != null) { sql.append("subject=?, "); params.add(subject.trim()); }
        if (department != null) { sql.append("department=?, "); params.add(department.trim()); }
        if (semester != null) { sql.append("semester=?, "); params.add(semester.trim()); }
        if (division != null) { sql.append("division=?, "); params.add(division.trim()); }
        if (initials != null) { sql.append("initials=?, "); params.add(initials.trim()); }

        if (params.isEmpty()) return true;
        sql.setLength(sql.length() - 2); // remove trailing ", "
        sql.append(" WHERE id=?");
        params.add(id);

        int rows = jdbc.update(sql.toString(), params.toArray());
        return rows > 0;
    }

    public boolean delete(String id) {
        String sql = "DELETE FROM faculty_assignments WHERE id=?";
        int rows = jdbc.update(sql, id);
        return rows > 0;
    }
}
