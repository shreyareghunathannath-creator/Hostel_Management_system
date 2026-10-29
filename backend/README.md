# HostelEase backend

The backend serves the existing `frontend` files and the authentication API from the same origin. It uses Java 21, Spring Boot, Maven, Spring Security sessions, BCrypt, Spring Data JPA, MySQL, and Flyway.

## Requirements

- JDK 21
- Maven 3.9+
- MySQL 8+

Verify tools in the VS Code terminal:

```powershell
java -version
mvn -version
```

`java -version` should report version 21. Set `JAVA_HOME` to your JDK 21 installation and put its `bin` folder on `PATH` if another Java version is selected.

## Create the local database

Start MySQL, then use MySQL Workbench or another MySQL client to create a database and a dedicated local application account. Replace the example account name and password with values you choose; do not commit them to source control.

```sql
CREATE DATABASE hostelease CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'hostelease_app'@'localhost' IDENTIFIED BY 'choose-a-local-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON hostelease.* TO 'hostelease_app'@'localhost';
```

For production, use a managed secrets store and grant the runtime account only the permissions it needs after migrations have been applied. The schema migration creates `app_users` automatically when the application starts.

## Configure and run locally

Open a PowerShell terminal in `backend`. Set the database variables only in the current terminal session:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "hostelease"
$env:DB_USERNAME = "hostelease_app"
$env:DB_PASSWORD = Read-Host "Local MySQL application password"
```

Create a local administrator using credentials you choose. This bootstrap runs only with the `local` Spring profile and the opt-in flag; it hashes the password with BCrypt and never logs or returns it:

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:BOOTSTRAP_ADMIN_ENABLED = "true"
$env:BOOTSTRAP_ADMIN_USERNAME = "your-admin-username"
$env:BOOTSTRAP_ADMIN_NAME = "Your Admin Name"
$env:BOOTSTRAP_ADMIN_EMAIL = "your-admin-email@example.test"
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host "Choose a 12-72 byte local admin password"
```

Run the app:

```powershell
mvn spring-boot:run
```

Open `http://localhost:8080/`. Spring Boot serves `frontend/index.html`, the CSS/JavaScript, signup page, and the role-protected dashboards. Do not open the HTML as a `file://` URL or use Live Server for authentication; session cookies and CSRF require the application origin.

To disable the bootstrap after the first administrator has been created, stop the app, set `$env:BOOTSTRAP_ADMIN_ENABLED = "false"`, and restart it. Keep real production secrets out of the terminal history and repository. For HTTPS production deployments set `SESSION_COOKIE_SECURE=true`.

## Test

Run the automated authentication tests (they use an isolated in-memory H2 database and do not need a MySQL server):

```powershell
mvn test
```

The tests cover BCrypt registration, public-role restrictions, successful and failed login, CSRF, session authentication, role-protected pages, and logout.

## Authentication endpoints

- `GET /api/auth/csrf` — establishes the CSRF cookie and returns its request token.
- `POST /api/auth/login` — form-urlencoded `username` and `password`; returns a safe user summary and dashboard URL.
- `POST /api/auth/register` — JSON registration; public registration creates student accounts only.
- `GET /api/auth/me` — returns the signed-in user's safe profile.
- `POST /api/auth/logout` — invalidates the session and clears session/CSRF cookies.

The browser client requests a CSRF token before each state-changing request and sends the same-origin session cookie. Admin and warden accounts must be provisioned by an administrator; public signup cannot create privileged users.

The password recovery page is still a UI only; email delivery and reset-token workflows need a configured email provider before they can be enabled safely.

## Common errors

- **400** — registration fields or JSON are invalid; inspect the response `message` and `fieldErrors`.
- **401** — username/password are invalid, or the session has expired.
- **403** — CSRF token is missing/invalid or the account lacks the required role.
- **404** — confirm the server is running and open the page under `http://localhost:8080/`.
- **500 / startup failure** — check the application terminal for the migration/database error; verify MySQL is running and `DB_*` values are set.
- **CORS** — the intended setup serves frontend and API on the same origin. Do not use a separate Live Server origin unless an explicit CORS deployment configuration is added.
- **Database connection failure** — confirm the database exists and the MySQL account is allowed to connect from the configured host.
