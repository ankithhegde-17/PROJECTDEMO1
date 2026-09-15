export async function api(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json()
}
