import { Avatar, Box, Card, Chip, Stack, Typography } from "@mui/material";
import type { Candidate } from "../../candidate/types";

export function DragPreview({ candidate }: { candidate: Candidate }) {
  return (
    <Card
      sx={{
        width: 300,
        p: 1.75,
        borderRadius: 3,
        boxShadow: "0 24px 48px rgba(15,18,32,.28)",
        transform: "rotate(1.5deg) scale(1.03)",
        cursor: "grabbing",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar src={candidate.avatar ?? undefined} sx={{ width: 40, height: 40 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap fontWeight={750} fontSize={14}>{candidate.name}</Typography>
          <Stack direction="row" gap={0.5} sx={{ mt: 0.5 }}>
            {candidate.skills.slice(0, 2).map((skill) => (
              <Chip key={skill} label={skill} size="small" sx={{ height: 20, fontSize: 10 }} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
