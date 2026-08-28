import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import { useResumeStore } from "@/store/useResumeStore";

function AppRoutes() {
  const hasSelectedTemplate = useResumeStore((s) => s.hasSelectedTemplate);

  if (!hasSelectedTemplate) {
    return <Welcome />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return <AppRoutes />;
}
