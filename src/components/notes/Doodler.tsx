import { Note } from "@/api/notes.api";
import Canvas from "../modals/Canvas";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const Doodler: React.FC<{
  note: Note | undefined;
  updateScene: (scene: ExcalidrawElement[]) => void;
  isNoteLoaded: boolean;
}> = ({ note, updateScene, isNoteLoaded }) => {
  return (
    <div className="w-[83vw] h-[80vh]">
      {isNoteLoaded && note && (
        <>
          <Canvas
            key={note.id}
            initialData={note.canvas}
            onUpdateScene={updateScene}
          />
        </>
      )}
    </div>
  );
};

export default Doodler;
