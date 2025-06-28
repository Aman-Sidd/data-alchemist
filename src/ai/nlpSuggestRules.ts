export async function nlpSuggestRules(clients: any[], tasks: any[], workers: any[]) {
  const res = await fetch("/api/recommend-rules", {
    method: "POST",
    body: JSON.stringify({ clients, tasks, workers }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (data.suggestions) {
    return data.suggestions;
  } else {
    throw new Error("Failed to generate suggestions");
  }
}