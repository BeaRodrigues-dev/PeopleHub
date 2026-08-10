import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { candidateService } from "../../services/candidate.service";
import { useCandidateStore } from "../../store/candidateStore";
export function CandidateList({ onOpen }: { onOpen: (id: string) => void }) {
  const search = useCandidateStore((s) => s.search),
    filters = useCandidateStore((s) => s.filters);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [search, filters]);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["candidates", "list", search, filters, page],
    queryFn: () =>
      candidateService.getCandidates({
        page,
        limit: 30,
        query: search,
        filters,
      }),
    staleTime: 10_000,
  });
  if (isLoading)
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: 360 }}>
        <CircularProgress />
      </Box>
    );
  const rows = data?.items ?? [];
  return (
    <Card sx={{ overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: "calc(100vh - 235px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "Candidato",
                "Cargo",
                "Status",
                "Localização",
                "Candidatura",
              ].map((x) => (
                <TableCell key={x} sx={{ fontWeight: 750, bgcolor: "#fafaff" }}>
                  {x}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow
                hover
                key={c.id}
                onClick={() => onOpen(c.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Avatar src={c.avatar} sx={{ width: 34, height: 34 }} />
                    <Box>
                      <Typography fontWeight={700} fontSize={14}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{c.position}</TableCell>
                <TableCell>
                  <Chip
                    label={c.status}
                    size="small"
                    color={
                      c.status === "Contratado"
                        ? "success"
                        : c.status === "Rejeitado"
                          ? "error"
                          : "default"
                    }
                  />
                </TableCell>
                <TableCell>{c.location}</TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(c.appliedAt),
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #eee",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {data?.total ?? 0} candidatos encontrados
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="Anterior"
            disabled={!page || isFetching}
            onClick={() => setPage((p) => p - 1)}
            clickable
          />
          <Chip
            label={isFetching ? "Carregando…" : "Próxima"}
            disabled={!data?.hasMore || isFetching}
            onClick={() => setPage((p) => p + 1)}
            clickable
          />
        </Box>
      </Box>
    </Card>
  );
}
