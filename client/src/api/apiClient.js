// helper to attach JWT and JSON headers
function buildHeaders(hasBody = false) {
  const token = localStorage.getItem('jwtToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!hasBody) {
    // some servers reject a Content-Type header when there's no body
    delete headers['Content-Type'];
  }
  return headers;
}

export async function apiGet(path) {
  const response = await fetch(`/api${path}`, {
    method: 'GET',
    headers: buildHeaders(false),
  });
  return response;
}

export async function apiPost(path, body) {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  return response;
}

export async function apiPatch(path, body) {
  const response = await fetch(`/api${path}`, {
    method: 'PATCH',
    headers: buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return response;
}

export async function apiDelete(path) {
  const response = await fetch(`/api${path}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  });
  return response;
}
