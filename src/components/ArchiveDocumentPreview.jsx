import React,{Suspense,lazy,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import remarkGfm from 'remark-gfm';
import API from '../config/apiConfig.js';
import {loadPreviewPdf} from '../utils/loadPreviewPdf.mjs';
import '../css/ArchiveDocumentPreview.css';
const Markdown=lazy(()=>import('react-markdown'));
const SUPPORTED=new Set(['.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx','.csv','.md','.txt']);
export function webLink(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}}
const readableError=(status)=>status===403?'파일 인증이 만료되었거나 권한이 없습니다. 파일 페이지를 새로고침하고 다시 인증해주세요.':status===413?'미리보기 크기 제한을 초과했습니다. 원본을 다운로드해주세요.':status===429?'미리보기 요청이 많습니다. 잠시 후 다시 시도해주세요.':status===503?'문서 변환 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.':'미리보기를 불러오지 못했습니다. 파일을 다운로드하거나 다시 시도해주세요.';
async function jsonRequest(url,options){const response=await fetch(url,{credentials:'include',cache:'no-store',...options});if(!response.ok)throw new Error(readableError(response.status));return response.json();}
function pause(signal){return new Promise(resolve=>{const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,1500);signal.addEventListener('abort',done,{once:true});});}

export function PreviewDialog({title,onClose,children}){
    const ref=useRef(null);
    useEffect(()=>{
        const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current.showModal();
        return()=>{ref.current?.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true});};
    },[]);
    return createPortal(<dialog ref={ref} className="archive-preview-dialog" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}}>
        <div className="archive-preview-dialog-heading"><h2>{title}</h2><button type="button" onClick={onClose} autoFocus aria-label="큰 화면 닫기">닫기 ×</button></div>{children}
    </dialog>,document.body);
}
function PdfCanvas({doc,page,zoom}){
    const ref=useRef(null),container=useRef(null),[width,setWidth]=useState(0),[error,setError]=useState(''),[rendering,setRendering]=useState(false);
    useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));observer.observe(container.current);return()=>observer.disconnect();},[]);
    useEffect(()=>{
        if(!doc||!width)return;
        let cancelled=false,task;setError('');setRendering(true);
        (async()=>{
            try{
                const pdfPage=await doc.getPage(page);if(cancelled)return;
                const base=pdfPage.getViewport({scale:1});const scale=Math.min(3,Math.max(.2,(width-24)/base.width))*zoom;
                const viewport=pdfPage.getViewport({scale});const canvas=ref.current,ratio=Math.min(window.devicePixelRatio||1,2);
                // Bound canvas memory for large pages and mobile browsers.
                const output=Math.min(ratio,Math.sqrt(12000000/(viewport.width*viewport.height)),8192/viewport.width,8192/viewport.height);
                canvas.width=Math.ceil(viewport.width*output);canvas.height=Math.ceil(viewport.height*output);
                canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
                task=pdfPage.render({canvasContext:canvas.getContext('2d'),viewport,transform:[output,0,0,output,0,0],background:'rgb(255,255,255)'});
                await task.promise;
            }catch(ex){if(!cancelled&&ex.name!=='RenderingCancelledException')setError('이 페이지를 표시하지 못했습니다. 다른 페이지를 선택하거나 원본을 다운로드해주세요.');}
            finally{if(!cancelled)setRendering(false);}
        })();
        return()=>{cancelled=true;task?.cancel();};
    },[doc,page,zoom,width]);
    return <div ref={container} className="archive-pdf-scroll" tabIndex={0} aria-label="PDF 페이지 영역">{rendering&&<p className="archive-preview-rendering" role="status">페이지를 그리는 중입니다…</p>}{error&&<p role="alert">{error}</p>}<canvas ref={ref} role="img" aria-label={`PDF ${page}페이지 미리보기`}/></div>;
}
function columnName(index){let label='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))label=String.fromCharCode(65+(n-1)%26)+label;return label;}
export default function ArchiveDocumentPreview({fileInfo}){
    const ext=fileInfo.fileExtension.toLowerCase(),supported=SUPPORTED.has(ext),endpoint=`${API.API_BASE_URL}/archive/preview/${encodeURIComponent(fileInfo.fileUuidName)}`;
    const maxBytes=(ext==='.pdf'?50:['.doc','.docx','.ppt','.pptx'].includes(ext)?20:['.xls','.xlsx','.csv'].includes(ext)?10:2)*1024*1024;
    const tooLarge=Number(fileInfo.fileSize)>maxBytes;
    const [started,setStarted]=useState(false),[attempt,setAttempt]=useState(0),[state,setState]=useState('idle'),[kind,setKind]=useState(''),[error,setError]=useState('');
    const [doc,setDoc]=useState(null),[text,setText]=useState(''),[truncated,setTruncated]=useState(false),[raw,setRaw]=useState(false),[expanded,setExpanded]=useState(false);
    const [page,setPage]=useState(1),[zoom,setZoom]=useState(1),[sheetIndex,setSheetIndex]=useState(0),[sheet,setSheet]=useState(null),[sheetBusy,setSheetBusy]=useState(false),[sheetError,setSheetError]=useState(''),[sheetAttempt,setSheetAttempt]=useState(0);
    const region=useRef(null);
    useEffect(()=>{if(state==='loading')region.current?.focus({preventScroll:true});if(state==='error')region.current?.querySelector('.archive-preview-placeholder button')?.focus({preventScroll:true});},[state]);
    useEffect(()=>{
        if(!started)return;
        const controller=new AbortController();setState('loading');setError('');setDoc(null);setPage(1);setZoom(1);
        (async()=>{
            try{
                const start=Date.now();let info,first=true;
                do{
                    info=await jsonRequest(endpoint+'/prepare'+(attempt&&first?'?retry=true':''),{method:'POST',signal:controller.signal});
                    first=false;if(controller.signal.aborted)return;
                    if(info.state==='failed'||info.state==='unsupported')throw new Error(info.message);
                    if(info.state==='pending'){setState('converting');if(Date.now()-start>90000)throw new Error('변환이 지연되고 있습니다. 잠시 후 다시 시도하면 준비된 결과를 확인할 수 있습니다.');await pause(controller.signal);}
                }while(info.state==='pending'&&!controller.signal.aborted);
                if(controller.signal.aborted)return;setKind(info.kind);
                if(info.kind==='pdf'){
                    const response=await fetch(endpoint+'/pdf',{credentials:'include',cache:'no-store',signal:controller.signal});
                    if(!response.ok)throw new Error(readableError(response.status));
                    const bytes=new Uint8Array(await response.arrayBuffer());if(controller.signal.aborted)return;
                    const pdfjs=await import('pdfjs-dist');if(controller.signal.aborted)return;
                    const base=import.meta.env.BASE_URL+'pdfjs/'+pdfjs.version+'/';
                    pdfjs.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.js';
                    const pdf=await loadPreviewPdf(pdfjs.getDocument,{data:bytes,isEvalSupported:false,enableXfa:false,cMapUrl:base+'cmaps/',cMapPacked:true,standardFontDataUrl:base+'standard_fonts/',wasmUrl:base+'wasm/'},controller.signal);
                    if(controller.signal.aborted)return;setDoc(pdf);
                }else if(info.kind==='text'||info.kind==='markdown'){
                    const data=await jsonRequest(endpoint+'/text',{signal:controller.signal});if(controller.signal.aborted)return;setText(data.text);setTruncated(data.truncated);
                }else if(info.kind==='sheet'){
                    const data=await jsonRequest(endpoint+'/sheet?sheet=0',{signal:controller.signal});if(controller.signal.aborted)return;setSheet(data);setSheetIndex(0);
                }
                setState('ready');
            }catch(ex){if(!controller.signal.aborted){setError(ex.name==='PasswordException'?'파일 자체에 암호가 설정되어 있어 미리보기를 열 수 없습니다. 원본 파일을 다운로드해주세요.':ex.name==='InvalidPDFException'?'PDF 파일이 손상되었거나 올바른 PDF 형식이 아닙니다. 원본 파일을 확인해주세요.':ex.message||'파일을 표시하지 못했습니다.');setState('error');}}
        })();
        return()=>controller.abort();
    },[endpoint,started,attempt]);
    useEffect(()=>{
        if(kind!=='sheet'||state!=='ready'||sheet?.sheetIndex===sheetIndex)return;
        const controller=new AbortController();setSheetBusy(true);setSheetError('');
        jsonRequest(endpoint+`/sheet?sheet=${sheetIndex}`,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setSheet(data);}).catch(ex=>{if(!controller.signal.aborted)setSheetError(ex.message);}).finally(()=>{if(!controller.signal.aborted)setSheetBusy(false);});
        return()=>controller.abort();
    },[endpoint,kind,state,sheetIndex,sheetAttempt]);
    const controls=kind==='pdf'&&doc?<div className="archive-preview-controls" role="group" aria-label="PDF 조작">
        <button type="button" onClick={()=>setPage(n=>Math.max(1,n-1))} disabled={page<=1} aria-label="이전 페이지">←</button>
        <label>페이지 <input type="number" min={1} max={doc.numPages} value={page} onChange={event=>setPage(Math.min(doc.numPages,Math.max(1,Number(event.target.value)||1)))}/> / {doc.numPages}</label>
        <button type="button" onClick={()=>setPage(n=>Math.min(doc.numPages,n+1))} disabled={page>=doc.numPages} aria-label="다음 페이지">→</button>
        <button type="button" onClick={()=>setZoom(n=>Math.max(.5,n-.25))} disabled={zoom<=.5} aria-label="축소">−</button>
        <button type="button" onClick={()=>setZoom(n=>Math.min(3,n+.25))} disabled={zoom>=3} aria-label="확대">＋</button>
        <button type="button" onClick={()=>setZoom(1)} aria-label="너비 맞춤">너비 맞춤</button><span>{Math.round(zoom*100)}%</span><span className="archive-preview-note" role="status">{page} / {doc.numPages}페이지</span>
    </div>:kind==='markdown'?<div className="archive-preview-controls"><button type="button" aria-pressed={!raw} onClick={()=>setRaw(false)}>읽기</button><button type="button" aria-pressed={raw} onClick={()=>setRaw(true)}>원문</button></div>:kind==='sheet'&&sheet?<div className="archive-preview-controls"><label htmlFor={expanded?'preview-sheet-expanded':'preview-sheet'}>시트</label><select id={expanded?'preview-sheet-expanded':'preview-sheet'} value={sheetIndex} onChange={event=>setSheetIndex(Number(event.target.value))} disabled={sheetBusy}>{sheet.sheetNames.map((name,index)=><option key={index} value={index}>{name}</option>)}</select></div>:null;
    const body=<>
        {controls}
        {kind==='pdf'&&doc&&<PdfCanvas doc={doc} page={page} zoom={zoom}/>}
        {(kind==='text'||kind==='markdown')&&<div className="archive-text-preview" tabIndex={0} aria-label="문서 내용">
            {kind==='markdown'&&!raw?<Suspense fallback={<p>문서를 표시하고 있습니다…</p>}><Markdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={value=>webLink(value)||''} components={{img:({alt})=><span className="archive-preview-image-note">[외부 이미지: {alt||'이미지'}]</span>,a:({href,children})=>href?<a href={href} target="_blank" rel="noopener noreferrer">{children}</a>:<span>{children}</span>}}>{text}</Markdown></Suspense>:<pre>{text}</pre>}
        </div>}
        {truncated&&(kind==='text'||kind==='markdown')&&<p className="archive-preview-note">본문 앞부분 200,000자까지 표시합니다. 전체 내용은 원본을 다운로드해주세요.</p>}
        {kind==='sheet'&&sheet&&<>
            <p className="archive-preview-note">읽기 전용 · 시트 최대 50개, 시트별 500행·50열·일부 텍스트만 표시합니다. 수식은 파일에 저장된 결과이며 서식·차트는 원본과 다를 수 있습니다.</p>
            {sheetBusy?<p role="status">시트를 불러오는 중입니다…</p>:sheetError?<div><p role="alert">{sheetError}</p><button type="button" onClick={()=>setSheetAttempt(n=>n+1)}>시트 다시 불러오기</button></div>:<div className="archive-sheet-scroll" tabIndex={0} aria-label="스프레드시트 표"><table><caption>{sheet.sheetNames[sheet.sheetIndex]}</caption><thead><tr><th scope="col">행</th>{Array.from({length:Math.max(1,...sheet.rows.map(row=>row.length))},(_,index)=><th scope="col" key={index}>{columnName(index)}</th>)}</tr></thead><tbody>{sheet.rows.map((row,index)=><tr key={index}><th scope="row">{sheet.rowNumbers[index]}</th>{row.map((cell,column)=><td key={column}>{cell}</td>)}</tr>)}</tbody></table>{!sheet.rows.length&&<p>표시할 데이터가 없습니다.</p>}</div>}
        </>}
        {['.doc','.docx','.ppt','.pptx'].includes(ext)&&<p className="archive-preview-note">읽기 전용 변환본입니다. 글꼴·배치가 원본과 다를 수 있으며 애니메이션은 재생하지 않습니다.</p>}
    </>;
    return <section ref={region} tabIndex={-1} className="archive-document-preview" aria-label="파일 미리보기">
        <div className="archive-preview-heading"><h2>미리보기</h2>{state==='ready'&&<button type="button" onClick={()=>setExpanded(true)}>큰 화면 보기</button>}</div>
        {!supported?<div className="archive-preview-placeholder"><strong>{ext.replace('.','').toUpperCase()}</strong><p>이 형식은 미리보기를 지원하지 않습니다. 원본 파일을 다운로드해주세요.</p></div>:tooLarge?<div className="archive-preview-placeholder"><p>파일이 커서 미리보기를 제공하지 않습니다. 이 형식의 미리보기 제한은 {maxBytes/1024/1024}MB입니다.</p><p>원본 파일은 다운로드할 수 있습니다.</p></div>:state==='idle'?<div className="archive-preview-placeholder"><p>다운로드하기 전에 파일 내용을 확인할 수 있습니다.</p><p className="archive-preview-note">PDF 50MB · Word/PPT 20MB · Excel/CSV 10MB · MD/TXT 2MB까지 미리보기를 제공합니다.</p><button type="button" onClick={()=>setStarted(true)}>미리보기 열기</button></div>:['loading','converting'].includes(state)?<div className="archive-preview-placeholder" role="status"><p>{state==='converting'?'문서를 변환하고 있습니다. 잠시 기다려주세요.':'미리보기를 불러오는 중입니다…'}</p><p className="archive-preview-note">준비가 오래 걸리면 원본 파일을 다운로드할 수 있습니다.</p></div>:state==='error'?<div className="archive-preview-placeholder"><p role="alert">{error}</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>다시 시도</button></div>:!expanded?body:null}
        {expanded&&<PreviewDialog title={fileInfo.fileMainName+' 미리보기'} onClose={()=>setExpanded(false)}>{body}</PreviewDialog>}
    </section>;
}

export function ArchiveMediaPreview({fileInfo,fileUrl}){
    const ext=fileInfo.fileExtension.toLowerCase(),image=['.jpg','.jpeg','.png','.gif','.webp'].includes(ext),audio=['.mp3','.wav','.flac'].includes(ext);
    const [expanded,setExpanded]=useState(false),[error,setError]=useState(false);
    return <section className="archive-media-preview" aria-label="미디어 미리보기">
        {image?<button type="button" className="archive-image-open" onClick={()=>setExpanded(true)} aria-label="이미지 크게 보기"><img src={fileUrl} alt={fileInfo.fileMainName} onError={()=>setError(true)}/><span>크게 보기 ↗</span></button>:audio?<><p className="archive-preview-note">오디오 미리듣기</p>{fileInfo.mp3FileThumb&&<img className="archive-audio-art" src={`${API.API_BASE_URL}/archive/file/mp3/${fileInfo.mp3FileThumb}`} alt="앨범 이미지"/>}<audio src={fileUrl} controls preload="metadata" onError={()=>setError(true)}/></>:<video src={fileUrl} controls playsInline preload="metadata" onError={()=>setError(true)}/>}
        {error&&<p role="alert">이 파일을 표시하거나 재생하지 못했습니다. 브라우저에서 지원하지 않는 형식일 수 있습니다. 원본을 다운로드해주세요.</p>}
        {expanded&&<PreviewDialog title={fileInfo.fileMainName+' 이미지'} onClose={()=>setExpanded(false)}><div className="archive-image-expanded" tabIndex={0}><img src={fileUrl} alt={fileInfo.fileMainName}/></div></PreviewDialog>}
    </section>;
}
