import { useEffect, useRef, useState } from "react";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useUIStore } from "../../../store/uiStore";
import { useVacancy } from "../../vacancy/queries";
import { useCreateApplication } from "../../kanban/queries";
import { useCreateCandidate, useParseResume } from "../queries";
import { CandidateForm, emptyCandidateForm, isCandidateFormValid, type CandidateFormValues } from "./CandidateForm";
import { ResumeDropzone } from "../../ai/components/ResumeDropzone";
import { ResumeProcessingStatus, type ResumeProcessingStep } from "../../ai/components/ResumeProcessingStatus";
import type { EducationEntry, ExperienceEntry } from "../types";

type Step = "choose" | "manual" | "upload" | "processing" | "confirm";

interface ParsedExtras {
  resumeUrl?: string;
  resumeText?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  languages: string[];
}

const emptyExtras: ParsedExtras = { experience: [], education: [], languages: [] };

export function AddCandidateModal() {
  const vacancyId = useUIStore((s) => s.addCandidateVacancyId);
  const close = useUIStore((s) => s.closeAddCandidate);
  const open = vacancyId !== undefined;
  const toast = useToast();
  const { data: vacancy } = useVacancy(vacancyId);

  const [step, setStep] = useState<Step>("choose");
  const [values, setValues] = useState<CandidateFormValues>(emptyCandidateForm);
  const [extras, setExtras] = useState<ParsedExtras>(emptyExtras);
  const [fileName, setFileName] = useState("");
  const [processingStep, setProcessingStep] = useState<ResumeProcessingStep>("uploading");
  const processingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const createCandidate = useCreateCandidate();
  const createApplication = useCreateApplication();
  const parseResume = useParseResume();

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setValues(emptyCandidateForm);
      setExtras(emptyExtras);
      setFileName("");
      clearTimeout(processingTimer.current);
    }
  }, [open]);

  const submitting = createCandidate.isPending || createApplication.isPending;

  const finish = async (finalValues: CandidateFormValues) => {
    try {
      const candidate = await createCandidate.mutateAsync({
        name: finalValues.name.trim(),
        email: finalValues.email.trim(),
        phone: finalValues.phone || undefined,
        location: finalValues.location || undefined,
        skills: finalValues.skills,
        seniority: finalValues.seniority || undefined,
        linkedin: finalValues.linkedin || undefined,
        portfolio: finalValues.portfolio || undefined,
        notes: finalValues.notes || undefined,
        resumeUrl: extras.resumeUrl,
        resumeText: extras.resumeText,
        experience: extras.experience,
        education: extras.education,
        languages: extras.languages,
      });
      if (vacancyId) {
        await createApplication.mutateAsync({ candidateId: candidate.id, vacancyId });
      }
      toast.success(vacancyId ? "Candidato adicionado à vaga" : "Candidato adicionado ao Banco de Talentos");
      close();
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível salvar o candidato"));
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setStep("processing");
    setProcessingStep("uploading");
    processingTimer.current = setTimeout(() => setProcessingStep("extracting"), 500);
    parseResume.mutate(file, {
      onSuccess: (result) => {
        clearTimeout(processingTimer.current);
        setValues({
          name: result.extracted.name || "",
          email: result.extracted.email || "",
          phone: result.extracted.phone || "",
          location: result.extracted.location || "",
          skills: result.extracted.skills,
          seniority: result.extracted.seniority || "Pleno",
          linkedin: result.extracted.linkedin || "",
          portfolio: result.extracted.portfolio || "",
          notes: "",
        });
        setExtras({
          resumeUrl: result.resumeUrl,
          resumeText: result.resumeText,
          experience: result.extracted.experience,
          education: result.extracted.education,
          languages: result.extracted.languages,
        });
        setStep("confirm");
      },
      onError: (err) => {
        clearTimeout(processingTimer.current);
        toast.error(errorMessage(err, "Não foi possível processar o currículo"));
        setStep("upload");
      },
    });
  };

  const title = vacancy ? `Adicionar candidato — ${vacancy.title}` : "Adicionar candidato";

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      subtitle={step === "choose" ? "Escolha como deseja cadastrar o candidato" : undefined}
      width={640}
      footer={
        step === "manual" || step === "confirm" ? (
          <>
            <Button onClick={() => setStep(step === "confirm" ? "upload" : "choose")} disabled={submitting} startIcon={<ArrowBackRoundedIcon fontSize="small" />}>
              Voltar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" disabled={!isCandidateFormValid(values) || submitting} onClick={() => finish(values)}>
              {submitting ? "Salvando…" : "Salvar candidato"}
            </Button>
          </>
        ) : step === "upload" ? (
          <Button onClick={() => setStep("choose")} startIcon={<ArrowBackRoundedIcon fontSize="small" />}>Voltar</Button>
        ) : undefined
      }
    >
      {step === "choose" && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Card
            onClick={() => setStep("manual")}
            sx={{ flex: 1, p: 3, borderRadius: 4, cursor: "pointer", textAlign: "center", "&:hover": { borderColor: "primary.main", boxShadow: "0 10px 24px rgba(23,26,46,.08)" } }}
          >
            <PersonAddAltRoundedIcon sx={{ fontSize: 30, color: "primary.main", mb: 1 }} />
            <Typography fontWeight={750}>Adicionar manualmente</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Preencha os dados do candidato em um formulário simples.</Typography>
          </Card>
          <Card
            onClick={() => setStep("upload")}
            sx={{ flex: 1, p: 3, borderRadius: 4, cursor: "pointer", textAlign: "center", "&:hover": { borderColor: "primary.main", boxShadow: "0 10px 24px rgba(23,26,46,.08)" } }}
          >
            <UploadFileRoundedIcon sx={{ fontSize: 30, color: "primary.main", mb: 1 }} />
            <Typography fontWeight={750}>Enviar currículo</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>PDF ou DOCX — a IA extrai os dados automaticamente.</Typography>
          </Card>
        </Stack>
      )}

      {step === "manual" && <CandidateForm values={values} onChange={setValues} />}

      {step === "upload" && <ResumeDropzone onFile={handleFile} />}

      {step === "processing" && <ResumeProcessingStatus step={processingStep} fileName={fileName} />}

      {step === "confirm" && (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, p: 1.25, borderRadius: 2.5, bgcolor: "#e7f7ee" }}>
            <CheckCircleRoundedIcon sx={{ color: "#1c8a54" }} fontSize="small" />
            <Typography variant="body2" sx={{ color: "#1c8a54", fontWeight: 650 }}>
              Dados extraídos do currículo — confira e ajuste antes de salvar.
            </Typography>
          </Stack>
          {extras.languages.length > 0 && (
            <Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
              {extras.languages.map((lang) => <Chip key={lang} label={lang} size="small" variant="outlined" />)}
            </Stack>
          )}
          <CandidateForm values={values} onChange={setValues} />
        </>
      )}
    </Modal>
  );
}
