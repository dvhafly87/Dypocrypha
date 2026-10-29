// The loading task owns PDF.js workers, including after its document has loaded.
// PDFDocumentProxy in PDF.js 6 has no destroy() method.
export async function loadPreviewPdf(getDocument,options,signal,onDestroyError=error=>console.warn('PDF preview cleanup failed',error)){
    signal.throwIfAborted();
    const task=getDocument(options);
    let destruction;
    const destroy=()=>destruction??=(Promise.resolve().then(()=>task.destroy()).catch(onDestroyError));
    signal.addEventListener('abort',destroy,{once:true});
    try{
        const document=await task.promise;
        signal.throwIfAborted();
        // Keep the abort listener until the preview's effect is disposed.
        return document;
    }catch(error){
        signal.removeEventListener('abort',destroy);
        await destroy();
        throw error;
    }
}
