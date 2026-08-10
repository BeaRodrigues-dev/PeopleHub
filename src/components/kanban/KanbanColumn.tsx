import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Box, CircularProgress, IconButton, Skeleton, Typography } from '@mui/material';
import type { Status } from '../../types/candidate';
import { CandidateCard } from './CandidateCard';
import { useKanban } from '../../hooks/useKanban';
import { useInfiniteColumnScroll } from '../../hooks/useInfiniteColumnScroll';
import { useCandidateStore } from '../../store/candidateStore';

const statusColor: Record<Status,string> = {'Novo candidato':'#7582f5',Screening:'#a76af2','Entrevista RH':'#eb8b5b','Entrevista Técnica':'#00a6a6',Proposta:'#5b9bef',Contratado:'#34ad73',Rejeitado:'#e36a6a'};
function DropPlaceholder() { return <Box sx={{height:86,border:'2px dashed #8f83ee',borderRadius:2.5,bgcolor:'rgba(105,87,233,.08)',animation:'pulse .9s ease-in-out infinite alternate','@keyframes pulse':{from:{opacity:.55},to:{opacity:1}}}}/>; }

export const KanbanColumn = memo(function KanbanColumn({ status, onOpen, isActiveDrop, overCardId }: { status:Status; onOpen:(id:string)=>void; isActiveDrop:boolean; overCardId:string|null }) {
  const { candidates, hasMore, loadMore } = useKanban(status);
  const current = useCandidateStore((s) => s.kanbanState[status]);
  const setScroll = useCandidateStore((s) => s.setColumnScroll);
  const { setNodeRef } = useDroppable({ id:status, data:{type:'column',status} });
  const { ref, loading, onScroll } = useInfiniteColumnScroll(loadMore, current?.scrollTop);
  const candidateIds = useMemo(() => candidates.map((candidate) => candidate.id), [candidates]);
  return <Box ref={setNodeRef} sx={{width:350,flex:'0 0 350px',height:'calc(100vh - 190px)',minHeight:540,bgcolor:isActiveDrop?'#eeebff':'#f0f1f6',border:isActiveDrop?'1px solid #9388ed':'1px solid #e7e8ee',boxShadow:isActiveDrop?'0 8px 22px rgba(91,75,210,.12)':'none',borderRadius:3,display:'flex',flexDirection:'column',transition:'background .16s ease, border .16s ease, box-shadow .16s ease',overflow:'hidden'}}>
    <Box sx={{p:1.65,position:'sticky',top:0,zIndex:2,bgcolor:isActiveDrop?'#e9e6ff':'#f0f1f6',borderBottom:'1px solid #e1e2ea'}}><Box sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:9,height:9,borderRadius:'50%',bgcolor:statusColor[status],boxShadow:`0 0 0 3px ${statusColor[status]}22`}}/><Typography fontWeight={800} fontSize={14} sx={{flex:1}}>{status}</Typography><Typography variant="caption" color="text.secondary" sx={{fontWeight:700}}>{candidates.length}</Typography><IconButton size="small" aria-label={`Adicionar candidato em ${status}`} sx={{ml:.25,bgcolor:'background.paper',border:'1px solid #e2e3ea','&:hover':{bgcolor:'#fff'}}}><AddRoundedIcon fontSize="small"/></IconButton></Box></Box>
    <Box ref={ref} onScroll={(event)=>{setScroll(status,event.currentTarget.scrollTop);void onScroll();}} sx={{flex:1,overflowY:'auto',p:1.5,display:'grid',gap:1.35,alignContent:'start'}}><SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>{candidates.map((candidate)=><Box key={candidate.id}>{isActiveDrop && overCardId===candidate.id && <DropPlaceholder/>}<CandidateCard candidate={candidate} onOpen={onOpen}/></Box>)}</SortableContext>{isActiveDrop && !overCardId && <DropPlaceholder/>}{!candidates.length&&!loading&&<Typography variant="caption" textAlign="center" color="text.secondary" sx={{p:2}}>Nenhum candidato nesta etapa</Typography>}{loading&&<><Skeleton variant="rounded" height={258}/><Skeleton variant="rounded" height={258}/><Box sx={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,color:'text.secondary'}}><CircularProgress size={17}/><Typography variant="caption">Carregando mais…</Typography></Box></>}{!loading&&hasMore&&<Typography variant="caption" textAlign="center" color="text.secondary" sx={{py:.5}}>Role para carregar mais</Typography>}</Box>
  </Box>;
});
