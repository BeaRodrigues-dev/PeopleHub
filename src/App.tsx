import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CandidateDetailsPage } from "./pages/CandidateDetailsPage";
export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidate/:id" element={<CandidateDetailsPage />} />
        <Route path="*" element={<Navigate to="/candidates" replace />} />
      </Routes>
    </AppLayout>
  );
}
