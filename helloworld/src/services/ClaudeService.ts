import type * as API from "@anthropic-ai/sdk/resources/index";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getIdToken } from "../firebase";

type ToolArgs = Record<string, string | number | boolean>;

export interface Message {
  role: "user" | "assistant" | "system" | "error";
  content: string;
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

class ClaudeService {
  private apiKey: string;
  private messages: API.MessageParam[] = [];
  private tools: API.Tool[];
  private anthropicProxy: ReturnType<typeof httpsCallable>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const functions = getFunctions();
    this.anthropicProxy = httpsCallable(functions, "anthropicProxy");

    this.tools = [
      {
        name: "read_file",
        description: "Read a file and return its contents",
        input_schema: {
          type: "object",
          properties: { file_path: { type: "string" } },
          required: ["file_path"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file",
        input_schema: {
          type: "object",
          properties: {
            file_path: { type: "string" },
            content: { type: "string" },
          },
          required: ["file_path", "content"],
        },
      },
      {
        name: "read_conversation_log",
        description: "Read the conversation log file",
        input_schema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_directory",
        description: "List contents of the current directory",
        input_schema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_script_path",
        description: "Get the full path of the running script",
        input_schema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  private async executeTool(toolName: string, args: ToolArgs): Promise<string> {
    // In a real implementation, you would handle these operations securely,
    // possibly by calling a backend API. For now, we'll return mock responses.
    switch (toolName) {
      case "read_file":
        return `Mock content of file: ${args.file_path}`;
      case "write_file":
        return `Successfully wrote to file: ${args.file_path}`;
      case "read_conversation_log":
        return "Mock conversation log content";
      case "list_directory":
        return "Mock directory listing";
      case "get_script_path":
        return "/mock/path/to/script.tsx";
      default:
        return "Unknown tool";
    }
  }

  async sendMessage(
    userMessage: string,
  ): Promise<{ message: string; toolCalls: ToolCall[] }> {
    this.messages.push({ role: "user", content: userMessage });

    try {
      const idToken = await getIdToken();
      const response = (await this.anthropicProxy({
        idToken: idToken,
        apiKey: this.apiKey,
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        messages: this.messages,
        tools: this.tools,
      })) as { data: { content: { text: string; type: string }[] } };

      if (
        !response.data ||
        !response.data.content ||
        response.data.content.length === 0
      ) {
        throw new Error("No response content from Claude");
      }

      let assistantMessage = "";
      for (const block of response.data.content) {
        if (block.type === "text") {
          assistantMessage += block.text;
        }
      }

      this.messages.push({ role: "assistant", content: assistantMessage });

      return {
        message: assistantMessage.trim(),
        // toolCalls: response.toolCalls || [],
        toolCalls: [],
      };

      /*
      if (response.toolsCalls && response.toolsCalls.length > 0) {
        for (const toolCall of response.toolsCalls) {
          formattedResponse += `\nTool used: ${toolCall.function.name}\n`;
          const result = await this.executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments),
          );
          formattedResponse += `Result: ${result}\n`;

          this.messages.push({
            role: "tool",
            content: result,
            tool_call_id: toolCall.id,
          });
        }

        // If tools were called, we need to send another message to get Claude's final response
        const finalResponse = await this.client.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4000,
          messages: this.messages,
        });

        if (finalResponse.content && finalResponse.content.length > 0) {
          formattedResponse +=
            "\nClaude's final response:\n" + finalResponse.content[0].text;
        }
      }

      this.messages.push({ role: "assistant", content: formattedResponse });

      return formattedResponse.trim();
    */
    } catch (error) {
      console.error("Error sending message to Claude:", error);
      throw error;
    }
  }

  getConversationHistory(): Message[] {
    return this.messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .map((block) => (block.type === "text" ? block.text : ""))
              .join(""),
    }));
  }

  clearConversation(): void {
    this.messages = [];
  }
}

export default ClaudeService;
