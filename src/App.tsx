import { Suspense } from "react";
import { UserProvider } from "./context/useUserContext";
import { Approuter } from "./router/Approuter";
import { App as AntdApp } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import "./App.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <AntdApp>
            <Approuter />
          </AntdApp>
        </Suspense>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
