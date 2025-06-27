import ExampleTheme from "../ui/themes/ExpTheme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
// import type { ErrorBoundaryType } from "@lexical/react/LexicalRichTextPlugin";
// import TreeViewPlugin from "../ui/plugins/TreeViewPlugin";
import ToolbarPlugin from "../ui/plugins/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  EditorState,
} from "lexical";

// import ListMaxIndentLevelPlugin from "../ui/plugins/ListMaxIndentLevelPlugin";
// import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
// import AutoLinkPlugin from "./plugins/AutoLinkPlugin";

function Placeholder() {
  return (
    <div className="editor-placeholder absolute top-4 left-4 text-gray-400 text-sm">
      Enter some rich text...
    </div>
  );
}

const editorConfig = {
  // The editor theme
  theme: ExampleTheme,
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
  ],
  namespace: "MyEditor",
};

function OnChangePlugin({
  onChange,
  initialContent,
}: {
  onChange: (editorState: EditorState) => void;
  initialContent?: string;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState);
    });
  }, [editor, onChange]);
  useEffect(() => {
    if (!initialContent) return;

    try {
      editor.update(() => {
        const editorState = editor.parseEditorState(initialContent);
        editor.setEditorState(editorState);
      });
    } catch (e) {
      editor.update(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(initialContent, "text/html");
        const text = doc.body.textContent || "";
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        const root = $getRoot();
        root.clear();
        root.append(paragraph);
      });
    }
  }, [initialContent, editor]);
  return null;
}

export default function Editor({
  initialContent,
  setShowDoodle,
  showDoodle,
  updateContent,
  title,
}: {
  initialContent?: string;
  setShowDoodle: (show: boolean) => void;
  showDoodle: boolean;
  updateContent: (content: string) => void;
  title: string;
}) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevContentRef = useRef<string>("");
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Reset hasInitialized when initialContent changes
    hasInitializedRef.current = false;
  }, [initialContent]);

  function onChange(editorState: EditorState) {
    const editorStateJSON = editorState.toJSON();
    const serialized = JSON.stringify(editorStateJSON);

    // Skip the first onChange after load
    if (!hasInitializedRef.current) {
      prevContentRef.current = serialized;
      hasInitializedRef.current = true;
      return;
    }

    if (serialized === prevContentRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      prevContentRef.current = serialized;
      updateContent(serialized);
    }, 500);
  }

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container relative  bg-transparent shadow-sm">
        <ToolbarPlugin
          setShowDoodle={setShowDoodle}
          showDoodle={showDoodle}
          title={title}
        />
        <div className="editor-inner bg-transparent relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input  min-h-[150px] resize-none text-sm text-white caret-white relative outline-none p-4" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {/* <HistoryPlugin /> */}
          {/* <TreeViewPlugin /> */}
          <AutoFocusPlugin />
          {/* <CodeHighlightPlugin /> */}
          <ListPlugin />
          <LinkPlugin />
          {/* <AutoLinkPlugin /> */}
          {/* <ListMaxIndentLevelPlugin maxDepth={7} /> */}
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={onChange} initialContent={initialContent} />
        </div>
      </div>
    </LexicalComposer>
  );
}
