export async function apiPost(path, body) {
  const token = localStorage.getItem('jwtToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return response;
}

export async function apiGet(path) {
  const token = localStorage.getItem('jwtToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method: 'GET',
    headers,
  });
  return response;
}
