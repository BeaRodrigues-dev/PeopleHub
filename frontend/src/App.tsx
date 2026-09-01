import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { isSessionValid, useAuthStore } from "./features/auth/authStore";
import { HomePage } from "./features/home/pages/HomePage";
import { VacanciesPage } from "./features/vacancy/pages/VacanciesPage";
import { VacancyDetailPage } from "./features/vacancy/pages/VacancyDetailPage";
import { CreateVacancyPage } from "./features/vacancy/pages/CreateVacancyPage";
import { TalentPoolPage } from "./features/talent-bank/pages/TalentPoolPage";
import { PeoplePage } from "./features/people/pages/PeoplePage";
import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";
import { AnalyticsPage } from "./features/analytics/pages/AnalyticsPage";
import { ConsultingPage } from "./features/consulting/pages/ConsultingPage";
import { InsightsPage } from "./features/insights/pages/InsightsPage";
import { WeeklyReportPage } from "./features/weekly-report/pages/WeeklyReportPage";
import { DocsPage } from "./features/docs/pages/DocsPage";
import { ClimateSurveyPage } from "./features/climate/pages/ClimateSurveyPage";
import { AgendaPage } from "./features/agenda/pages/AgendaPage";
import { SettingsPage } from "./features/auth/pages/SettingsPage";
import { CandidateDetailDrawer } from "./features/candidate/components/CandidateDetailDrawer";
import { CandidateEditModal } from "./features/candidate/components/CandidateEditModal";
import { AddCandidateModal } from "./features/candidate/components/AddCandidateModal";

export default function App() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#E7F4EC" }}>
        <CircularProgress sx={{ color: "#B7DCC0" }} />
      </Box>
    );
  }

  if (!isSessionValid(session)) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vagas" element={<VacanciesPage />} />
        <Route path="/vagas/:id" element={<VacancyDetailPage />} />
        <Route path="/criar-vaga" element={<CreateVacancyPage />} />
        <Route path="/vagas/:id/editar" element={<CreateVacancyPage />} />
        <Route path="/banco-de-talentos" element={<TalentPoolPage />} />
        <Route path="/pessoas" element={<PeoplePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/consultoria" element={<ConsultingPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/relatorio-semanal" element={<WeeklyReportPage />} />
        <Route path="/clima" element={<ClimateSurveyPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/documentos" element={<DocsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Montados uma única vez: drawer/modais de candidato funcionam a partir
          de qualquer página, controlados via uiStore. */}
      <CandidateDetailDrawer />
      <CandidateEditModal />
      <AddCandidateModal />
    </AppLayout>
  );
}
