import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const tools = [
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

async function runTool(name, args) {
  if (name === "calculator") {
    try {
      const result = eval(args.expression);
      return `${args.expression} = ${result}`;
    } catch {
      return "Invalid expression";
    }
  }

  if (name === "generate_quiz") {
    return `Generate ${args.count} quiz questions on "${args.topic}" with 4 options each (A, B, C, D). Include correct answers at the end.`;
  }

  if (name === "get_weather") {
    try {
      const res = await fetch(
        `https://wttr.in/${args.city}?format=j1`
      );
      const data = await res.json();
      return `Weather in ${args.city}: ${data.current_condition[0].weatherDesc[0].value}, Temp: ${data.current_condition[0].temp_C}°C, Humidity: ${data.current_condition[0].humidity}%`;
    } catch {
      return "Could not fetch weather. Please try again.";
    }
  }
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const allMessages = [
      {
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

When explaining code, explain it line by line.
When generating quiz, format it cleanly with options A, B, C, D.
Always respond in clear English.`,
      },
      ...messages,
    ];

    // Step 1 — Tool check karo (no streaming)
    const toolCheck = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      tools: tools,
      tool_choice: "auto",
      max_tokens: 1024,
    });

    const aiMessage = toolCheck.choices[0].message;

    // Step 2 — Agar tool use kiya
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Tool used: ${toolName}`, toolArgs);
      const toolResult = await runTool(toolName, toolArgs);
      console.log(`Tool result: ${toolResult}`);

      // Step 3 — Tool result ke baad STREAMING se final jawab lo
      const stream = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          ...allMessages,
          aiMessage,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          },
        ],
        max_tokens: 2048,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Step 4 — Koi tool nahi, seedha streaming
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}