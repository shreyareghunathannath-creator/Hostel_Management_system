# HostelEase — Hostel Management System

HostelEase is a hostel management web application with a Java/Spring Boot backend and an HTML, CSS, and JavaScript frontend. The Spring Boot application serves the website and its authentication API from the same origin.

## Features

- Student registration and sign-in
- Role-based access for students, administrators, and wardens
- Student and administrator dashboard pages
- Session-based authentication with CSRF protection
- BCrypt password hashing
- MySQL/MariaDB persistence with Flyway database migrations
- Responsive HTML, CSS, and JavaScript user interface

> **Current scope:** The dashboards include room, fee, maintenance, and announcement screens. Some admin dashboard data and interactions are currently frontend demonstrations and are not yet persisted through backend management APIs. The password recovery page is also a UI only; email delivery and reset workflows are not configured.

## Technology

- Java 21
- Spring Boot 3.5.5
- Maven
- Spring Security
- Spring Data JPA and Hibernate
- Flyway
- MySQL Connector/J (connects to XAMPP MariaDB)
- HTML, CSS, and vanilla JavaScript

## Project structure

```text
HMS/
├── backend/
│   ├── pom.xml
│   ├── README.md
│   └── src/
│       ├── main/
│       │   ├── java/com/hostelease/hms/
│       │   │   ├── auth/       # Authentication and registration
│       │   │   ├── config/     # Spring Security and local admin bootstrap
│       │   │   └── user/       # User entity, roles, and repository
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/migration/
│       └── test/
│           ├── java/           # Authentication integration tests
│           └── resources/      # Isolated H2 test configuration
├── frontend/
│   ├── index.html              # Sign-in page
│   ├── signup.html
│   ├── student-dashboard.html
│   ├── admin-dashboard.html
│   ├── forgot-password.html
│   ├── css/
│   └── js/
└── README.md
```

During the Maven build, the frontend is copied into Spring Boot's static resources. Run the backend to serve the site; opening the HTML directly or using a separate Live Server origin will not provide the same-origin session and CSRF behavior required for authentication.

## Requirements

- JDK 21
- Maven 3.9 or later
- XAMPP MySQL/MariaDB, or another compatible MySQL database

Check Java and Maven from PowerShell:

```powershell
java -version
mvn -version
```

## Run locally with XAMPP

### 1. Start the database

Open the XAMPP Control Panel and start **MySQL**. In phpMyAdmin, create a database named `hostelease` if it does not already exist.

The application uses port `3306` by default. If your XAMPP database is configured for a different port, set `DB_PORT` to that port.

### 2. Configure and run the backend

Open a PowerShell terminal in the `backend` folder:

```powershell
Set-Location C:\Users\91860\Desktop\HMS\backend

$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "hostelease"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = Read-Host "XAMPP MariaDB password (press Enter if blank)"

mvn spring-boot:run
```

The password is supplied through the current terminal environment and is not stored in the project. The example uses XAMPP's commonly configured local `root` account; if your account has a password, enter it at the prompt.

For better isolation, create a dedicated local database user instead of using `root`, then provide that account's username and password through `DB_USERNAME` and `DB_PASSWORD`. Never commit database credentials to source control.

Spring Boot and Flyway will connect to the configured database and apply available migrations. If startup fails, inspect the complete terminal output, including any nested `Caused by` messages. Do not ignore database or migration errors.

### 3. Open the website

After Spring Boot reports that it has started, open:

<http://localhost:8080/>

Keep the backend process running in the terminal while using the website. Do not open the frontend through `file://` or a separate Live Server.

## Create an account and sign in

Use **Create an account** on the sign-in page to register a student account. Public registration is restricted to the `STUDENT` role. Sign in with the username and password you chose.

## Create a local administrator account

Administrator accounts are created through an explicitly enabled local bootstrap, not public signup. Stop the application first, then set the local profile and bootstrap values in the same PowerShell terminal used to start the backend:

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:BOOTSTRAP_ADMIN_ENABLED = "true"
$env:BOOTSTRAP_ADMIN_USERNAME = "choose-an-admin-username"
$env:BOOTSTRAP_ADMIN_NAME = "Administrator Name"
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.test"
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host "Choose a 12-72 byte admin password"
```

Then start the application with `mvn spring-boot:run`. Use the administrator username and password on the normal sign-in page. The bootstrap does not replace an account if that username already exists; choose a username not already registered. Keep bootstrap credentials out of source files and disable the bootstrap flag after setup.

## Authentication API

The frontend uses the same-origin `/api/auth` endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/csrf` | Obtain a CSRF token for a state-changing request |
| `POST` | `/api/auth/login` | Sign in with form-encoded `username` and `password` |
| `POST` | `/api/auth/register` | Register a student account |
| `GET` | `/api/auth/me` | Get the current authenticated user's profile |
| `POST` | `/api/auth/logout` | End the current session |

The application uses session cookies and CSRF tokens. The browser client sends credentials to the same origin as the frontend.

## Authorization

- Student dashboard access requires a student account.
- Admin dashboard access is restricted to administrator and warden roles.
- Admin API routes under `/api/admin/**` require the administrator role.
- Warden API routes under `/api/warden/**` allow administrators and wardens.
- Student API routes under `/api/student/**` require the student role.

Backend authorization is enforced by Spring Security; hiding or showing frontend controls is not a substitute for server-side access checks.

## Tests

Run the backend tests from the `backend` folder:

```powershell
mvn test
```

Authentication integration tests use an isolated in-memory H2 database and do not require XAMPP to be running.

## Troubleshooting

- **Connection refused:** Confirm XAMPP MySQL is running and `DB_HOST`/`DB_PORT` match its settings.
- **Unknown database:** Create the `hostelease` database in phpMyAdmin.
- **Access denied:** Check the MariaDB username/password and database privileges.
- **Port 8080 already in use:** Stop the other process using the port or set a different `SERVER_PORT`.
- **Sign-in service unavailable:** Confirm Spring Boot started successfully and visit the site at `http://localhost:8080/`.
- **401 response:** Check the username/password or sign in again if the session expired.
- **403 response:** Check CSRF handling and the signed-in user's role.
- **Migration/schema error:** Read the full backend startup log and resolve the reported database or migration issue before retrying.

## Security notes

- Do not commit passwords, database credentials, tokens, or local environment files.
- Keep production secrets in a managed secret store or deployment environment variables.
- Use HTTPS and secure session cookies for production deployments.
- Configure a least-privilege database account for the application.
- Public registration must not be used to create administrator or warden accounts.
