import apiClient from "./_setup";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export interface Note {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  canvas?: ExcalidrawElement[];
  content?: string;
}

export const notesApi = {
  getAll: async (): Promise<Note[]> => {
    const { data } = await apiClient.get<Note[]>("/notes");
    return data;
  },
  create: async (note: Note): Promise<Note> => {
    const { data } = await apiClient.post<Note>("/notes", note);
    return data;
  },
  getdoodle: async (id: string): Promise<Note> => {
    const { data } = await apiClient.get<Note>(`/notes/${id}`);
    return data;
  },
  updateDoodle: async ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<Note>;
  }): Promise<Note> => {
    const payload = {
      id,
      name: updates.name,
      content: updates.content,
      canvas: updates.canvas,
    };
    const { data } = await apiClient.patch<Note>(`/notes/${id}`, payload);
    return data;
  },
};
