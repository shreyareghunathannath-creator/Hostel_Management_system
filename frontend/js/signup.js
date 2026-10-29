const form = document.querySelector("#signup-form");
const fullName = document.querySelector("#full-name");
const username = document.querySelector("#username");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirm-password");
const role = document.querySelector("#role");
const formMessage = document.querySelector("#form-message");
const fields = [fullName, username, email, password, confirmPassword, role];
const submitButton = form.querySelector('button[type="submit"]');

function setFieldError(input, message) {
  document.querySelector(`#${input.id}-error`).textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
}

for (const field of fields) {
  field.addEventListener("input", () => {
    setFieldError(field, "");
    formMessage.textContent = "";
  });
  field.addEventListener("change", () => {
    setFieldError(field, "");
    formMessage.textContent = "";
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  formMessage.textContent = "";

  const errors = new Map([
    [fullName, fullName.value.trim() ? "" : "Please enter your full name."],
    [username, username.value.trim() ? "" : "Please choose a username."],
    [email, !email.value.trim() ? "Please enter your email." : email.validity.valid ? "" : "Enter a valid email address."],
    [password, password.value.length >= 8 ? "" : "Use at least 8 characters for your password."],
    [confirmPassword, confirmPassword.value ? password.value === confirmPassword.value ? "" : "Passwords do not match." : "Please confirm your password."],
    [role, role.value ? "" : "Please select your role."]
  ]);

  for (const [field, message] of errors) {
    setFieldError(field, message);
  }

  const firstInvalid = fields.find((field) => errors.get(field));
  if (firstInvalid) {
    formMessage.textContent = "Please check the highlighted fields.";
    firstInvalid.focus();
    return;
  }

  if (role.value !== "student") {
    setFieldError(role, "Public sign-up is for students. Contact the hostel administrator for staff access.");
    formMessage.textContent = "Staff accounts must be created by an administrator.";
    role.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.querySelector("span:first-child").textContent = "Creating account...";

  try {
    const response = await window.HostelEaseAuth.postJson("register", {
      fullName: fullName.value.trim(),
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      role: "STUDENT"
    });
    const body = await window.HostelEaseAuth.parseJson(response);

    if (!response.ok) {
      for (const [field, message] of Object.entries(body.fieldErrors || {})) {
        const input = {
          fullName,
          username,
          email,
          password,
          confirmPassword,
          role
        }[field];
        if (input) setFieldError(input, message);
      }
      formMessage.textContent = body.message || "Registration failed. Please check your details and try again.";
      return;
    }

    formMessage.textContent = body.message || "Account created. You can now sign in.";
    formMessage.classList.add("is-success");
    window.setTimeout(() => window.location.assign("index.html"), 1200);
  } catch (error) {
    console.error("Registration request failed.", error);
    formMessage.textContent = error instanceof TypeError
      ? "Could not reach the registration service. Open HostelEase through the Spring Boot server and try again."
      : error.message || "Registration could not be completed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.querySelector("span:first-child").textContent = "Create account";
  }
});
