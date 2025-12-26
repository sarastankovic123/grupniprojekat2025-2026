export async function getArtists() {
  const response = await fetch("/api/content/artists");
  if (!response.ok) throw new Error("Failed to fetch artists");
  return response.json();
}

export async function getArtistById(id) {
  const response = await fetch(`/api/content/artists/${id}`);
  if (!response.ok) throw new Error("Failed to fetch artist");
  return response.json();
}

export async function getAlbumsByArtist(id) {
  const response = await fetch(`/api/content/artists/${id}/albums`);
  if (!response.ok) throw new Error("Failed to fetch albums");
  return response.json();
}

export async function createArtist(payload) {
  const response = await fetch("/api/content/artists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Failed to create artist: ${text}`);

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
