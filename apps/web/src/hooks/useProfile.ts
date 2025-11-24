const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

function extractData(json: any) {
  if (!json) return json;
  if (json.data !== undefined) return json.data;
  return json;
}

async function tryJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function useProfile() {
  // fetch profile: try /users/me then /users/municipality (best-effort)
  const fetchProfile = async () => {
    let res = await fetch(`${API_BASE}/users/me`, { credentials: 'include' });
    if (res.ok) {
      const json = await tryJson(res);
      return extractData(json);
    }

    if (res.status === 404 || res.status === 405) {
      const alt = await fetch(`${API_BASE}/users/municipality`, { credentials: 'include' });
      if (alt.ok) {
        const json = await tryJson(alt);
        const list = extractData(json);
        if (Array.isArray(list) && list.length > 0) return list[0];
        throw new Error('Fetched /users/municipality but no users found. Backend does not expose /users/me.');
      }
    }

    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Failed to fetch profile (GET /users/me returned ${res.status})`);
  };

  // update profile: try PATCH /users/:id then POST /users/municipality/user/:id
  const updateProfile = async (id: string, payload: any) => {
    let res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await tryJson(res);
      return extractData(json);
    }

    if (res.status === 404 || res.status === 405) {
      const alt = await fetch(`${API_BASE}/users/municipality/user/${encodeURIComponent(id)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (alt.ok) {
        const json = await tryJson(alt);
        return extractData(json);
      }
    }

    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Update failed (PATCH /users/:id returned ${res.status})`);
  };

  // upload image: try POST /uploads then presign flow
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    let res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (res.ok) {
      const json = await tryJson(res);
      return extractData(json);
    }

    if (res.status === 404 || res.status === 405) {
      const presignRes = await fetch(`${API_BASE}/uploads/presign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (presignRes.ok) {
        const presignJson = await tryJson(presignRes);
        const data = extractData(presignJson);
        if (!data) throw new Error('Presign returned empty body');

        if (data.url && !data.fields) {
          const put = await fetch(data.url, { method: 'PUT', body: file });
          if (!put.ok) throw new Error(`Upload PUT failed (${put.status})`);
          return { url: data.url };
        }
        if (data.url && data.fields) {
          const form = new FormData();
          Object.entries(data.fields).forEach(([k, v]) => form.append(k, v as any));
          form.append('file', file);
          const postRes = await fetch(data.url, { method: 'POST', body: form });
          if (!postRes.ok) throw new Error(`Form upload failed (${postRes.status})`);
          return { url: data.url };
        }
        throw new Error('Presign response shape not supported. Expect { url } or { url, fields }');
      }
    }

    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Upload failed (POST /uploads returned ${res.status})`);
  };

  return { fetchProfile, updateProfile, uploadImage };
}