import { useEffect, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
export default function ReportImages({patientId,visitId,onReady}) {
 const [images,setImages]=useState([]),[error,setError]=useState('')
 useEffect(()=>{let active=true;onReady(false);setImages([]);setError('');if(!patientId||!visitId){onReady(true);return}
 Promise.all([workspaceService.getMediaLayout(patientId,visitId,'report'),workspaceService.list('media-records')]).then(([layout,media])=>{if(!active)return;const ids=layout.data?.placements||[];const chosen=ids.map(id=>(media.data||[]).find(x=>x.id===id&&String(x.patient_id)===String(patientId)&&String(x.visit_id)===String(visitId)&&x.status!=='Archived'&&x.type?.startsWith('image/')));if(chosen.some(x=>!x))throw new Error('A selected report image is unavailable. Update the visit selection before printing.');setImages(chosen);if(!chosen.length)onReady(true)}).catch(e=>{if(active)setError(e.message||'Unable to load selected report images.')});return()=>{active=false}
 },[patientId,visitId,onReady])
 if(error)return <p role="alert" className="text-red-700">{error}</p>
 if(!images.length)return null
 return <section className="mt-6" style={{breakBefore:'page'}}><h2 className="mb-3 text-lg font-bold">Selected clinical images</h2><div className="grid grid-cols-2 gap-4">{images.map(image=><figure key={image.id} style={{breakInside:'avoid'}}><img src={image.url} alt={image.name} className="max-h-96 w-full object-contain" onLoad={e=>{e.target.dataset.reportLoaded='1';const container=e.target.closest('section');if([...container.querySelectorAll('img')].every(x=>x.dataset.reportLoaded==='1'))onReady(true)}} onError={()=>{setError('A selected image failed to load. Printing is blocked.');onReady(false)}}/><figcaption className="text-sm">{image.name}</figcaption></figure>)}</div></section>
}
