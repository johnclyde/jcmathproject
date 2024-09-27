import { PlusCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface FileData {
  name: string;
  content: string;
}

interface FileStorageProps {
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
}

const FileStorage: React.FC<FileStorageProps> = ({ files, setFiles }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [newFileName, setNewFileName] = useState<string>("");

  const handleContentChange = (index: number, content: string) => {
    const newFiles = [...files];
    newFiles[index].content = content;
    setFiles(newFiles);
  };

  const addNewFile = () => {
    if (newFileName) {
      setFiles([...files, { name: newFileName, content: "" }]);
      setNewFileName("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-gray-200 p-4">
        <h2 className="text-xl font-semibold mb-2">File Storage</h2>
        <div className="flex">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name"
            className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addNewFile}
            className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600 transition-colors flex items-center"
            type="submit"
          >
            <PlusCircle size={18} className="mr-2" />
            Add File
          </button>
        </div>
      </div>
      <div className="flex-grow flex">
        <div className="w-1/3 bg-gray-200 p-4 overflow-y-auto">
          {files.map((file, index) => (
            <button
              key={file.name}
              onClick={() => setActiveTab(index)}
              className={`w-full text-left p-2 mb-2 rounded ${
                activeTab === index
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
              type="submit"
            >
              {file.name}
            </button>
          ))}
        </div>
        <div className="w-2/3 p-4">
          {files[activeTab] && (
            <textarea
              value={files[activeTab].content}
              onChange={(e) => handleContentChange(activeTab, e.target.value)}
              className="w-full h-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FileStorage;
