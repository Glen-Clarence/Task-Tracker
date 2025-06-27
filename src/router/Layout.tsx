import { Outlet } from "react-router";
import Sidebar from "../components/sidebar/Sidebar";

const Layout = () => {
  return (
    <div
      // style={{
      //   backgroundImage: `url(${bg})`,
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      //   backgroundRepeat: "no-repeat",
      // }}
      className="h-screen w-screen overflow-hidden bg-[#141414]/90"
    >
      <div className="pr-4 flex h-[calc(100vh-1rem)] bg-[#141414]/60">
        <Sidebar />
        <main className="flex-1 overflow-hidden pt-6 px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
