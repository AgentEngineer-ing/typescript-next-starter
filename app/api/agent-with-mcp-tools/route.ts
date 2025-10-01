import { WEB_SCRAPER_SYSTEM_INSTRUCTIONS } from "@/components/agent/prompts/web-scraper-prompt";
import { getFirecrawlMCPClient } from "@/lib/mcp";
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

    // Initialize Firecrawl MCP client
    console.log("🚀 Initializing Firecrawl MCP client...");
    const firecrawlClient = getFirecrawlMCPClient();
    await firecrawlClient.connect();

    // Retrieve Firecrawl tools
    const tools = await firecrawlClient.getTools();

    console.log(
      `🔧 Agent has access to ${Object.keys(tools).length} Firecrawl MCP tools`
    );

    const result = streamText({
      model: openai("gpt-5"),
      system: WEB_SCRAPER_SYSTEM_INSTRUCTIONS,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
      providerOptions: {
        openai: {
          reasoning_effort: "low",
          textVerbosity: "low",
          reasoningSummary: "detailed",
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Agent API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
