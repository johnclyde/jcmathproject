import type React from "react";
import type { Message } from "../services/ClaudeService";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div
          key={`message-${message.role}-${message.content.substring(0, 10)}`}
          className={`message ${message.role}`}
        >
          <strong>{message.role === "user" ? "You" : "Claude"}:</strong>
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
