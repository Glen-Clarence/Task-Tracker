import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "../ui/plugins/ToolbarPlugin";
// Import any other plugins you need inside this component

// Define the props the editor will accept from the parent form
type DescriptionEditorProps = {
  initialConfig: Parameters<typeof LexicalComposer>[0]['initialConfig'];
  onChange: (editorState: any) => void;
};

export const DescriptionEditor = ({ initialConfig, onChange }: DescriptionEditorProps) => {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col bg-black border border-slate-700 rounded-lg">
        <div className="flex items-center justify-between p-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-1 text-sm text-white bg-slate-800 rounded-md">Write</button>
          </div>
          <ToolbarPlugin setShowDoodle={() => {}} showDoodle={false} title="" />
        </div>
        <div className="relative p-4 min-h-[200px]">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input min-h-[150px] focus:outline-none text-white" />}
            placeholder={<div className="absolute top-4 left-4 text-gray-500 pointer-events-none">Type your description here...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <OnChangePlugin onChange={onChange} />
      </div>
    </LexicalComposer>
  );
};