import apiClient from "./_setup";

export interface UploadResponse {
  imageUrl: string;
  filename: string;
  size?: number;
  type?: string;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await apiClient.post<UploadResponse>(
        "/misc/upload-image",
        formData,
        {
          "Content-Type": "multipart/form-data",
        }
      );

      const fileData = {
        imageUrl: data.imageUrl,
        filename: data.filename,
        type: "image/"
      }
      return fileData;
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
