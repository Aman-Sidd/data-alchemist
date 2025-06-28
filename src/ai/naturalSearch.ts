export async function searchEntitiesWithNaturalLanguage(
  query: string,
  data: any[],
  entityType: "clients" | "workers" | "tasks"
): Promise<any[]> {
  const res = await fetch("/api/nl-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, data, entityType }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}