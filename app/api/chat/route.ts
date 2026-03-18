import Groq from "groq-sdk";
import { NextRequest } from "next/server";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

type ToolArgs = {
  expression?: string;
  topic?: string;
  count?: number;
  city?: string;
  query?: string;
};

const tools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Solve any math calculation accurately",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Math expression e.g. '25 * 4'",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description: "Generate quiz questions on any topic",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Topic for quiz e.g. 'React Hooks'",
          },
          count: {
            type: "number",
            description: "Number of questions",
          },
        },
        required: ["topic", "count"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_wikipedia",
      description:
        "Search Wikipedia for information about any topic, person, place, or concept",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search query e.g. 'React JavaScript library', 'Alan Turing'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather of any city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name e.g. 'Mumbai', 'Delhi'",
          },
        },
        required: ["city"],
      },
    },
  },
];

async function runTool(
  name: string,
  args: ToolArgs
): Promise<string> {
  if (name === "calculator") {
    const expression = args.expression ?? "";
    if (!expression) return "Invalid expression";
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return `${expression} = ${result}`;
    } catch {
      return "Invalid expression";
    }
  }

  if (name === "generate_quiz") {
    const topic = args.topic ?? "General Knowledge";
    const count = typeof args.count === "number" ? args.count : 5;
    return `Generate ${count} quiz questions on "${topic}" with 4 options each (A, B, C, D). Include correct answers at the end.`;
  }

  if (name === "get_weather") {
    const city = args.city ?? "";
    if (!city) return "City not provided.";
    try {
      const res = await fetch(`https://wttr.in/${city}?format=j1`);
      const data = await res.json();
      return `Weather in ${city}: ${data.current_condition[0].weatherDesc[0].value}, Temp: ${data.current_condition[0].temp_C} C, Humidity: ${data.current_condition[0].humidity}%`;
    } catch {
      return "Could not fetch weather. Please try again.";
    }
  }

  if (name === "search_wikipedia") {
    try {
      if (!args.query) return "Search query not provided.";
      const query = encodeURIComponent(String(args.query));
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`
      );
      const data = (await res.json()) as {
        title?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      };

      if (data.extract) {
        return `Wikipedia — ${data.title ?? ""}:\n\n${data.extract}\n\nSource: ${
          data.content_urls?.desktop?.page ?? ""
        }`;
      }

      return `No Wikipedia article found for: ${String(args.query)}`;
    } catch {
      return "Wikipedia search failed. Please try again.";
    }
  }

  return "Tool not found";
}

function createStream(
  groqStream: AsyncIterable<Groq.Chat.ChatCompletionChunk>
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of groqStream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY is missing" },
        { status: 500 }
      );
    }
    const client = new Groq({ apiKey });

    const { messages }: { messages: ClientMessage[] } = await request.json();

    const systemMessage: Groq.Chat.ChatCompletionMessageParam = {
      role: "system",
      content: `You are EduCoach AI, an expert learning assistant for students and developers.

Your personality:
- Clear and structured in explanations
- Always use examples to explain concepts
- Break complex topics into simple steps
- Encouraging and supportive

You can help with:
- Explaining any programming or tech concept
- Generating practice and quiz questions
- Reviewing and explaining code
- Interview preparation
- Study planning
- Use search_wikipedia tool when asked about any person, place, concept, or topic that needs factual information.

When explaining code, explain it line by line.
When generating quiz, format it cleanly with options A, B, C, D.
Always respond in clear English.`,
    };

    const allMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      systemMessage,
      ...messages,
    ];

    let toolCheck:
      | Groq.Chat.ChatCompletion
      | null = null;

    try {
      // Step 1 - Tool check
      toolCheck = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: allMessages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : String(err ?? "");
      if (msg.includes("tool_use_failed") || msg.includes("failed_generation")) {
        // Fallback: continue without tools
        toolCheck = null;
      } else {
        throw err;
      }
    }

    if (toolCheck) {
      const aiMessage = toolCheck.choices[0].message;
      const assistantMessage =
        aiMessage as Groq.Chat.ChatCompletionMessageParam;
      const toolCalls = aiMessage.tool_calls as ToolCall[] | undefined;

      // Step 2 - Tool use kiya?
      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments) as ToolArgs;

        console.log(`Tool used: ${toolName}`, toolArgs);
        const toolResult = await runTool(toolName, toolArgs);
        console.log(`Tool result: ${toolResult}`);

        // Step 3 - Streaming final response
        const stream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            ...allMessages,
            assistantMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            },
          ],
          max_tokens: 2048,
          stream: true,
        });

        return createStream(stream);
      }
    }

    // Step 4 - Normal streaming
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      max_tokens: 2048,
      stream: true,
    });

    return createStream(stream);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}

