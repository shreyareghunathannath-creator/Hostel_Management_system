# HostelCare Staff Module

Browser UI (HTML/CSS/JavaScript) + Java 17 Spring Boot REST API + MySQL using JDBC (`JdbcTemplate`).

## Requirements
- JDK 17+
- Maven 3.8+
- MySQL 8+
- IntelliJ IDEA or VS Code (optional)

## Setup
1. In MySQL Workbench, run: `CREATE DATABASE hostel_management;`
2. Edit `src/main/resources/application.properties` if needed. Defaults are username `root` and blank password. Prefer setting environment variables:
   - Windows PowerShell: `$env:DB_USERNAME="root"; $env:DB_PASSWORD="your_password"`
   - macOS/Linux: `export DB_USERNAME=root; export DB_PASSWORD='your_password'`
3. Open a terminal in this project folder and run `mvn spring-boot:run`.
4. Open http://localhost:8080. `schema.sql` creates the `staff` table automatically.

## Features
Dashboard counts; add/list/search/filter/edit/delete staff records; MySQL persistence; required-field validation.

## API
- GET `/api/staff` (optional search query)
- GET `/api/staff/{id}`
- POST `/api/staff`
- PUT `/api/staff/{id}`
- DELETE `/api/staff/{id}`
- GET `/api/staff/stats`

Example JSON for POST:
`{"fullName":"Anjali Menon","role":"Warden","phone":"9876543210","email":"anjali@example.com","shiftName":"General","status":"Active"}`

## Database fields
`id, full_name, role, phone, email, shift_name, status, created_at`

## Notes
This is a standalone starter module. Coordinate with your group before merging it into their existing database/schema. Authentication and role-based authorization are not included, so do not expose it publicly or use real personal data until those are added.
