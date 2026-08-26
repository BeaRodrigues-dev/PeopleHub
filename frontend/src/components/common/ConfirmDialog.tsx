import { Button, Typography } from "@mui/material";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Diálogo de confirmação genérico para ações destrutivas (excluir vaga, colaborador, etc.). */
export function ConfirmDialog({ open, title, description, confirmLabel = "Excluir", loading, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo…" : confirmLabel}
          </Button>
        </>
      }
    >
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Modal>
  );
}
