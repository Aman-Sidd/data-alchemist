export async function parseNaturalLanguageRule(input: string, contextData: any) {
  const res = await fetch("/api/nl-to-rule", {
    method: "POST",
    body: JSON.stringify({ input, contextData }),
  });

  if (!res.ok) throw new Error("Failed to fetch rule");
  return await res.json();
}