import api from './api';
import html2pdf from 'html2pdf.js';

/**
 * Core Cross-Browser Blob Downloader.
 * Guarantees compatibility with Chrome (Android/Desktop), Samsung Internet, Edge, Firefox, and Safari.
 * Appends link to document.body before click and delays URL revocation for mobile browser compatibility.
 */
export const downloadBlob = (blob, filename = 'download') => {
  try {
    if (!(blob instanceof Blob)) {
      throw new Error('Invalid blob object provided for download');
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;

    // Mobile browsers (Samsung Internet, Mobile Safari/Chrome) require the anchor in DOM
    document.body.appendChild(a);
    a.click();

    // Delay removal & URL revocation so background download stream completes on Samsung Internet & Safari
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error('downloadBlob error:', err);
    alert(`Download error: ${err.message || 'Unable to download file'}`);
  }
};

/**
 * Cross-browser URL/API file downloader using Axios with responseType: 'blob'.
 * Automatically sends user auth tokens and handles filename resolution.
 */
export const downloadFromUrl = async (fileUrl, defaultFilename = 'document', onError = null) => {
  try {
    if (!fileUrl) throw new Error('No valid URL provided for download');

    let blob;
    let filename = defaultFilename;

    if (fileUrl.startsWith('/') || fileUrl.includes(window.location.origin) || !fileUrl.startsWith('http')) {
      // Use configured Axios instance (includes Bearer token & x-program-id headers)
      const response = await api.get(fileUrl, { responseType: 'blob' });
      blob = response.data;

      // Extract filename from Content-Disposition header if present
      const disposition = response.headers?.['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
    } else {
      // Direct CORS fetch
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      blob = await res.blob();
    }

    if (!blob) throw new Error('Failed to retrieve file contents');

    // Ensure fallback filename has extension if missing
    if (!filename.includes('.')) {
      const ext = fileUrl.split('.').pop()?.split('?')[0];
      if (ext && ext.length < 5) {
        filename = `${filename}.${ext}`;
      }
    }

    downloadBlob(blob, filename);
  } catch (err) {
    console.error('downloadFromUrl error:', err);
    const message = err.response?.data?.message || err.message || 'File download failed';
    if (typeof onError === 'function') {
      onError(message);
    } else {
      alert(`Download failed: ${message}`);
    }
  }
};

/**
 * Cross-browser String / JSON / CSV Data Export Downloader.
 */
export const downloadDataAsFile = (content, filename = 'export.txt', mimeType = 'text/plain') => {
  try {
    const stringContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    const blob = new Blob([stringContent], { type: `${mimeType};charset=utf-8` });
    downloadBlob(blob, filename);
  } catch (err) {
    console.error('downloadDataAsFile error:', err);
    alert('Failed to export data file.');
  }
};

/**
 * Cross-browser HTML5 Canvas to Image (PNG/JPEG) Downloader.
 */
export const downloadCanvasAsImage = (canvas, filename = 'image.png', imageType = 'image/png') => {
  try {
    if (!canvas) throw new Error('Canvas element not provided');

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename);
        } else {
          // Fallback to Data URL parsing
          downloadDataUrl(canvas.toDataURL(imageType), filename);
        }
      }, imageType);
    } else {
      downloadDataUrl(canvas.toDataURL(imageType), filename);
    }
  } catch (err) {
    console.error('downloadCanvasAsImage error:', err);
    alert('Failed to generate and download image.');
  }
};

/**
 * Helper to convert Data URL to Blob and download cross-browser.
 */
export const downloadDataUrl = (dataUrl, filename = 'download') => {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    downloadBlob(blob, filename);
  } catch (err) {
    console.error('downloadDataUrl error:', err);
    alert('Failed to download file from data URL.');
  }
};

/**
 * Cross-browser HTML element to PDF Blob Downloader using html2pdf.js.
 * Generates PDF blob asynchronously and uses downloadBlob for guaranteed mobile browser compatibility.
 */
export const downloadElementAsPdf = async (element, filename = 'document.pdf', customOpt = {}) => {
  try {
    if (!element) throw new Error('Target DOM element for PDF generation not found');

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      ...customOpt
    };

    const worker = html2pdf().set(opt).from(element);
    const pdfBlob = await worker.output('blob');
    
    if (!pdfBlob) throw new Error('Failed to generate PDF Blob');

    downloadBlob(pdfBlob, filename);
  } catch (err) {
    console.error('downloadElementAsPdf error:', err);
    alert('Failed to generate and download PDF document.');
  }
};
