import { lazy, Suspense, useCallback, useRef, useEffect } from "react";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((module) => ({
    default: module.Excalidraw,
  }))
);

interface CanvasProps {
  initialData?: ExcalidrawElement[];
  excalidrawAPI?: (api: ExcalidrawImperativeAPI) => void;
  onUpdateScene?: (scene: ExcalidrawElement[]) => void;
}

const Canvas = ({ initialData, onUpdateScene }: CanvasProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevElementsRef = useRef<string>("");
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Reset hasInitialized when initialData changes
    hasInitializedRef.current = false;
  }, [initialData]);

  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      if (!onUpdateScene) return;

      const serialized = JSON.stringify(elements);

      // Skip the first onChange after load
      if (!hasInitializedRef.current) {
        prevElementsRef.current = serialized;
        hasInitializedRef.current = true;
        return;
      }

      if (serialized === prevElementsRef.current) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        prevElementsRef.current = serialized;
        onUpdateScene(elements as ExcalidrawElement[]);
      }, 500);
    },
    [onUpdateScene]
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Excalidraw
        theme="dark"
        onChange={onChange}
        initialData={{
          elements: initialData,
          appState: { zenModeEnabled: true },
          scrollToContent: true,
        }}
      />
    </Suspense>
  );
};

export default Canvas;
