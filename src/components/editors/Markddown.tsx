import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  Eye,
  EyeOff,
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Minus,
  Paperclip,
  X,
} from "lucide-react";

interface FileAttachment {
  id: number;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface SlashCommand {
  command: string;
  description: string;
  template: string;
}

interface Position {
  top: number;
  left: number;
}

export interface EditorChangeEvent {
  id: string;
  content: string;
  files: FileAttachment[];
}

export interface FileChangeEvent {
  id: string;
  content?: string;
  files: FileAttachment[];
  newFiles?: FileAttachment[];
  removedFileId?: number;
}

interface GitHubMarkdownEditorProps {
  id?: string;
  placeholder?: string;
  initialContent?: string;
  onChange?: (event: EditorChangeEvent) => void;
  onFileChange?: (event: FileChangeEvent) => void;
  users?: string[];
  className?: string;
  showHeader?: boolean;
}

const GitHubMarkdownEditor: React.FC<GitHubMarkdownEditorProps> = ({
  id = "default",
  placeholder = "Write your Description here. Use / for commands, @ to mention users",
  initialContent = "",
  onChange,
  onFileChange,
  users = ["john-doe", "jane-smith", "dev-team", "alice-cooper", "bob-wilson"],
  className = "",
  showHeader = true,
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [showSlashMenu, setShowSlashMenu] = useState<boolean>(false);
  const [showMentionMenu, setShowMentionMenu] = useState<boolean>(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const [mentionMenuPosition, setMentionMenuPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data for mentions and slash commands
  const slashCommands: SlashCommand[] = [
    {
      command: "/alert",
      description: "Insert alert",
      template: "", // Will be handled by modal
    },
    {
      command: "/code",
      description: "Code block",
      template: "```\nYour code here\n```",
    },
    {
      command: "/todo",
      description: "Task list",
      template: "- [ ] Task 1\n- [ ] Task 2\n- [x] Completed task",
    },
    {
      command: "/quote",
      description: "Quote block",
      template: "> Your quote here",
    },
    { command: "/h1", description: "Heading 1", template: "# " },
    { command: "/h2", description: "Heading 2", template: "## " },
    { command: "/h3", description: "Heading 3", template: "### " },
    { command: "/issue", description: "Link to issue", template: "#" },
    { command: "/pr", description: "Link to PR", template: "#" },
  ];

  // Modal state for table and alert
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [alertDropdownPosition, setAlertDropdownPosition] = useState<Position>({
    top: 0,
    left: 0,
  });

  // Function to get cursor coordinates
  const getCursorCoordinates = (
    textarea: HTMLTextAreaElement,
    position: number
  ) => {
    const div = document.createElement("div");
    const copyStyle = getComputedStyle(textarea);

    // Copy textarea styles to div
    for (const prop of copyStyle) {
      div.style.setProperty(
        prop,
        copyStyle.getPropertyValue(prop),
        copyStyle.getPropertyPriority(prop)
      );
    }

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.top = "0";
    div.style.left = "0";

    document.body.appendChild(div);

    const textBeforeCursor = textarea.value.substring(0, position);
    div.textContent = textBeforeCursor;

    const span = document.createElement("span");
    span.textContent = textarea.value.substring(position) || ".";
    div.appendChild(span);

    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();

    document.body.removeChild(div);

    return {
      top: textareaRect.top + (spanRect.top - divRect.top) + textarea.scrollTop,
      left:
        textareaRect.left +
        (spanRect.left - divRect.left) +
        textarea.scrollLeft,
    };
  };

  const insertMarkdown = (before: string, after: string = ""): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);
    setContent(newText);

    setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);
    setCursorPosition(cursorPos);

    // Send data back to parent
    if (onChange) {
      onChange({
        id,
        content: value,
        files,
      });
    }

    // Check for slash commands
    const textBeforeCursor = value.substring(0, cursorPos);
    const lines = textBeforeCursor.split("\n");
    const lastLine = lines[lines.length - 1] || "";
    const slashMatch = lastLine.match(/\/(\w*)$/);

    if (slashMatch) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const coords = getCursorCoordinates(textarea, cursorPos);
      setSlashMenuPosition({
        top: coords.top + 20, // Add some offset below the cursor
        left: coords.left,
      });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }

    // Check for @mentions
    const mentionMatch = lastLine.match(/@(\w*)$/);
    if (mentionMatch) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const coords = getCursorCoordinates(textarea, cursorPos);
      setMentionMenuPosition({
        top: coords.top + 20, // Add some offset below the cursor
        left: coords.left,
      });
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  // Override insertSlashCommand to handle /table and /alert
  const insertSlashCommand = (command: SlashCommand): void => {
    if (command.command === "/alert") {
      setShowSlashMenu(false);
      // Show alert dropdown at cursor
      const textarea = textareaRef.current;
      if (!textarea) return;
      const coords = getCursorCoordinates(textarea, cursorPosition);
      setAlertDropdownPosition({ top: coords.top + 20, left: coords.left });
      setShowAlertDropdown(true);
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");
    // Insert the template and set caret after the template
    const newContent =
      beforeCursor.substring(0, lastSlashIndex) +
      command.template +
      afterCursor;
    setContent(newContent);
    setShowSlashMenu(false);
    setTimeout(() => {
      textarea.focus();
      const pos =
        beforeCursor.substring(0, lastSlashIndex).length +
        command.template.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const insertMention = (username: string): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    const newContent =
      beforeCursor.substring(0, lastAtIndex) + `@${username} ` + afterCursor;
    setContent(newContent);
    setShowMentionMenu(false);

    setTimeout(() => textarea.focus(), 0);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]): void => {
    const processedFiles: FileAttachment[] = newFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    const updatedFiles = [...files, ...processedFiles];
    setFiles(updatedFiles);

    // Insert file references in markdown
    const fileReferences = processedFiles
      .map((f) => {
        if (f.type.startsWith("image/")) {
          return `![${f.name}](${f.name})`;
        } else {
          return `[${f.name}](${f.name})`;
        }
      })
      .join("\n");

    const newContent = content + "\n" + fileReferences;
    setContent(newContent);

    // Send data back to parent
    if (onChange) {
      onChange({
        id,
        content: newContent,
        files: updatedFiles,
      });
    }

    if (onFileChange) {
      onFileChange({
        id,
        content: newContent,
        files: updatedFiles,
        newFiles: processedFiles,
      });
    }
  };

  const removeFile = (fileId: number): void => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);

    // Send updated data back to parent
    if (onChange) {
      onChange({
        id,
        content,
        files: updatedFiles,
      });
    }

    if (onFileChange) {
      onFileChange({
        id,
        content,
        files: updatedFiles,
        removedFileId: fileId,
      });
    }
  };

  const formatMarkdown = (text: string): string => {
    return (
      text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /`(.*?)`/g,
          '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>'
        )
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>')
        .replace(
          /^> (.*$)/gm,
          '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>'
        )
        .replace(
          /^- \[x\] (.*$)/gm,
          '<div class="flex items-center"><input type="checkbox" checked disabled class="mr-2"> $1</div>'
        )
        .replace(
          /^- \[ \] (.*$)/gm,
          '<div class="flex items-center"><input type="checkbox" disabled class="mr-2"> $1</div>'
        )
        .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
        .replace(
          /@(\w+)/g,
          '<span class="text-blue-600 font-medium">@$1</span>'
        )
        .replace(/#(\d+)/g, '<span class="text-blue-600">#$1</span>')
        .replace(
          /```([\s\S]*?)```/g,
          '<pre class="bg-gray-100 p-3 rounded overflow-x-auto"><code>$1</code></pre>'
        )
        // Render [!TYPE] alerts
        .replace(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?([\s\S]*?)(?=\n{2,}|$)/gm,
          (match, type, content) => {
            const colors: Record<string, string> = {
              NOTE: "border-blue-400 bg-blue-50",
              TIP: "border-green-400 bg-green-50",
              IMPORTANT: "border-purple-400 bg-purple-50",
              WARNING: "border-yellow-400 bg-yellow-50",
              CAUTION: "border-red-400 bg-red-50",
            };
            const labels: Record<string, string> = {
              NOTE: "Note",
              TIP: "Tip",
              IMPORTANT: "Important",
              WARNING: "Warning",
              CAUTION: "Caution",
            };
            const t = type as keyof typeof colors;
            return `<div class="my-3 p-3 border-l-4 ${colors[t]} rounded">
              <div class="font-bold mb-1">${labels[t]}</div>
              <div>${content.replace(/\n/g, "<br>")}</div>
            </div>`;
          }
        )
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          '<img src="$2" alt="$1" class="max-w-xs my-2" />'
        )
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        .replace(/\n/g, "<br>")
    );
  };

  // Handler for alert dropdown selection
  const handleAlertTypeSelect = (type: string) => {
    // Replace /alert with [!TYPE] and a space, caret after the space
    const textarea = textareaRef.current;
    if (!textarea) return;
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");
    const alertSyntax = `[!${type.toUpperCase()}] `;
    const newContent =
      beforeCursor.substring(0, lastSlashIndex) + alertSyntax + afterCursor;
    setContent(newContent);
    setShowAlertDropdown(false);
    setTimeout(() => {
      textarea.focus();
      const pos =
        beforeCursor.substring(0, lastSlashIndex).length + alertSyntax.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className={`max-w-4xl mx-auto relative ${className}`}>
      <div className="rounded-lg overflow-hidden">
        {/* Toolbar */}
        {showHeader && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-300">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("`", "`")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Code"
              >
                <Code size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Link"
              >
                <Link size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("- ", "")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Unordered List"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("1. ", "")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Ordered List"
              >
                <ListOrdered size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ", "")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Quote"
              >
                <Quote size={16} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("---\n", "")}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Horizontal Rule"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Attach files"
              >
                <Paperclip size={16} />
              </button>
            </div>
          </div>
        )}
        {/* Editor/Preview */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center space-x-1 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
        >
          {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="text-sm">{isPreview ? "Edit" : "Preview"}</span>
        </button>
        <div
          className={`min-h-[300px] relative ${
            isDragOver ? "bg-blue-50 border-blue-300" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
        >
          {isPreview ? (
            <div
              className="prose max-w-none min-h-[300px] p-3"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          ) : (
            <>
              <textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={content}
                onChange={handleTextareaChange}
                className="w-full h-72 p-3 focus:bg-[#f2f2f2] border-none resize-none focus:outline-none text-sm leading-relaxed"
              />
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-75 border-2 border-dashed border-blue-300">
                  <p className="text-blue-600 font-medium">
                    Drop files here to attach
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {/* File attachments */}
        {files.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-300">
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-2 bg-white px-3 py-1 rounded border text-sm"
                >
                  <Paperclip size={12} />
                  <span>{file.name}</span>
                  <span className="text-gray-500">
                    ({Math.round(file.size / 1024)}KB)
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Click to add files area */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Paste, drop, or click to add files
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="!hidden"
      />

      {/* Slash Commands Menu */}
      {showSlashMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          {slashCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => insertSlashCommand(cmd)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between min-w-48"
              autoFocus={index === 0}
            >
              <div>
                <div className="font-medium text-sm">{cmd.command}</div>
                <div className="text-xs text-gray-500">{cmd.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mentions Menu */}
      {showMentionMenu && (
        <div
          className="fixed rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          style={{
            top: mentionMenuPosition.top,
            left: mentionMenuPosition.left,
          }}
        >
          {users.map((user, index) => (
            <button
              key={index}
              onClick={() => insertMention(user)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 min-w-40"
            >
              <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>
              <span className="text-sm">{user}</span>
            </button>
          ))}
        </div>
      )}

      {/* Alert Dropdown (Popover) */}
      {showAlertDropdown && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-50"
          style={{
            top: alertDropdownPosition.top,
            left: alertDropdownPosition.left,
            minWidth: 160,
          }}
        >
          {[
            { value: "NOTE", label: "Note" },
            { value: "TIP", label: "Tip" },
            { value: "IMPORTANT", label: "Important" },
            { value: "WARNING", label: "Warning" },
            { value: "CAUTION", label: "Caution" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAlertTypeSelect(opt.value)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitHubMarkdownEditor;
