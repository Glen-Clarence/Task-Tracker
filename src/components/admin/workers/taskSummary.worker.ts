import axios from "axios";

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  if (event.data.type === "GET_TASK_SUMMARY") {
    try {
      console.log("Worker making API call...");
      const { token } = event.data;

      // Make the API call directly with axios
      const response = await axios.get(
        "http://localhost:3000/misc/task-summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      self.postMessage(response.data);
    } catch (error: unknown) {
      console.error("Worker API error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      self.postMessage({ error: errorMessage });
    }
  }
};

// Export an empty object to satisfy TypeScript
export {};
