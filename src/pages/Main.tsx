import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import {
  BridgedIframe,
  BridgedIframeHandle,
} from "../components/BridgedIframe";
import Navbar from "../components/Navbar";

const pages = [
  { id: "home", label: "DISCOVER" },
  { id: "inventory", label: "SAVED" },
];
export const Main = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef<BridgedIframeHandle>(null);
  const [activePage, setPage] = useState<string>("home");

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHome = async () => {
    try {
      await iframeRef.current?.goTo({ feature: "discover" });
      setPage("home");
    } catch (error) {
      console.error("Navigation to home failed:", error);
    }
  };

  const handleGoToInventory = async () => {
    try {
      await iframeRef.current?.goTo({ feature: "inventory" });
      setPage("inventory");
    } catch (error) {
      console.error("Navigation to inventory failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Navbar
        pages={pages}
        activePage={activePage}
        onPageClick={(id) => {
          if (id === activePage) return;
          if (id === "home") {
            handleGoToHome();
            return;
          }
          if (id === "inventory") {
            handleGoToInventory();
            return;
          }
        }}
        onLogoutClick={() => {
          handleLogout();
        }}
      />

      {/* Main Content - Iframe */}
      <main className="flex flex-col flex-1 h-full">
        <div className="flex flex-col flex-1 w-full mx-auto h-full">
          <BridgedIframe
            ref={iframeRef}
            src={authService.getEmbeddedViewerUrl() + "#/discover"}
            className="w-full h-full  border-0 flex-1"
          />
        </div>
      </main>
    </div>
  );
};
