import Anthropic from "@anthropic-ai/sdk";
import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface AnthropicProxyRequest {
  apiKey: string;
  model: string;
  max_tokens: number;
  messages: Anthropic.MessageCreateParams["messages"];
  tools?: Anthropic.MessageCreateParams["tools"];
}

const anthropicHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ content: Anthropic.ContentBlock[] }> => {
  logger.info("Called Anthropic endpoint for user", uid);
  const {
    apiKey,
    model,
    max_tokens: maxTokens,
    messages,
    tools,
  } = req.body?.data as AnthropicProxyRequest;

  const callerRef = db.collection("users").doc(uid);
  const callerDoc = await callerRef.get();
  const callerData = callerDoc.data();

  if (!callerData || !callerData.isAdmin) {
    logger.warn("Non-admin user attempted to accept the Anthropic API", uid);
    throw new Error("Unauthorized: Only admin users can use Claude");
  }

  if (!apiKey || !model || !maxTokens || !messages) {
    throw new Error("Missing required parameters");
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages,
      tools,
    } as Anthropic.MessageCreateParams);

    if ("content" in response) {
      // Handle Message response
      if (!response.content || response.content.length === 0) {
        throw new Error("No response content from Claude");
      }

      logger.info("Returning Anthropic response", response.content);
      return { content: response.content };
    }
    // Handle Stream response
    throw new Error("Streaming response not supported");
  } catch (error) {
    logger.error("Error calling Anthropic API:", error);
    throw error;
  }
};

export const anthropicProxy = (deps: Dependencies) =>
  createAuthenticatedFunction(anthropicHandler, deps);
