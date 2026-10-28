package com.hostel.staff;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
 private final StaffRepository repo;
 public StaffController(StaffRepository repo) { this.repo = repo; }

 @GetMapping public List<Staff> all(@RequestParam(required=false) String search) {
   return repo.findAll(search == null ? "" : search.trim());
 }
 @GetMapping("/{id}") public Staff one(@PathVariable long id) {
   return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
 }
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Staff create(@RequestBody StaffRequest r) {
   validate(r); return repo.create(r);
 }
 @PutMapping("/{id}") public Staff update(@PathVariable long id, @RequestBody StaffRequest r) {
   validate(r); if (!repo.exists(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found");
   return repo.update(id, r);
 }
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable long id) {
   if (!repo.exists(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found");
   repo.delete(id);
 }
 @GetMapping("/stats") public Map<String,Object> stats() { return repo.stats(); }

 private void validate(StaffRequest r) {
   if (r == null || blank(r.fullName()) || blank(r.role()) || blank(r.phone()))
     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, role and phone are required");
   if (r.fullName().length()>100 || r.role().length()>50 || r.phone().length()>20 || (r.email()!=null && r.email().length()>120))
     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more fields are too long");
   if (r.status()!=null && !List.of("Active","On Leave","Inactive").contains(r.status()))
     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
 }
 private boolean blank(String s) { return s == null || s.trim().isEmpty(); }
 public record StaffRequest(String fullName, String role, String phone, String email, String shiftName, String status) {}
}