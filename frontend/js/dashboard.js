const body = document.body;
const dashboardType = body.dataset.dashboard;
const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector(".menu-toggle");
const currentPage = document.querySelector("#current-page");
let toastTimer;

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

async function initializeAuthenticatedDashboard() {
  try {
    const response = await window.HostelEaseAuth.currentUser();
    if (response.status === 401) {
      window.location.replace("/index.html");
      return;
    }
    if (!response.ok) {
      throw new Error("Could not verify the current sign-in.");
    }

    const user = await window.HostelEaseAuth.parseJson(response);
    const allowedRole = dashboardType === "admin"
      ? user.role === "ADMIN" || user.role === "WARDEN"
      : user.role === "STUDENT";
    if (!allowedRole) {
      const destination = user.role === "ADMIN" || user.role === "WARDEN"
        ? "/admin-dashboard.html"
        : "/student-dashboard.html";
      window.location.replace(destination);
      return;
    }

    const fullName = user.fullName || user.username;
    const userName = document.querySelector(".user-label strong");
    const userRole = document.querySelector(".user-label span");
    const avatar = document.querySelector(".topbar-user .avatar");
    if (userName) userName.textContent = fullName;
    if (userRole) userRole.textContent = dashboardType === "admin"
      ? user.role === "WARDEN" ? "Hostel Warden" : "Hostel Administrator"
      : "Student resident";
    if (avatar) {
      avatar.textContent = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    }

    const firstName = fullName.split(/\s+/)[0];
    const welcome = document.querySelector(".welcome-row h1");
    if (welcome?.firstChild) {
      welcome.firstChild.textContent = dashboardType === "admin"
        ? `Good morning, ${firstName} `
        : `Welcome home, ${firstName} `;
    }
    body.classList.remove("session-pending");
  } catch (error) {
    console.error("Dashboard session verification failed.", error);
    window.location.replace("/index.html?reason=auth-unavailable");
  }
}

document.querySelectorAll("[data-logout]").forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (link.getAttribute("aria-busy") === "true") return;
    link.setAttribute("aria-busy", "true");
    try {
      const response = await window.HostelEaseAuth.logout();
      const result = await window.HostelEaseAuth.parseJson(response);
      if (!response.ok) {
        showToast(result.message || "Sign out failed. Please try again.");
        link.removeAttribute("aria-busy");
        return;
      }
      window.location.assign("/index.html");
    } catch (error) {
      console.error("Sign-out request failed.", error);
      showToast("Could not reach the sign-out service. Please try again.");
      link.removeAttribute("aria-busy");
    }
  });
});

function activateSection(sectionName) {
  const target = document.querySelector(`#section-${sectionName}`);
  if (!target) return;
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    const active = section === target;
    section.hidden = !active;
    section.classList.toggle("is-visible", active);
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.section === sectionName;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const activeItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
  if (currentPage && activeItem) {
    const label = activeItem.cloneNode(true);
    label.querySelector(".nav-icon")?.remove();
    label.querySelector(".nav-count")?.remove();
    currentPage.textContent = label.textContent.trim();
  }
  body.classList.remove("sidebar-open");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => activateSection(item.dataset.section));
});

document.querySelectorAll("[data-navigate]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    activateSection(item.dataset.navigate);
  });
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const open = !body.classList.contains("sidebar-open");
    body.classList.toggle("sidebar-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
}

document.addEventListener("click", (event) => {
  if (!body.classList.contains("sidebar-open") || sidebar.contains(event.target) || menuToggle.contains(event.target)) return;
  body.classList.remove("sidebar-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.classList.contains("sidebar-open")) {
    body.classList.remove("sidebar-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.focus();
  }
});

function setupSearch(inputId, rowSelector, searchableSelector) {
  const input = document.querySelector(inputId);
  if (!input) return;
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll(rowSelector).forEach((row) => {
      row.hidden = !row.querySelector(searchableSelector).textContent.toLowerCase().includes(query);
    });
  });
}

setupSearch("#room-search", "[data-room]", "td:nth-child(1)");
setupSearch("#student-search", "[data-student]", "td:first-child");
setupSearch("#fee-search", "[data-fee]", "td:first-child");

const roomFilter = document.querySelector("#room-filter");
if (roomFilter) {
  roomFilter.addEventListener("change", () => {
    document.querySelectorAll("[data-room]").forEach((row) => {
      row.hidden = roomFilter.value !== "all" && row.dataset.status !== roomFilter.value;
    });
  });
}

if (dashboardType === "admin") {
  const roomDialog = document.querySelector("#room-dialog");
  const roomForm = document.querySelector("#room-form");
  const roomRows = document.querySelector("#room-rows");
  const roomNumberInput = document.querySelector("#room-number");
  const roomBlockInput = document.querySelector("#room-block");
  const roomCapacityInput = document.querySelector("#room-capacity");
  const roomAssignedInput = document.querySelector("#room-assigned");
  const roomStatusInput = document.querySelector("#room-status");
  const roomOriginalId = document.querySelector("#room-original-id");

  function updateRoomCounts() {
    const rows = [...roomRows.querySelectorAll("[data-room]")];
    const count = 124 + rows.length;
    const beds = rows.reduce((total, row) => {
      const capacity = Number(row.dataset.capacity || 2);
      return total + (row.dataset.status === "Available" ? capacity : 0);
    }, 51);
    document.querySelector("#total-rooms").textContent = count;
    document.querySelector("#rooms-count").textContent = count;
    const occupied = 99 + rows.filter((row) => row.dataset.status === "Occupied").length;
    document.querySelector("#occupied-rooms").textContent = occupied;
    document.querySelector("#rooms-occupied").textContent = occupied;
    document.querySelector("#available-beds").textContent = beds;
    document.querySelector("#beds-count").textContent = beds;
  }

  function setRoomStatus(row, status) {
    row.dataset.status = status;
    const badge = row.querySelector(".status-badge");
    badge.className = `status-badge status-${status.toLowerCase()}`;
    badge.textContent = status;
  }

  function openRoomDialog(row, assignmentOnly = false) {
    roomForm.reset();
    roomOriginalId.value = row ? row.querySelector("td strong").textContent : "";
    document.querySelector("#room-dialog-title").textContent = assignmentOnly ? "Assign a room" : row ? "Edit room" : "Add a room";
    if (row) {
      const cells = row.querySelectorAll("td");
      roomNumberInput.value = cells[0].textContent.trim();
      roomBlockInput.value = cells[1].textContent.trim();
      roomCapacityInput.value = String(row.dataset.capacity || cells[2].textContent.match(/\d+/)?.[0] || 2);
      roomAssignedInput.value = cells[3].querySelector(".empty-cell") ? "" : cells[3].textContent.trim();
      roomStatusInput.value = row.dataset.status;
    }
    roomNumberInput.readOnly = assignmentOnly;
    roomBlockInput.disabled = assignmentOnly;
    roomCapacityInput.disabled = assignmentOnly;
    roomStatusInput.disabled = assignmentOnly;
    roomDialog.showModal();
  }

  document.querySelectorAll("[data-open-room]").forEach((button) => button.addEventListener("click", () => openRoomDialog(null)));
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => roomDialog.close()));

  roomRows.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const row = button.closest("[data-room]");
    if (button.hasAttribute("data-edit-room")) openRoomDialog(row);
    if (button.hasAttribute("data-assign-room")) openRoomDialog(row, true);
    if (button.hasAttribute("data-delete-room")) {
      const roomName = row.querySelector("td strong").textContent;
      if (window.confirm(`Delete room ${roomName}?`)) {
        row.remove();
        updateRoomCounts();
        showToast(`${roomName} was removed from the room directory.`);
      }
    }
  });

  roomForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!roomForm.reportValidity()) return;
    const original = roomOriginalId.value;
    const existing = original ? [...roomRows.querySelectorAll("[data-room]")].find((row) => row.querySelector("td strong").textContent === original) : null;
    if ([...roomRows.querySelectorAll("[data-room]")].some((row) => row !== existing && row.querySelector("td strong").textContent.toLowerCase() === roomNumberInput.value.trim().toLowerCase())) {
      roomNumberInput.setCustomValidity("A room with this number already exists.");
      roomNumberInput.reportValidity();
      roomNumberInput.setCustomValidity("");
      return;
    }
    const row = existing || document.createElement("tr");
    row.dataset.room = "";
    row.dataset.capacity = roomCapacityInput.value;
    const assigned = roomAssignedInput.value.trim();
    const status = assigned ? "Occupied" : roomStatusInput.value;
    row.innerHTML = `<td><strong></strong></td><td></td><td></td><td></td><td><span class="status-badge"></span></td><td><div class="row-actions"><button type="button" data-edit-room>Edit</button><button type="button" data-assign-room>Assign</button><button class="danger-action" type="button" data-delete-room>Delete</button></div></td>`;
    row.querySelector("td:nth-child(1) strong").textContent = roomNumberInput.value.trim();
    row.querySelector("td:nth-child(2)").textContent = roomBlockInput.value;
    row.querySelector("td:nth-child(3)").textContent = `${roomCapacityInput.value} beds`;
    const assignedCell = row.querySelector("td:nth-child(4)");
    if (assigned) assignedCell.textContent = assigned;
    else {
      const unassigned = document.createElement("span");
      unassigned.className = "empty-cell";
      unassigned.textContent = "Unassigned";
      assignedCell.append(unassigned);
    }
    row.querySelector('[data-edit-room]').setAttribute("aria-label", `Edit room ${roomNumberInput.value.trim()}`);
    row.querySelector('[data-assign-room]').setAttribute("aria-label", `Assign room ${roomNumberInput.value.trim()}`);
    row.querySelector('[data-delete-room]').setAttribute("aria-label", `Delete room ${roomNumberInput.value.trim()}`);
    setRoomStatus(row, status);
    if (!existing) roomRows.prepend(row);
    updateRoomCounts();
    roomDialog.close();
    showToast(assigned ? `${roomNumberInput.value.trim()} assigned to ${assigned}.` : `${roomNumberInput.value.trim()} saved successfully.`);
  });

  roomDialog.addEventListener("close", () => {
    roomNumberInput.readOnly = false;
    roomBlockInput.disabled = false;
    roomCapacityInput.disabled = false;
    roomStatusInput.disabled = false;
  });

  const noticeForm = document.querySelector("#notice-form");
  function makeNoticeCard(notice) {
    const card = document.createElement("article");
    card.className = "notice-card";
    const meta = document.createElement("div");
    meta.className = "notice-meta";
    const tag = document.createElement("span");
    tag.className = "notice-tag tag-green";
    tag.textContent = notice.tag || "NEW";
    const time = document.createElement("time");
    time.textContent = notice.date || "Recently";
    meta.append(tag, time);
    const heading = document.createElement("h3");
    heading.textContent = notice.title;
    const content = document.createElement("p");
    content.textContent = notice.message;
    const author = document.createElement("span");
    author.className = "notice-author";
    author.textContent = `Posted by ${notice.author || "Hostel Office"}`;
    card.append(meta, heading, content, author);
    return card;
  }

  function loadSavedNotices() {
    try {
      const saved = localStorage.getItem("hostelease-notices");
      if (!saved) return [];
      const notices = JSON.parse(saved);
      if (!Array.isArray(notices)) throw new TypeError("Saved announcements must be a list.");
      return notices;
    } catch (error) {
      console.error("Unable to load saved announcements.", error);
      showToast("Saved announcements could not be loaded in this browser.");
      return [];
    }
  }

  function renderAdminNotices() {
    const list = document.querySelector("#notice-list");
    list.querySelectorAll("[data-saved-notice]").forEach((item) => item.remove());
    const saved = loadSavedNotices();
    for (const entry of saved.slice().reverse()) {
      const card = makeNoticeCard(entry);
      card.dataset.savedNotice = "";
      list.prepend(card);
    }
    document.querySelector("#notice-count").textContent = `${list.children.length} notices`;
  }

  renderAdminNotices();
  window.addEventListener("storage", (event) => {
    if (event.key === "hostelease-notices") renderAdminNotices();
  });

  noticeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.querySelector("#notice-title");
    const message = document.querySelector("#notice-body");
    const noticeMessage = document.querySelector("#notice-message");
    noticeMessage.textContent = "";
    if (!title.value.trim() || !message.value.trim()) {
      noticeMessage.textContent = "Add a title and message before posting.";
      (!title.value.trim() ? title : message).focus();
      return;
    }
    const entry = {
      title: title.value.trim(),
      message: message.value.trim(),
      date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
      author: "Arjun Mehta",
      tag: "NEW"
    };
    const saved = loadSavedNotices();
    saved.push(entry);
    try {
      localStorage.setItem("hostelease-notices", JSON.stringify(saved));
    } catch (error) {
      console.error("Unable to save announcement.", error);
      showToast("Announcement could not be saved in this browser.");
      return;
    }
    const notice = makeNoticeCard(entry);
    notice.dataset.savedNotice = "";
    document.querySelector("#notice-list").prepend(notice);
    const count = document.querySelector("#notice-list").children.length;
    document.querySelector("#notice-count").textContent = `${count} notices`;
    noticeForm.reset();
    showToast("Your announcement is now on the notice board.");
  });

  document.querySelector("#export-fees").addEventListener("click", () => {
    const csvRows = [["Student", "Room", "Amount", "Due date", "Status"]];
    document.querySelectorAll("#fee-rows tr").forEach((row) => {
      csvRows.push([...row.querySelectorAll("td")].slice(0, 5).map((cell) => cell.textContent.trim()));
    });
    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "hostelease-fee-report.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast("Fee report downloaded.");
  });
}

document.addEventListener("click", (event) => {
  const receiptButton = event.target.closest("[data-receipt]");
  if (receiptButton) {
    const cells = [...receiptButton.closest("tr").querySelectorAll("td")];
    const student = dashboardType === "student" ? "Priya Sharma" : cells[0].querySelector("strong")?.textContent.trim() || "HostelEase Student";
    const room = dashboardType === "student" ? "A-204" : cells[1].textContent.trim();
    const amount = dashboardType === "student" ? cells[3].textContent.trim() : cells[2].textContent.trim();
    const date = dashboardType === "student" ? cells[2].textContent.trim() : cells[3].textContent.trim();
    const receipt = [
      "HostelEase Hostel Fee Receipt",
      "--------------------------------",
      `Receipt number: ${receiptButton.dataset.receipt}`,
      `Student: ${student}`,
      `Room: ${room}`,
      `Amount: ${amount}`,
      `Payment date: ${date}`,
      `Status: ${cells[4].textContent.trim()}`,
      "Generated by HostelEase"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receiptButton.dataset.receipt}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Receipt ${receiptButton.dataset.receipt} downloaded.`);
  }
});

if (dashboardType === "student") {
  function renderStudentNotices() {
    const list = document.querySelector("#student-notice-list");
    list.querySelectorAll("[data-saved-notice]").forEach((item) => item.remove());
    let saved = [];
    try {
      const value = localStorage.getItem("hostelease-notices");
      if (value) {
        saved = JSON.parse(value);
        if (!Array.isArray(saved)) throw new TypeError("Saved announcements must be a list.");
      }
    } catch (error) {
      console.error("Unable to load saved announcements.", error);
      showToast("Saved announcements could not be loaded in this browser.");
      return;
    }
    for (const entry of saved.slice().reverse()) {
      const card = document.createElement("article");
      card.className = "notice-card";
      card.dataset.savedNotice = "";
      const meta = document.createElement("div");
      meta.className = "notice-meta";
      const tag = document.createElement("span");
      tag.className = "notice-tag tag-green";
      tag.textContent = entry.tag || "NEW";
      const date = document.createElement("time");
      date.textContent = entry.date || "Recently";
      meta.append(tag, date);
      const title = document.createElement("h3");
      title.textContent = entry.title;
      const content = document.createElement("p");
      content.textContent = entry.message;
      const author = document.createElement("span");
      author.className = "notice-author";
      author.textContent = `${entry.author || "Hostel Office"} · Maple House`;
      card.append(meta, title, content, author);
      list.prepend(card);
    }
    const total = list.children.length;
    document.querySelector("#student-notice-count").textContent = `${total} updates`;
    const latest = saved[saved.length - 1];
    if (latest) {
      const latestPanel = document.querySelector(".latest-notice");
      latestPanel.querySelector(".notice-tag").textContent = latest.tag || "NEW";
      latestPanel.querySelector("h3").textContent = latest.title;
      latestPanel.querySelector("p").textContent = latest.message;
      latestPanel.querySelector("time").textContent = `Posted ${latest.date || "recently"}`;
    }
  }

  renderStudentNotices();
  window.addEventListener("storage", (event) => {
    if (event.key === "hostelease-notices") renderStudentNotices();
  });

  const requestForm = document.querySelector("#request-form");
  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = document.querySelector("#request-category");
    const subject = document.querySelector("#request-subject");
    const details = document.querySelector("#request-details");
    const message = document.querySelector("#request-message");
    message.textContent = "";
    if (!category.value || !subject.value.trim() || !details.value.trim()) {
      message.textContent = "Please complete each field before submitting.";
      (!category.value ? category : !subject.value.trim() ? subject : details).focus();
      return;
    }
    const request = document.createElement("article");
    request.className = "request-card";
    const top = document.createElement("div");
    top.className = "request-card-top";
    const type = document.createElement("span");
    type.className = "request-category";
    type.textContent = category.value.toUpperCase();
    const status = document.createElement("span");
    status.className = "status-badge status-pending";
    status.textContent = "Pending";
    top.append(type, status);
    const title = document.createElement("h3");
    title.textContent = subject.value.trim();
    const detail = document.createElement("p");
    detail.textContent = `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date())} · Ticket #MT-${Math.floor(2000 + Math.random() * 8000)}`;
    const progress = document.createElement("div");
    progress.className = "request-progress";
    progress.innerHTML = '<i class="progress-current"></i><i></i><i></i><span>Submitted · Awaiting review</span>';
    request.append(top, title, detail, progress);
    document.querySelector("#request-list").prepend(request);
    document.querySelector("#request-count").textContent = `${document.querySelector("#request-list").children.length} requests`;
    const navCount = document.querySelector(".nav-count");
    if (navCount) navCount.textContent = String(Number(navCount.textContent) + 1);
    requestForm.reset();
    showToast("Your maintenance request has been submitted.");
  });

}

activateSection("overview");
initializeAuthenticatedDashboard();
