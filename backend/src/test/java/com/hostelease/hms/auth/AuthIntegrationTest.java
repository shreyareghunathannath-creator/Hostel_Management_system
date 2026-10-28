package com.hostelease.hms.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelease.hms.user.UserAccount;
import com.hostelease.hms.user.UserAccountRepository;
import com.hostelease.hms.user.UserRole;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    private static final String STUDENT_PASSWORD = "StudentPass123!";
    private static final String ADMIN_PASSWORD = "AdminPass123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Test Student", "student.test", "student@example.test",
                passwordEncoder.encode(STUDENT_PASSWORD), UserRole.STUDENT));
        userAccountRepository.save(new UserAccount(
                "Test Admin", "admin.test", "admin@example.test",
                passwordEncoder.encode(ADMIN_PASSWORD), UserRole.ADMIN));
    }

    @Test
    void loginCreatesSessionAndReturnsStudentDashboard() throws Exception {
        CsrfDetails csrf = getCsrfDetails();
        MvcResult login = login("student.test", STUDENT_PASSWORD, csrf)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.redirectUrl").value("/student-dashboard.html"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("student.test"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void loginRejectsInvalidPasswordWithoutCreatingAuthenticatedSession() throws Exception {
        CsrfDetails csrf = getCsrfDetails();
        login("student.test", "wrong-password", csrf)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password."));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRejectsPostWithoutCsrfToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("username", "student.test")
                        .param("password", STUDENT_PASSWORD))
                .andExpect(status().isForbidden());
    }

    @Test
    void registrationStoresBcryptAndDoesNotAllowPublicAdminAccounts() throws Exception {
        CsrfDetails csrf = getCsrfDetails();
        String request = """
                {
                  "fullName": "New Student",
                  "username": "new.student",
                  "email": "new.student@example.test",
                  "password": "NewStudentPass123!",
                  "confirmPassword": "NewStudentPass123!",
                  "role": "STUDENT"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("STUDENT"));

        UserAccount saved = userAccountRepository.findByUsernameIgnoreCase("new.student").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals("NewStudentPass123!", saved.getPassword());
        org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("NewStudentPass123!", saved.getPassword()));

        String adminRequest = request.replace("new.student", "new.admin")
                .replace("New Student", "New Admin")
                .replace("\"role\": \"STUDENT\"", "\"role\": \"ADMIN\"");
        mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dashboardHtmlRequiresAnAuthenticatedSession() throws Exception {
        mockMvc.perform(get("/student-dashboard.html"))
                .andExpect(status().is3xxRedirection())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl("/index.html"));
    }

    @Test
    void studentCanOpenOnlyStudentDashboardAndCanLogOut() throws Exception {
        CsrfDetails csrf = getCsrfDetails();
        MvcResult login = login("student.test", STUDENT_PASSWORD, csrf)
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mockMvc.perform(get("/student-dashboard.html").session(session))
                .andExpect(status().isOk());
        mockMvc.perform(get("/admin-dashboard.html").session(session))
                .andExpect(status().is3xxRedirection())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl("/index.html"));

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Signed out."));
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions login(String username, String password, CsrfDetails csrf) throws Exception {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("username", username);
        form.add("password", password);
        MockHttpServletRequestBuilder request = post("/api/auth/login")
                .cookie(csrf.cookie())
                .header("X-XSRF-TOKEN", csrf.token())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .params(form);
        return mockMvc.perform(request);
    }

    private CsrfDetails getCsrfDetails() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        return new CsrfDetails(cookie, token);
    }

    private record CsrfDetails(Cookie cookie, String token) {
    }
}
