import { memo, useMemo } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Avatar, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import type { Candidate } from '../../types/candidate';

const levelColor: Record<string, string> = { Júnior:'#dff4ff', Pleno:'#e8e2ff', Sênior:'#def7e8', Especialista:'#fff1ce' };
const relativeDate = (date: string) => { const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)); return days === 0 ? 'hoje' : days === 1 ? 'há 1 dia' : `há ${days} dias`; };

export const CandidateCard = memo(function CandidateCard({ candidate, onOpen }: { candidate: Candidate; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: candidate.id, data: { type:'candidate', status:candidate.status } });
  const style = useMemo(() => ({ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.22 : 1 }), [transform, transition, isDragging]);
  return <Card ref={setNodeRef} style={style} {...attributes} {...listeners} sx={{ minWidth:320, p:2, cursor:'grab', userSelect:'none', borderRadius:3, bgcolor:'background.paper', transition:'box-shadow .2s ease, transform .2s ease', '&:active':{cursor:'grabbing'}, '&:hover':{boxShadow:'0 12px 24px rgba(37,36,66,.14)', transform:'translateY(-2px)'}, '&:focus-visible':{outline:'2px solid #6957e9'} }}>
    <Stack direction="row" spacing={1.35} alignItems="flex-start"><Avatar src={candidate.avatar} sx={{ width:48, height:48, fontSize:18, boxShadow:'0 2px 8px rgba(30,35,65,.16)' }}>{candidate.name[0]}</Avatar><Box sx={{minWidth:0, flex:1}}><Typography onClick={(event)=>{event.stopPropagation();onOpen(candidate.id)}} noWrap fontWeight={800} fontSize={15} sx={{cursor:'pointer', '&:hover':{color:'primary.main'}}}>{candidate.name}</Typography><Typography noWrap variant="body2" color="text.secondary" sx={{mt:.15}}>{candidate.position}</Typography><Stack direction="row" spacing={.75} sx={{mt:.85}}><Chip label={candidate.seniority} size="small" sx={{height:22, bgcolor:levelColor[candidate.seniority], fontWeight:750, fontSize:10}}/><Typography noWrap variant="caption" color="text.secondary" sx={{alignSelf:'center'}}>{candidate.location}</Typography></Stack></Box><DragIndicatorRoundedIcon sx={{color:'#a7adbd', mt:.15}}/></Stack>
    <Stack direction="row" flexWrap="wrap" gap={.65} sx={{mt:1.65}}>{candidate.skills.slice(0,3).map(skill=><Chip key={skill} label={skill} size="small" variant="outlined" sx={{height:23, fontSize:10.5, fontWeight:650, borderColor:'#dedbf8', bgcolor:'#faf9ff'}}/>)}</Stack>
    <Typography color="text.secondary" variant="body2" sx={{mt:1.45, lineHeight:1.45, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{candidate.experience}</Typography>
    <Divider sx={{my:1.45}}/>
    <Stack spacing={.8}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box sx={{display:'flex',alignItems:'center',gap:.55,color:'text.secondary'}}><PaymentsOutlinedIcon sx={{fontSize:16}}/><Typography variant="caption">R$ {candidate.salary.toLocaleString('pt-BR')}</Typography></Box><Box sx={{display:'flex',alignItems:'center',gap:.45,color:'text.secondary'}}><EventOutlinedIcon sx={{fontSize:15}}/><Typography variant="caption">{relativeDate(candidate.appliedAt)}</Typography></Box></Stack><Stack direction="row" justifyContent="space-between" alignItems="center"><Box sx={{display:'flex',alignItems:'center',gap:.45,color:'text.secondary',minWidth:0}}><LocationOnOutlinedIcon sx={{fontSize:15}}/><Typography noWrap variant="caption">{candidate.location}</Typography></Box><Typography variant="caption" color="text.secondary">Atualizado {relativeDate(candidate.updatedAt || candidate.appliedAt)}</Typography></Stack></Stack>
    <Box sx={{mt:1.35, px:1, py:.65, borderRadius:1.5, bgcolor:'#f4f3ff'}}><Typography variant="caption" fontWeight={750} color="primary.main">Status: {candidate.status}</Typography></Box>
  </Card>;
});
