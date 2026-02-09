import React from 'react';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  FileSpreadsheet,
  FileCode,
  Archive,
  File,
  Presentation
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  previewUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, string> = {
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', 
    webp: 'image', svg: 'image', bmp: 'image', ico: 'image',
    // Videos
    mp4: 'video', avi: 'video', mov: 'video', wmv: 'video',
    flv: 'video', mkv: 'video', webm: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio',
    aac: 'audio', wma: 'audio', m4a: 'audio',
    // Documents
    pdf: 'pdf',
    doc: 'document', docx: 'document', txt: 'document', rtf: 'document',
    // Spreadsheets
    xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
    // Presentations
    ppt: 'presentation', pptx: 'presentation',
    // Code
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
    html: 'code', css: 'code', json: 'code', xml: 'code',
    py: 'code', java: 'code', cpp: 'code', c: 'code',
    // Archives
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  };
  
  return typeMap[extension] || 'file';
};

const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const FileIcon: React.FC<FileIconProps> = ({ 
  fileName, 
  previewUrl,
  size = 'md' 
}) => {
  const fileType = getFileType(fileName);
  const canShowPreview = isImageFile(fileName) && previewUrl;

  if (canShowPreview) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-muted flex-shrink-0`}>
        <img 
          src={previewUrl} 
          alt={fileName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const iconConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    image: { icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    video: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    audio: { icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' },
    document: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10' },
    presentation: { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    code: { icon: FileCode, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    archive: { icon: Archive, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    file: { icon: File, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const config = iconConfig[fileType] || iconConfig.file;
  const IconComponent = config.icon;

  return (
    <div className={`${sizeClasses[size]} rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <IconComponent className={`${iconSizeClasses[size]} ${config.color}`} />
    </div>
  );
};
