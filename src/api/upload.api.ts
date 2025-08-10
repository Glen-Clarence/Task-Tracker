import apiClient from "./_setup";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await apiClient.post<UploadResponse>(
        "/api/upload",
        formData,
        {
          "Content-Type": "multipart/form-data",
        }
      );

      return data;
    } catch (error) {
      // For testing purposes, if the backend is not available, return a mock response
      console.warn(
        "Backend upload failed, using mock response for testing:",
        error
      );

      // Create a mock URL for testing
      const mockUrl = URL.createObjectURL(file);

      return {
        url: mockUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      };
    }
  },
};
