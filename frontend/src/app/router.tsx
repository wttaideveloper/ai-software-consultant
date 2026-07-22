import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/protected-route";
import { PublicRoute } from "@/app/public-route";
import { ClientDetectedFeaturesPage } from "@/client-portal/pages/client-detected-features-page";
import { ClientEstimatePage } from "@/client-portal/pages/client-estimate-page";
import { ClientGiftPage } from "@/client-portal/pages/client-gift-page";
import { ClientHomePage } from "@/client-portal/pages/client-home-page";
import { ClientRequestProposalPage } from "@/client-portal/pages/client-request-proposal-page";
import { ClientRequirementSummaryPage } from "@/client-portal/pages/client-requirement-summary-page";
import { RequirementsWizardIndexRedirect } from "@/client-portal/requirements-wizard/requirements-wizard-index-redirect";
import { RequirementsWizardLayout } from "@/client-portal/requirements-wizard/requirements-wizard-layout";
import { ClientConsultationTimeStep } from "@/client-portal/requirements-wizard/steps/client-consultation-time-step";
import { ClientPlatformsStep } from "@/client-portal/requirements-wizard/steps/client-platforms-step";
import { ClientProjectIdeaStep } from "@/client-portal/requirements-wizard/steps/client-project-idea-step";
import { ClientQuestionsStep } from "@/client-portal/requirements-wizard/steps/client-questions-step";
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
      {/* Public Client Portal — no authentication required, independent of the Admin Portal below. */}
      <Route path="/portal" element={<ClientHomePage />} />

      <Route path="/requirements" element={<RequirementsWizardLayout />}>
        <Route index element={<RequirementsWizardIndexRedirect />} />
        <Route path="project-idea" element={<ClientProjectIdeaStep />} />
        <Route path="consultation-time" element={<ClientConsultationTimeStep />} />
        <Route path="platforms" element={<ClientPlatformsStep />} />
        <Route path="questions" element={<ClientQuestionsStep />} />
      </Route>

      <Route path="/summary" element={<ClientRequirementSummaryPage />} />
      <Route path="/features" element={<ClientDetectedFeaturesPage />} />
      <Route path="/estimate" element={<ClientEstimatePage />} />
      <Route path="/request-proposal" element={<ClientRequestProposalPage />} />
      <Route path="/gift" element={<ClientGiftPage />} />

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
