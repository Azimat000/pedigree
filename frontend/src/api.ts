// frontend/src/api.ts
const API_BASE = "http://localhost:8000";

export async function register(
  email: string,
  password: string,
  full_name?: string,
  role?: string
) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name, role }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return res.json();
}

export async function getPatients(token: string, search: string = "") {
  const url = new URL(`${API_BASE}/patients`);
  if (search) {
    url.searchParams.append("search", search);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch patients");
  }

  return res.json();
}

export async function createPatient(token: string, patient: any) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patient),
  });
  return res.json();
}

export async function createRelation(token: string, rel: any) {
  const res = await fetch(`${API_BASE}/relations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rel),
  });
  return res.json();
}

export async function getPedigree(token: string, patientId: number) {
  const res = await fetch(`${API_BASE}/pedigree/${patientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch pedigree");
  }
  return res.json();
}

export async function createLink(token: string, link: any) {
  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(link),
  });
  return res.json();
}