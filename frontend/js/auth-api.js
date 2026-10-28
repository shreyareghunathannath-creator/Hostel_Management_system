(function () {
  const authPath = "/api/auth";

  async function parseJson(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {};
    }
    return response.json();
  }

  async function getCsrfToken() {
    const response = await fetch(`${authPath}/csrf`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    const body = await parseJson(response);
    if (!response.ok || !body.token) {
      throw new Error(body.message || "Could not initialize secure sign-in. Please try again.");
    }
    return body.token;
  }

  async function post(path, body, contentType) {
    const token = await getCsrfToken();
    return fetch(`${authPath}/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        "X-XSRF-TOKEN": token
      },
      body
    });
  }

  async function postForm(path, values) {
    const body = new URLSearchParams(values);
    return post(path, body, "application/x-www-form-urlencoded;charset=UTF-8");
  }

  async function postJson(path, value) {
    return post(path, JSON.stringify(value), "application/json");
  }

  async function currentUser() {
    return fetch(`${authPath}/me`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
  }

  async function logout() {
    return post("logout", "", "text/plain;charset=UTF-8");
  }

  window.HostelEaseAuth = Object.freeze({
    currentUser,
    logout,
    parseJson,
    postForm,
    postJson
  });
})();
