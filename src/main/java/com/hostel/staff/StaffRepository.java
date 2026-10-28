package com.hostel.staff;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class StaffRepository {
 private final JdbcTemplate jdbc;
 public StaffRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
 private final RowMapper<Staff> mapper = (rs,n) -> new Staff(rs.getLong("id"), rs.getString("full_name"),
   rs.getString("role"), rs.getString("phone"), rs.getString("email"), rs.getString("shift_name"), rs.getString("status"));

 public List<Staff> findAll(String search) {
   String q = "%" + search + "%";
   return jdbc.query("SELECT id,full_name,role,phone,email,shift_name,status FROM staff WHERE full_name LIKE ? OR role LIKE ? OR phone LIKE ? OR COALESCE(email,'') LIKE ? ORDER BY id DESC",
     mapper, q,q,q,q);
 }
 public Optional<Staff> findById(long id) {
   return jdbc.query("SELECT id,full_name,role,phone,email,shift_name,status FROM staff WHERE id=?", mapper, id).stream().findFirst();
 }
 public boolean exists(long id) {
   Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM staff WHERE id=?", Integer.class, id);
   return n != null && n > 0;
 }
 public Staff create(StaffController.StaffRequest r) {
   jdbc.update("INSERT INTO staff(full_name,role,phone,email,shift_name,status) VALUES(?,?,?,?,?,?)",
     r.fullName().trim(), r.role().trim(), r.phone().trim(), nullable(r.email()), value(r.shiftName(),"General"), value(r.status(),"Active"));
   Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
   return findById(id).orElseThrow();
 }
 public Staff update(long id, StaffController.StaffRequest r) {
   jdbc.update("UPDATE staff SET full_name=?,role=?,phone=?,email=?,shift_name=?,status=? WHERE id=?",
     r.fullName().trim(), r.role().trim(), r.phone().trim(), nullable(r.email()), value(r.shiftName(),"General"), value(r.status(),"Active"), id);
   return findById(id).orElseThrow();
 }
 public void delete(long id) { jdbc.update("DELETE FROM staff WHERE id=?", id); }
 public Map<String,Object> stats() {
   return Map.of("total", count("SELECT COUNT(*) FROM staff"), "active", count("SELECT COUNT(*) FROM staff WHERE status='Active'"),
     "onLeave", count("SELECT COUNT(*) FROM staff WHERE status='On Leave'"), "roles", count("SELECT COUNT(DISTINCT role) FROM staff"));
 }
 private int count(String sql) { Integer n=jdbc.queryForObject(sql,Integer.class); return n==null?0:n; }
 private String nullable(String s) { return s==null || s.trim().isEmpty()?null:s.trim(); }
 private String value(String s,String fallback) { return s==null || s.trim().isEmpty()?fallback:s.trim(); }
}