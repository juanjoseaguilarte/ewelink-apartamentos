function getToken() {
  return localStorage.getItem("adminToken");
}

function authFetch(url, options) {
  options = options || {};
  var headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {},
    { Authorization: "Bearer " + getToken() }
  );
  return fetch(url, Object.assign({}, options, { headers: headers })).then(function (response) {
    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/login.html";
      throw new Error("No autorizado");
    }
    return response;
  });
}

function checkAuth() {
  if (!getToken()) {
    window.location.href = "/login.html";
  }
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/login.html";
}
