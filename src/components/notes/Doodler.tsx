import { ArrowBigLeft } from "lucide-react";
import Canvas from "../modals/Canvas";
import { Button } from "../ui/button";
import useNotes from "./useNotes";
import { useNavigate } from "react-router";

const Doodler: React.FC = () => {
  const { note, updateScene, isNoteLoaded } = useNotes();

  const navigate = useNavigate();

  return (
    <div className="w-[83vw] h-[80vh]">
      {isNoteLoaded && note && (
        <>
          <span className="flex gap-4">
            <Button onClick={() => navigate("/folders/notes")}>
              <ArrowBigLeft />
            </Button>
            <h2 className="text-white text-xl mb-4">{note.name}</h2>
          </span>
          <Canvas
            key={note.id}
            initialData={note.content}
            onUpdateScene={updateScene}
          />
        </>
      )}
    </div>
  );
};

export default Doodler;
