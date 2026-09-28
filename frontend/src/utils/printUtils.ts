/**
 * Utility functions for silent/in-page printing via clean hidden iframes.
 * Avoids opening extra blank tabs or PDF viewer windows.
 */

export const getCleanPrintIframe = (): HTMLIFrameElement => {
    const existing = document.getElementById('curare-print-iframe');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'curare-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    return iframe;
};

/**
 * Sends a jsPDF document or blob URL directly to the print dialog via hidden iframe.
 */
export const printPdf = (docOrBlobUrl: any) => {
    try {
        if (docOrBlobUrl && typeof docOrBlobUrl.autoPrint === 'function') {
            docOrBlobUrl.autoPrint();
        }
        const blobUrl = docOrBlobUrl && typeof docOrBlobUrl.output === 'function'
            ? docOrBlobUrl.output('bloburl')
            : docOrBlobUrl;

        const iframe = getCleanPrintIframe();
        iframe.src = String(blobUrl);
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Error triggering PDF print dialog:', e);
                }
            }, 150);
        };
    } catch (err) {
        console.error('Error in printPdf:', err);
    }
};

/**
 * Writes HTML content into a hidden iframe and triggers the native print dialog.
 */
export const printHtml = (htmlContent: string) => {
    try {
        const iframe = getCleanPrintIframe();
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(htmlContent);
        doc.close();
        if (doc) doc.title = '';

        setTimeout(() => {
            try {
                if (iframe.contentDocument) iframe.contentDocument.title = '';
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Error triggering HTML print dialog:', e);
            }
        }, 250);
    } catch (err) {
        console.error('Error in printHtml:', err);
    }
};
