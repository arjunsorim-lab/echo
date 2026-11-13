import { useEffect, useState } from 'react'
import api from '../api/axios'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'
export default function SelectedMediaActions({patient, visitId, selected}) {
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState(false),[prepared,setPrepared]=useState(null)
 const selectionKey=String(patient?.id)+':'+String(visitId)+':'+selected.map(x=>x.id).join(',')
 useEffect(()=>{setPrepared(null);setMessage('');setPreview(false)},[selectionKey])
 const valid=patient&&visitId&&selected.length>0
 const run=async action=>{setBusy(true);setMessage('');try{
  if(action==='save') {await workspaceService.saveMediaLayout(patient.id,visitId,'report',{placements:selected.map(x=>x.id),columns:2,title:'Clinical images'});setMessage('Selected images saved to this visit’s clinical report.')}
  else {const response=await api.post(`/media-export/${patient.id}/${visitId}`,{ids:selected.map(x=>x.id)},{responseType:'blob'});const file=new File([response.data],`visit-${visitId}-images.zip`,{type:'application/zip'});setPrepared(file);const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setMessage('ZIP exported. You can share the prepared file using the button below.')}
 }catch(e){setMessage(e.response?.status===413?'Selection exceeds 50 MB. Select fewer images.':e.response?.data?.detail||'Action failed. Refresh and retry.')}finally{setBusy(false)}}
 const share=async()=>{if(!navigator.canShare?.({files:[prepared]})){setMessage('This browser cannot share files directly. Share the downloaded ZIP using your preferred application.');return}try{await navigator.share({files:[prepared],title:'Selected clinical images'});setMessage('Share dialog closed.')}catch(e){setMessage(e.name==='AbortError'?'Sharing cancelled.':'Sharing unavailable. Use the downloaded ZIP file.')}}
 return <section className="mb-4 rounded-lg border bg-white p-3"><p className="mb-2">{selected.length} selected · up to 16 images</p><div className="flex flex-wrap gap-2"><button disabled={!valid||busy} className="secondary-button" onClick={()=>run('save')}>Include selected in report</button><button disabled={!valid||busy} className="secondary-button" onClick={()=>setPreview(true)}>Print selected / Save PDF</button><button disabled={!valid||busy} className="secondary-button" onClick={()=>run('export')}>Export selected ZIP</button>{prepared&&<button className="secondary-button" onClick={share}>Share exported ZIP</button>}</div>{message&&<p role="status" className="mt-2 text-sm">{message}</p>}{preview&&<MediaPrintPreview images={selected.map(x=>x.url)} title="Selected clinical images" patientId={patient.patient_id} patientName={[patient.first_name,patient.last_name].filter(Boolean).join(' ')} visitId={visitId} columns={2} onClose={()=>setPreview(false)}/>}</section>
}
