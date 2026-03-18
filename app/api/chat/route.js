import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
            description: "Topic for quiz e.g. 'React Hooks', 'JavaScript'",
          },
          count: {
            type: "number",
            description: "Number of questions to generate",
          },
        },
        required: ["topic", "count"],
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
    return `Generate ${args.count} quiz questions on "${args.topic}" with 4 options each. Include correct answers at the end.`;
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

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      tools: tools,
      tool_choice: "auto",
      max_tokens: 2048,
    });

    const aiMessage = response.choices[0].message;

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Tool used: ${toolName}`, toolArgs);

      const toolResult = await runTool(toolName, toolArgs);

      const finalResponse = await client.chat.completions.create({
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
      });

      return Response.json({
        reply: finalResponse.choices[0].message.content,
      });
    }

    return Response.json({
      reply: aiMessage.content,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}