import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./screens/LoginPage";
import ConductorApp from "./screens/ConductorApp";
import AdminDashboard from "./screens/AdminDashboard";
import PassengerRetry from "./screens/PassengerRetry";

type AppState =
  | { screen: "login" }
  | { screen: "admin" }
  | { screen: "conductor" }
  | { screen: "passenger" };

function MainContent() {
  const [state, setState] = useState<AppState>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "passenger" || params.get("sessionId") || window.location.pathname.includes("/retry")) {
      return { screen: "passenger" };
    }
    return { screen: "login" };
  });

  if (state.screen === "login") {
    return <LoginPage onLogin={(role) => setState({ screen: role })} />;
  }

  if (state.screen === "passenger") {
    return (
      <div className="h-full relative">
        <PassengerRetry />
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => setState({ screen: "login" })}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur rounded-full px-4 py-2 text-white/70 text-[11px] font-medium transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (state.screen === "admin") {
    return <AdminDashboard onLogout={() => setState({ screen: "login" })} />;
  }

  if (state.screen === "conductor") {
    return <ConductorApp onLogout={() => setState({ screen: "login" })} />;
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
