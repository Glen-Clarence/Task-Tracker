import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import { useCallback, useState, useEffect } from "react";
import { uploadApi, UploadResponse } from "../../../api/upload.api";

const ImageUploadPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDropZone, setShowDropZone] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse> => {
      try {
        const response = await uploadApi.uploadFile(file);
        return response;
      } catch (error) {
        console.error("Upload error:", error);
        throw new Error("Failed to upload file");
      }
    },
    []
  );

  const insertImage = useCallback(
    (url: string, altText: string = "") => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Create a paragraph node to contain the image
          const paragraphNode = $createParagraphNode();
          const textNode = $createTextNode("");
          paragraphNode.append(textNode);
          selection.insertNodes([paragraphNode]);

          // Insert the image element after the paragraph
          const range = document.createRange();
          const paragraphElement = editor.getElementByKey(
            paragraphNode.getKey()
          );
          if (paragraphElement) {
            range.selectNodeContents(paragraphElement);
            range.collapse(false);

            const imgElement = document.createElement("img");
            imgElement.src = url;
            imgElement.alt = altText;
            imgElement.style.maxWidth = "100%";
            imgElement.style.height = "auto";
            imgElement.style.margin = "8px 0";
            imgElement.style.borderRadius = "4px";

            range.insertNode(imgElement);
          }
        }
      });
    },
    [editor]
  );

  const insertVideo = useCallback(
    (url: string, title: string = "") => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Create a paragraph node to contain the video
          const paragraphNode = $createParagraphNode();
          const textNode = $createTextNode("");
          paragraphNode.append(textNode);
          selection.insertNodes([paragraphNode]);

          // Insert the video element after the paragraph
          const range = document.createRange();
          const paragraphElement = editor.getElementByKey(
            paragraphNode.getKey()
          );
          if (paragraphElement) {
            range.selectNodeContents(paragraphElement);
            range.collapse(false);

            const videoElement = document.createElement("video");
            videoElement.src = url;
            videoElement.controls = true;
            videoElement.style.maxWidth = "100%";
            videoElement.style.height = "auto";
            videoElement.style.margin = "8px 0";
            videoElement.style.borderRadius = "4px";
            if (title) {
              videoElement.title = title;
            }

            range.insertNode(videoElement);
          }
        }
      });
    },
    [editor]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert("Please select an image or video file");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const uploadResponse = await uploadFile(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Insert the media into the editor
        if (isImage) {
          insertImage(uploadResponse.url, file.name);
        } else if (isVideo) {
          insertVideo(uploadResponse.url, file.name);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadFile, insertImage, insertVideo]
  );

  // Add drag and drop event listeners to the editor
  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleEditorDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropZone(true);
    };

    const handleEditorDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropZone(false);
    };

    const handleEditorDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropZone(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      await handleFileUpload(file);
    };

    editorElement.addEventListener("dragover", handleEditorDragOver);
    editorElement.addEventListener("dragleave", handleEditorDragLeave);
    editorElement.addEventListener("drop", handleEditorDrop);

    return () => {
      editorElement.removeEventListener("dragover", handleEditorDragOver);
      editorElement.removeEventListener("dragleave", handleEditorDragLeave);
      editorElement.removeEventListener("drop", handleEditorDrop);
    };
  }, [editor, handleFileUpload]);

  return (
    <>
      {/* Drop zone overlay */}
      {showDropZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-8 text-center shadow-lg">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">Drop your file here</h3>
            <p className="text-gray-600">Images and videos are supported</p>
          </div>
        </div>
      )}

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">
              Uploading... {uploadProgress}%
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploadPlugin;
