import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

// Helper to clean code fences and markdown from LLM output
  function cleanFunctionBody(content: string) {
  let code = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```(javascript)?/gi, "")
    .replace(/^export\s+default\s+/i, "")
    .trim();
  // Ensure the function returns a value
  if (!/^return\b/.test(code)) {
    code = "return " + code.replace(/^;/, "").trim().replace(/;$/, "") + ";";
  }
  return code;
}


export async function POST(req: NextRequest) {
  const { query, data, entityType } = await req.json();
  console.log('query:', query);
  console.log('entityType:', entityType);

  const apiKey = process.env.OPENROUTER_API_KEY || "";
  let functionBody: string | undefined;

  if (apiKey) {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Data Alchemist",
        "X-Description": "Natural language search for data entities",
      },
    });

    const prompt = `
    You are an expert JavaScript function generator. Your job is to convert a plain-English filter query into the BODY of a filter function (no wrapper, no markdown, no comments).

    The function body will be inserted into: item => { /* your code here */ }

    Instructions:
    - Only return raw JavaScript logic that can be placed inside a function.
    - Do NOT include the function wrapper or explanation.
    - The function receives a single object called 'item' representing a row of data.
    - entityType = "${entityType}" (e.g., "clients", "workers", "tasks")
    - data = ${JSON.stringify(data[0] || {})} (sample structure)

    Requirements:
    - Be case-insensitive when matching field names (e.g., "prioritylevel" ≈ "PriorityLevel")
    - Handle fuzzy operators like "more than", "less than or equal to", "at most", "no more than", etc.
    - Understand number comparisons: >, <, >=, <=, =, equals, is
    - Always check for field existence before comparing: e.g. item.Duration && item.Duration > 1
    - Assume data types (e.g., Duration is a number, RequestedTaskIDs is a comma-separated string)
    - If input is ambiguous or generic, default to: return true;

    Query: """${query}"""
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log("completion:", completion);

    if (!completion.choices || !completion.choices[0]?.message?.content) {
      return Response.json(
        { result: [], error: "OpenAI did not return a valid response." },
        { status: 500 }
      );
    }

    functionBody = cleanFunctionBody(completion.choices[0].message.content);
    console.log("FUNCTION BODY:", functionBody);
  } else {
    // Mock: Only supports a simple PriorityLevel 5 filter for demo
    if (entityType === "clients" && query.toLowerCase().includes("prioritylevel 5")) {
      functionBody = "return item.PriorityLevel == 5;";
    } else if (entityType === "tasks" && query.toLowerCase().includes("duration > 1")) {
      functionBody = "return item.Duration > 1;";
    } else {
      functionBody = "return true;";
    }
  }

  if (!functionBody) {
    return Response.json({ result: [], error: "No filter function generated." }, { status: 500 });
  }

  let filterFn: (item: any) => boolean;
  try {
    // eslint-disable-next-line no-new-func
    filterFn = new Function("item", functionBody) as (item: any) => boolean;
  } catch (e) {
    return Response.json({ result: [], error: "Failed to construct filter function: " + e }, { status: 500 });
  }

  let result: any[] = [];
  try {
    result = Array.isArray(data) ? data.filter(filterFn) : [];
  } catch (e) {
    return Response.json({ result: [], error: "Error running filter: " + e }, { status: 500 });
  }

  return Response.json({ result });
}