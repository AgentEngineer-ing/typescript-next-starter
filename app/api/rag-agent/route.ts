import { RAG_SYSTEM_INSTRUCTIONS } from "@/components/agent/prompts/rag-prompt";
import { retrieveKnowledgeBaseSimple } from "@/components/agent/tools";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: openai("gpt-5"),
      system: RAG_SYSTEM_INSTRUCTIONS,
      providerOptions: {
        openai: {
          reasoning_effort: "low",
          textVerbosity: "low",
          reasoningSummary: "detailed",
        },
      },
      messages: modelMessages,
      stopWhen: stepCountIs(10), // this is the part that makes this an agent!!!!
      tools: {
        retrieveKnowledgeBase: retrieveKnowledgeBaseSimple,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
