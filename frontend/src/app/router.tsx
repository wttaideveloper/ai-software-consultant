import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/protected-route";
import { PublicRoute } from "@/app/public-route";
import { ClientLandingPage } from "@/client-portal/pages/client-landing-page";
import { PageLoader } from "@/components/ui/spinner";
import { AppLayout } from "@/layouts/app-layout";

/**
 * The landing page and the two route guards stay in the main bundle — they're
 * on the critical path for a first visit. Everything else is split per route so
 * a visitor who only reads the landing page never downloads the admin portal.
 */

// Client Portal
const RequirementsWizardIndexRedirect = lazy(() =>
  import("@/client-portal/requirements-wizard/requirements-wizard-index-redirect").then(
    (m) => ({ default: m.RequirementsWizardIndexRedirect }),
  ),
);
const RequirementsWizardLayout = lazy(() =>
  import("@/client-portal/requirements-wizard/requirements-wizard-layout").then(
    (m) => ({ default: m.RequirementsWizardLayout }),
  ),
);
const ClientProjectIdeaStep = lazy(() =>
  import("@/client-portal/requirements-wizard/steps/client-project-idea-step").then(
    (m) => ({ default: m.ClientProjectIdeaStep }),
  ),
);
const ClientConsultationTimeStep = lazy(() =>
  import(
    "@/client-portal/requirements-wizard/steps/client-consultation-time-step"
  ).then((m) => ({ default: m.ClientConsultationTimeStep })),
);
const ClientPlatformsStep = lazy(() =>
  import("@/client-portal/requirements-wizard/steps/client-platforms-step").then(
    (m) => ({ default: m.ClientPlatformsStep }),
  ),
);
const ClientQuestionsStep = lazy(() =>
  import("@/client-portal/requirements-wizard/steps/client-questions-step").then(
    (m) => ({ default: m.ClientQuestionsStep }),
  ),
);
const ClientRequirementSummaryPage = lazy(() =>
  import("@/client-portal/pages/client-requirement-summary-page").then((m) => ({
    default: m.ClientRequirementSummaryPage,
  })),
);
const ClientDetectedFeaturesPage = lazy(() =>
  import("@/client-portal/pages/client-detected-features-page").then((m) => ({
    default: m.ClientDetectedFeaturesPage,
  })),
);
const ClientEstimatePage = lazy(() =>
  import("@/client-portal/pages/client-estimate-page").then((m) => ({
    default: m.ClientEstimatePage,
  })),
);
const ClientRequestProposalPage = lazy(() =>
  import("@/client-portal/pages/client-request-proposal-page").then((m) => ({
    default: m.ClientRequestProposalPage,
  })),
);
const ClientGiftPage = lazy(() =>
  import("@/client-portal/pages/client-gift-page").then((m) => ({
    default: m.ClientGiftPage,
  })),
);

// Auth
const LoginPage = lazy(() =>
  import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/register-page").then((m) => ({
    default: m.RegisterPage,
  })),
);

// Admin Portal
const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ClientRequestsPage = lazy(() =>
  import("@/features/client-requests/client-requests-page").then((m) => ({
    default: m.ClientRequestsPage,
  })),
);
const ClientRequestDetailsPage = lazy(() =>
  import("@/features/client-requests/client-request-details-page").then((m) => ({
    default: m.ClientRequestDetailsPage,
  })),
);
const ProposalEditorPage = lazy(() =>
  import("@/features/proposal-editor/proposal-editor-page").then((m) => ({
    default: m.ProposalEditorPage,
  })),
);
const CostSettingsPage = lazy(() =>
  import("@/features/cost-settings/cost-settings-page").then((m) => ({
    default: m.CostSettingsPage,
  })),
);
const ConsultationsPage = lazy(() =>
  import("@/features/consultations/consultations-page").then((m) => ({
    default: m.ConsultationsPage,
  })),
);
const ChatPage = lazy(() =>
  import("@/features/chat/chat-page").then((m) => ({ default: m.ChatPage })),
);
const RequirementSummaryPage = lazy(() =>
  import("@/features/requirement-summary/requirement-summary-page").then((m) => ({
    default: m.RequirementSummaryPage,
  })),
);
const DetectedFeaturesPage = lazy(() =>
  import("@/features/detected-features/detected-features-page").then((m) => ({
    default: m.DetectedFeaturesPage,
  })),
);
const EstimationPage = lazy(() =>
  import("@/features/estimation/estimation-page").then((m) => ({
    default: m.EstimationPage,
  })),
);
const ProposalPage = lazy(() =>
  import("@/features/proposal/proposal-page").then((m) => ({
    default: m.ProposalPage,
  })),
);
const FeatureLibraryPage = lazy(() =>
  import("@/features/feature-library/feature-library-page").then((m) => ({
    default: m.FeatureLibraryPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/features/users/users-page").then((m) => ({ default: m.UsersPage })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/settings-page").then((m) => ({
    default: m.SettingsPage,
  })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Client Portal — no authentication required, independent of the Admin Portal below. */}
        <Route path="/" element={<ClientLandingPage />} />

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

        {/* Public Admin Login — dedicated URL, kept separate from the Client Portal above. */}
        <Route element={<PublicRoute />}>
          <Route path="/admin-login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Admin Portal — unchanged behavior, now rooted at /dashboard since / belongs to the Client Portal. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Client Requests — the primary Admin workflow. */}
            <Route path="client-requests" element={<ClientRequestsPage />} />
            <Route
              path="client-requests/:leadId"
              element={<ClientRequestDetailsPage />}
            />
            <Route
              path="client-requests/:leadId/proposal"
              element={<ProposalEditorPage />}
            />

            <Route path="proposals" element={<ProposalPage />} />
            <Route path="feature-library" element={<FeatureLibraryPage />} />
            <Route path="cost-settings" element={<CostSettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/*
              Unlinked from the sidebar but intentionally still routable: the
              Consultation module and the AI discovery pipeline are not deleted,
              only removed from navigation.
            */}
            <Route path="consultations" element={<ConsultationsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="requirement-summary" element={<RequirementSummaryPage />} />
            <Route path="detected-features" element={<DetectedFeaturesPage />} />
            <Route path="estimations" element={<EstimationPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
