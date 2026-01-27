import {
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileExcel,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
} from 'react-icons/fa';

export function getFileExtension(value) {
  if (!value || typeof value !== 'string') return '';
  const clean = value.split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || clean;
  const dot = last.lastIndexOf('.');
  if (dot <= 0 || dot === last.length - 1) return '';
  return last.slice(dot + 1).toLowerCase();
}

export function getFileIconInfo({ fileName, filePath, mimeType } = {}) {
  const ext = getFileExtension(fileName) || getFileExtension(filePath);
  const mime = (mimeType || '').toLowerCase();

  const fromMime = () => {
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'excel';
    if (mime.includes('word')) return 'word';
    if (mime.includes('powerpoint') || mime.includes('presentation')) return 'ppt';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return 'zip';
    if (mime.includes('text')) return 'txt';
    return '';
  };

  const kind = ext || fromMime();

  // NOTE: `faIcon` values assume FontAwesome (fas) is available in the app styles.
  switch (kind) {
    case 'pdf':
      return { kind: 'pdf', Icon: FaFilePdf, faIcon: 'fa-file-pdf', colorClass: 'text-danger' };

    case 'xls':
    case 'xlsx':
    case 'csv':
      return { kind: 'excel', Icon: FaFileExcel, faIcon: 'fa-file-excel', colorClass: 'text-success' };

    case 'doc':
    case 'docx':
      return { kind: 'word', Icon: FaFileWord, faIcon: 'fa-file-word', colorClass: 'text-primary' };

    case 'ppt':
    case 'pptx':
      return {
        kind: 'powerpoint',
        Icon: FaFilePowerpoint,
        faIcon: 'fa-file-powerpoint',
        colorClass: 'text-warning',
      };

    case 'zip':
    case 'rar':
    case '7z':
      return { kind: 'archive', Icon: FaFileArchive, faIcon: 'fa-file-archive', colorClass: 'text-secondary' };

    case 'txt':
      return { kind: 'text', Icon: FaFileAlt, faIcon: 'fa-file-alt', colorClass: 'text-muted' };

    default:
      return { kind: 'file', Icon: FaFile, faIcon: 'fa-file', colorClass: 'text-muted' };
  }
}


