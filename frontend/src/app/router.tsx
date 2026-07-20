import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/protected-route";
import { PublicRoute } from "@/app/public-route";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { ChatPage } from "@/features/chat/chat-page";
import { ConsultationsPage } from "@/features/consultations/consultations-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { DetectedFeaturesPage } from "@/features/detected-features/detected-features-page";
import { EstimationPage } from "@/features/estimation/estimation-page";
import { FeatureLibraryPage } from "@/features/feature-library/feature-library-page";
import { ProposalPage } from "@/features/proposal/proposal-page";
import { RequirementSummaryPage } from "@/features/requirement-summary/requirement-summary-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { UsersPage } from "@/features/users/users-page";
import { AppLayout } from "@/layouts/app-layout";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="requirement-summary" element={<RequirementSummaryPage />} />
          <Route path="detected-features" element={<DetectedFeaturesPage />} />
          <Route path="estimations" element={<EstimationPage />} />
          <Route path="proposals" element={<ProposalPage />} />
          <Route path="feature-library" element={<FeatureLibraryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
