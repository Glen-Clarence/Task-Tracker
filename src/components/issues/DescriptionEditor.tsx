import { useState } from "react";
import { EditorState } from "lexical";
import Lexical from "../editors/Lexical";

type DescriptionEditorProps = {
  title?: string;
  showDoodle?: boolean;
  setShowDoodle?: (open: boolean) => void;
  initialConfig?: unknown;
  onChange?: (editorState: EditorState) => void;
};

export const DescriptionEditor = ({
  title = "",
  showDoodle: showDoodleProp,
  setShowDoodle: setShowDoodleProp,
  initialConfig,
  onChange,
}: DescriptionEditorProps) => {
  const [internalShowDoodle, setInternalShowDoodle] = useState(false);
  const showDoodle = showDoodleProp ?? internalShowDoodle;
  const setShowDoodle = setShowDoodleProp ?? setInternalShowDoodle;

  return (
    <Lexical
      setShowDoodle={setShowDoodle}
      showDoodle={showDoodle}
      title={title}
      initialConfig={initialConfig}
      onChange={onChange}
    />
  );
};
