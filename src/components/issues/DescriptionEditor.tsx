import { useState } from "react";
import { EditorState } from "lexical";
import Lexical from "../editors/Lexical";

type DescriptionEditorProps = {
  initialContent?: string;
  updateContent?: (content: string) => void;
  title?: string;
  showDoodle?: boolean;
  setShowDoodle?: (open: boolean) => void;
  initialConfig?: unknown;
  onChange?: (editorState: EditorState) => void;
};

export const DescriptionEditor = ({
  initialContent = "",
  updateContent = () => {},
  title = "",
  showDoodle: showDoodleProp,
  setShowDoodle: setShowDoodleProp,
}: DescriptionEditorProps) => {
  const [internalShowDoodle, setInternalShowDoodle] = useState(false);
  const showDoodle = showDoodleProp ?? internalShowDoodle;
  const setShowDoodle = setShowDoodleProp ?? setInternalShowDoodle;

  return (
    <Lexical
      setShowDoodle={setShowDoodle}
      showDoodle={showDoodle}
      initialContent={initialContent}
      updateContent={updateContent}
      title={title}
    />
  );
};
