import { useState } from "react";
import SimpleEditor from "../editors/Editor";

interface EditorProps {
  id?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
}

const Editor = () => {
  return (
    <div className="w-full h-full">
      <SimpleEditor content={{}} update={(re) => console.log(re)} />
    </div>
  );
};

export default Editor;
