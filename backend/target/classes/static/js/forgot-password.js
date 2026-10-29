const form = document.querySelector("#reset-form");
const accountId = document.querySelector("#account-id");
const formMessage = document.querySelector("#form-message");
const accountIdError = document.querySelector("#account-id-error");

accountId.addEventListener("input", () => {
  accountIdError.textContent = "";
  accountId.setAttribute("aria-invalid", "false");
  formMessage.textContent = "";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const missingAccountId = !accountId.value.trim();
  accountIdError.textContent = missingAccountId ? "Enter your registered email or username." : "";
  accountId.setAttribute("aria-invalid", String(missingAccountId));

  if (missingAccountId) {
    formMessage.textContent = "Please enter your registered account details.";
    accountId.focus();
    return;
  }

  formMessage.textContent = "Password recovery is not connected yet. Please try again later.";
});
