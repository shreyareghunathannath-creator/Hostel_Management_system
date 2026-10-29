const form = document.querySelector("#login-form");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const formMessage = document.querySelector("#form-message");
const submitButton = form.querySelector('button[type="submit"]');

if (new URLSearchParams(window.location.search).get("reason") === "auth-unavailable") {
  formMessage.textContent = "We could not verify your session. Please sign in again.";
}

function setFieldError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
}

function clearFieldError(event) {
  setFieldError(event.currentTarget, "");
  formMessage.textContent = "";
}

username.addEventListener("input", clearFieldError);
password.addEventListener("input", clearFieldError);

passwordToggle.addEventListener("click", () => {
  const isVisible = password.type === "text";
  password.type = isVisible ? "password" : "text";
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
  passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  formMessage.textContent = "";

  const usernameMissing = !username.value.trim();
  const passwordMissing = !password.value;
  setFieldError(username, usernameMissing ? "Please enter your username." : "");
  setFieldError(password, passwordMissing ? "Please enter your password." : "");

  if (usernameMissing || passwordMissing) {
    formMessage.textContent = "Please complete the required fields.";
    (usernameMissing ? username : password).focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.querySelector("span:first-child").textContent = "Signing in...";

  try {
    const response = await window.HostelEaseAuth.postForm("login", {
      username: username.value.trim(),
      password: password.value
    });
    const body = await window.HostelEaseAuth.parseJson(response);

    if (!response.ok) {
      formMessage.textContent = body.message || "Sign in failed. Please check your details and try again.";
      password.focus();
      return;
    }

    const destinations = {
      ADMIN: "/admin-dashboard.html",
      WARDEN: "/admin-dashboard.html",
      STUDENT: "/student-dashboard.html"
    };
    const destination = destinations[body.role];
    if (!destination || body.redirectUrl !== destination) {
      throw new Error("The server returned an invalid sign-in destination.");
    }
    window.location.assign(destination);
  } catch (error) {
    console.error("Sign-in request failed.", error);
    formMessage.textContent = error instanceof TypeError
      ? "Could not reach the sign-in service. Open HostelEase through the Spring Boot server and try again."
      : error.message || "Sign in could not be completed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.querySelector("span:first-child").textContent = "Sign in";
  }
});
