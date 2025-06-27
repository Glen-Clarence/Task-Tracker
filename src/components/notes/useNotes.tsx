import { useMutation, useQuery } from "@tanstack/react-query";
import { Note, notesApi } from "@/api/notes.api";
import { foldersApi } from "@/api/folders.api";
import { useParams } from "react-router";
import { useCallback } from "react";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const useNotes = () => {
  const { id } = useParams();

  const { data: note, isSuccess: isNoteLoaded } = useQuery<Note>({
    queryKey: ["note", id],
    queryFn: ({ queryKey }) => notesApi.getdoodle(queryKey[1] as string),
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const updateNote = useMutation({
    mutationFn: notesApi.updateDoodle,
    // onSuccess: updateCache.onUpdate,
  });

  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notes"],
    queryFn: notesApi.getAll,
  });

  const {
    data: folders = [],
    isLoading: isLoadingFolders,
    error: errorFolders,
  } = useQuery({
    queryKey: ["folder"],
    queryFn: foldersApi.getAll,
  });

  const updateScene = useCallback(
    (canvas: ExcalidrawElement[]) => {
      if (!id) return;
      updateNote.mutate({
        id,
        updates: {
          canvas,
        },
      });
    },
    [id, updateNote.mutate]
  );

  const updateContent = useCallback(
    (content: string) => {
      if (!id) return;
      updateNote.mutate({
        id,
        updates: {
          content,
        },
      });
    },
    [id, updateNote.mutate]
  );

  return {
    notes,
    note,
    isNoteLoaded,
    folders,
    isLoading,
    error,
    isLoadingFolders,
    errorFolders,
    updateScene,
    updateContent,
  };
};

export default useNotes;
