import {
  ChevronDownIcon,
  ChevronRightIcon,
  Clipboard,
  Edit,
  FileIcon,
  FolderIcon,
  Save,
  Send,
  Settings,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  clearConversation,
  initializeClaudeService,
  sendMessage,
} from "../api/claudeApi";
import type { Message } from "../services/ClaudeService";
import { v4 as uuidv4 } from "../utils/uuid";

interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  uuid?: string;
  selected?: boolean;
  created_at?: string;
}

const ClaudeChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<
    {
      uuid: string;
      name: string;
      content: string;
      selected: boolean;
      created_at: string;
    }[]
  >([]);
  const [activeFile, setActiveFile] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pastedContent, setPastedContent] = useState<string>("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showClobberWarning, setShowClobberWarning] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sessionApiKey = sessionStorage.getItem("anthropicApiKey");
    if (sessionApiKey) {
      setApiKey(sessionApiKey);
      initializeClaudeService(sessionApiKey);
      setShowApiKeyInput(false);
    }

    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    const savedFiles = localStorage.getItem("files");
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  const organizeFiles = useCallback(() => {
    const root: FileNode = { name: "root", type: "directory", children: [] };

    for (const file of files) {
      const pathParts = file.name.split("/");
      let currentNode = root;

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // It's a file
          currentNode.children?.push({
            name: part,
            type: "file",
            content: file.content,
            uuid: file.uuid,
            selected: file.selected,
            created_at: file.created_at,
          });
        } else {
          // It's a directory
          let dirNode = currentNode.children?.find(
            (child) => child.name === part && child.type === "directory",
          );
          if (!dirNode) {
            dirNode = { name: part, type: "directory", children: [] };
            currentNode.children?.push(dirNode);
          }
          currentNode = dirNode;
        }
      });
    }

    // Sort children alphabetically
    const sortNode = (node: FileNode) => {
      if (node.children) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sortNode);
      }
    };
    sortNode(root);

    setFileStructure(root.children || []);
  }, [files]);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  useEffect(() => {
    organizeFiles();
  }, [organizeFiles]);

  const renderFileTree = (nodes: FileNode[], path = "") => {
    return nodes.map((node) => {
      const currentPath = `${path}/${node.name}`;
      if (node.type === "directory") {
        const isExpanded = expandedDirs.has(currentPath);
        const hasSelectedChildren = node.children?.some(
          (child) => child.type === "file" && child.selected,
        );
        return (
          <div key={currentPath}>
            <div
              className="flex items-center cursor-pointer hover:bg-gray-100 p-1"
              onClick={() => {
                if (!hasSelectedChildren) {
                  toggleDir(currentPath);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (!hasSelectedChildren) {
                    toggleDir(currentPath);
                  }
                }
              }}
              role="button"
              tabIndex={0}
            >
              {isExpanded ? (
                <ChevronDownIcon size={16} />
              ) : (
                <ChevronRightIcon size={16} />
              )}
              <FolderIcon size={16} className="mr-1 text-yellow-500" />
              <span>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div className="ml-4">
                {renderFileTree(node.children, currentPath)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div
          key={currentPath}
          className="flex items-center p-1 hover:bg-gray-100"
        >
          <input
            type="checkbox"
            checked={node.selected}
            onChange={() => toggleFileSelection(node.uuid as string)}
            className="mr-2"
          />
          <FileIcon size={16} className="mr-1 text-gray-500" />
          <span
            className="cursor-pointer"
            onClick={() => handleFileClick(node.uuid as string)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleFileClick(node.uuid as string);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {node.name}
          </span>
        </div>
      );
    });
  };

  useEffect(() => {
    const sessionApiKey = sessionStorage.getItem("anthropicApiKey");
    if (sessionApiKey) {
      setApiKey(sessionApiKey);
      initializeClaudeService(sessionApiKey);
      setShowApiKeyInput(false);
    }

    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    const savedFiles = localStorage.getItem("files");
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("files", JSON.stringify(files));
  }, [files]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const selectedFiles = files.filter((file) => file.selected);
    const fileContext = selectedFiles
      .map((file) => `${file.name}:\n${file.content}`)
      .join("\n\n");
    const messageWithContext = fileContext
      ? `${fileContext}\n\n${inputMessage}`
      : inputMessage;

    setMessages((prev) => [...prev, { role: "user", content: inputMessage }]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await sendMessage(messageWithContext);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.message },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "An error occurred while processing your message.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim() === "") return;
    sessionStorage.setItem("anthropicApiKey", apiKey);
    initializeClaudeService(apiKey);
    setShowApiKeyInput(false);
  };

  const handleResetApiKey = () => {
    setApiKey("");
    setShowApiKeyInput(true);
    sessionStorage.removeItem("anthropicApiKey");
  };

  const handleClearConversation = () => {
    clearConversation();
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  const addNewFile = () => {
    const fileName = prompt("Enter file name:");
    if (fileName) {
      setFiles([
        ...files,
        {
          uuid: uuidv4(),
          name: fileName,
          content: "",
          selected: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setActiveFile(files.length);
    }
  };

  const handleFileClick = (uuid: string) => {
    const fileIndex = files.findIndex((file) => file.uuid === uuid);
    if (fileIndex !== -1) {
      setActiveFile(fileIndex);
    }
  };

  const updateFileContent = (content: string) => {
    if (activeFile !== null) {
      const updatedFiles = [...files];
      updatedFiles[activeFile].content = content;
      setFiles(updatedFiles);
    }
  };

  const toggleFileSelection = (uuid: string) => {
    setFiles(
      files.map((file) =>
        file.uuid === uuid ? { ...file, selected: !file.selected } : file,
      ),
    );
  };

  const updateMessage = (index: number, content: string) => {
    const updatedMessages = [...messages];
    updatedMessages[index].content = content;
    setMessages(updatedMessages);
  };

  const toggleMessageEdit = (index: number) => {
    setEditingMessageId(editingMessageId === index ? null : index);
  };

  const dumpToJson = () => {
    const data = {
      messages,
      files,
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "claude_chat_dump.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setMessages(data.messages);
          setFiles(data.files);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteLoad = () => {
    try {
      const parsedFiles = JSON.parse(pastedContent);
      const newFiles = parsedFiles.map(
        (file: {
          uuid?: string;
          file_name: string;
          content: string;
          created_at?: string;
        }) => ({
          uuid: file.uuid || uuidv4(),
          name: file.file_name,
          content: file.content,
          selected: false,
          created_at: file.created_at || new Date().toISOString(),
        }),
      );

      if (files.length > 0) {
        setShowClobberWarning(true);
      } else {
        setFiles(newFiles);
        setPastedContent("");
        setShowPasteModal(false);
      }
    } catch (error) {
      console.error("Error parsing pasted content:", error);
      alert(
        "Error parsing pasted content. Please check the format and try again.",
      );
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isEditing = editingMessageId === index;
    return (
      <div
        className={`mb-4 ${
          message.role === "user" ? "text-right" : "text-left"
        }`}
      >
        <div
          className={`inline-block max-w-3/4 p-3 rounded-lg ${
            message.role === "user" ? "bg-blue-100" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold">
              {message.role === "user" ? "You" : "Claude"}
            </span>
            <button
              onClick={() => toggleMessageEdit(index)}
              className="text-gray-500 hover:text-gray-700"
              type="submit"
            >
              {isEditing ? <Save size={14} /> : <Edit size={14} />}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={message.content}
              onChange={(e) => updateMessage(index, e.target.value)}
              className="w-full bg-transparent resize-none outline-none"
              rows={message.content.split("\n").length}
            />
          ) : (
            <ReactMarkdown
              components={{
                code({
                  inline,
                  className,
                  children,
                  ...props
                }: {
                  inline?: boolean;
                  className?: string;
                  children: React.ReactNode;
                }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-100">
      {/* File Sidebar */}
      <div className="w-80 bg-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Files</h2>
            <button
              onClick={addNewFile}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
              type="submit"
            >
              + New File
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {renderFileTree(fileStructure)}
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleResetApiKey}
            className="w-full flex items-center justify-center bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded text-sm"
            type="submit"
          >
            <Settings size={14} className="mr-2" />
            Reset API Key
          </button>
          <button
            onClick={dumpToJson}
            className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
            type="submit"
          >
            <Save size={14} className="mr-2" />
            Save to JSON
          </button>
          <label className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm cursor-pointer">
            <Upload size={14} className="mr-2" />
            Load from JSON
            <input
              type="file"
              accept=".json"
              onChange={loadFromJson}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowPasteModal(true)}
            className="w-full flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
            type="submit"
          >
            <Clipboard className="mr-2" size={14} />
            Paste File List
          </button>
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col">
        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={`message-${message.role}-${message.content.substring(0, 10)}`}
              className="mb-4"
            >
              {renderMessage(message, index)}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 p-3 rounded-lg animate-pulse">
                Claude is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Footer */}
        <div className="bg-white border-t p-4">
          {showApiKeyInput ? (
            <div className="flex items-center">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter Anthropic API Key"
                className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleApiKeySubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                type="submit"
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 flex items-center"
                type="submit"
              >
                <Send size={18} className="mr-2" />
                Send
              </button>
              <button
                onClick={handleClearConversation}
                className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                type="submit"
              >
                <X size={18} className="mr-2" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      {/* File Content Area */}
      {activeFile !== null && (
        <div className="w-96 bg-white p-4 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">
              {files[activeFile].name}
            </h2>
            <textarea
              value={files[activeFile].content}
              onChange={(e) => updateFileContent(e.target.value)}
              className="flex-grow w-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
            />
          </div>
        </div>
      )}
      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Paste File List</h2>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              className="w-full h-64 p-2 border rounded mb-4"
              placeholder="Paste your file list here..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                type="submit"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteLoad}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                type="submit"
              >
                Load Files
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clobber Warning Modal */}
      {showClobberWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Warning</h2>
            <p className="mb-4">
              Loading these files will replace your existing files. Are you sure
              you want to continue?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClobberWarning(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                type="submit"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setFiles(
                    JSON.parse(pastedContent).map(
                      (file: {
                        uuid?: string;
                        file_name: string;
                        content: string;
                        created_at?: string;
                      }) => ({
                        uuid: file.uuid || uuidv4(),
                        name: file.file_name,
                        content: file.content,
                        selected: false,
                        created_at: file.created_at || new Date().toISOString(),
                      }),
                    ),
                  );
                  setPastedContent("");
                  setShowClobberWarning(false);
                  setShowPasteModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                type="submit"
              >
                Replace Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeChat;
