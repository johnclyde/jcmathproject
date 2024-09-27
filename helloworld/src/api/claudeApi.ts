import ClaudeService, { type Message } from "../services/ClaudeService";

let claudeService: ClaudeService | null = null;

export const sendMessage = async (
  userMessage: string,
  // ): Promise<{ message: string; toolCalls: any[] }> => {
): Promise<{ message: string }> => {
  if (!claudeService) {
    throw new Error(
      "Claude service not initialized. Please set API key first.",
    );
  }

  try {
    const response = await claudeService.sendMessage(userMessage);
    return response;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

export const initializeClaudeService = (apiKey: string): void => {
  claudeService = new ClaudeService(apiKey);
};

export const getConversationHistory = (): Message[] => {
  return claudeService ? claudeService.getConversationHistory() : [];
};

export const clearConversation = (): void => {
  if (claudeService) {
    claudeService.clearConversation();
  }
};
