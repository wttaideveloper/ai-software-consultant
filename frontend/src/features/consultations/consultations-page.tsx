import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { ChatPanel } from "@/features/consultations/components/chat/chat-panel";
import { ConsultationFormModal } from "@/features/consultations/components/consultation-form-modal";
import { ConsultationListPanel } from "@/features/consultations/components/consultation-list-panel";
import { DeleteConsultationDialog } from "@/features/consultations/components/delete-consultation-dialog";
import { WorkspaceHeader } from "@/features/consultations/components/workspace-header";
import { useConsultation } from "@/features/consultations/hooks/use-consultation";
import type { Consultation } from "@/types";
import { fadeIn } from "@/utils/motion";

type FormModalState = {
  open: boolean;
  consultation: Consultation | null;
};

export function ConsultationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [lastClicked, setLastClicked] = useState<Consultation | null>(null);
  const [formModal, setFormModal] = useState<FormModalState>({ open: false, consultation: null });
  const [deleteTarget, setDeleteTarget] = useState<Consultation | null>(null);

  const { data: selectedConsultation, isLoading: isLoadingSelected } = useConsultation(
    selectedId,
    lastClicked ?? undefined,
  );

  const selectConsultation = useCallback(
    (consultation: Consultation) => {
      setLastClicked(consultation);
      setSearchParams((params) => {
        params.set("id", consultation.id);
        return params;
      });
      setMobileListOpen(false);
    },
    [setSearchParams],
  );

  const clearSelection = useCallback(() => {
    setLastClicked(null);
    setSearchParams((params) => {
      params.delete("id");
      return params;
    });
  }, [setSearchParams]);

  const openCreateModal = () => setFormModal({ open: true, consultation: null });
  const openEditModal = () => {
    if (selectedConsultation) setFormModal({ open: true, consultation: selectedConsultation });
  };
  const closeFormModal = () => setFormModal({ open: false, consultation: null });

  const listPanel = (
    <ConsultationListPanel
      selectedId={selectedId}
      onSelect={selectConsultation}
      onCreate={openCreateModal}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-140 gap-4">
      <div className="hidden w-[320px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface lg:block">
        {listPanel}
      </div>

      <Drawer
        open={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Consultations"
        side="left"
      >
        {listPanel}
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center border-b border-border px-4 py-2 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMobileListOpen(true)}>
            <PanelLeft className="h-4 w-4" />
            Consultations
          </Button>
        </div>

        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={Sparkles}
              title="Select a consultation"
              description="Select a consultation or create a new one to open the AI workspace."
              action={<Button onClick={openCreateModal}>New consultation</Button>}
            />
          </div>
        ) : isLoadingSelected && !selectedConsultation ? (
          <PageLoader />
        ) : selectedConsultation ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedConsultation.id}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex min-h-0 flex-1 flex-col"
            >
              <WorkspaceHeader
                consultation={selectedConsultation}
                onEdit={openEditModal}
                onDelete={() => setDeleteTarget(selectedConsultation)}
              />
              <ChatPanel consultationId={selectedConsultation.id} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={Sparkles}
              title="Consultation not found"
              description="It may have been deleted. Choose another consultation from the list."
            />
          </div>
        )}
      </div>

      <ConsultationFormModal
        open={formModal.open}
        onClose={closeFormModal}
        consultation={formModal.consultation}
        onCreated={selectConsultation}
      />

      <DeleteConsultationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        consultation={deleteTarget}
        onDeleted={clearSelection}
      />
    </div>
  );
}
