import Lexical from "../editors/Lexical";
import { useState } from "react";
import Doodler from "./Doodler";
import useNotes from "./useNotes";

import { Sheet, SheetContent } from "@/components/ui/sheet";

const Obsidian = () => {
  const [showDoodle, setShowDoodle] = useState(false);

  const { note, updateScene, isNoteLoaded, updateContent } = useNotes();

  return (
    <div className="container mx-auto text-white">
      <Lexical
        setShowDoodle={setShowDoodle}
        showDoodle={showDoodle}
        initialContent={note?.content}
        updateContent={updateContent}
        title={note?.name as string}
      />

      <Sheet open={showDoodle} onOpenChange={setShowDoodle}>
        <SheetContent side="bottom" className="bg-black border-none pt-4">
          <div className="flex justify-center">
            <Doodler
              note={note}
              updateScene={updateScene}
              isNoteLoaded={isNoteLoaded}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Obsidian;
