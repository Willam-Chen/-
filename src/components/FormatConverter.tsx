import React, { useState, useRef, useEffect } from 'react';
import { FileType, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { convertImageToPsd, fileToBase64 } from '../lib/psd-utils';

export default function FormatConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<{ original: File, psdBlob: Blob }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setFiles(selectedFiles);
      setResults([]);
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setResults([]);

    try {
      const newResults = [];
      for (const file of files) {
        const base64Url = await fileToBase64(file);
        const psdBlob = await convertImageToPsd(base64Url);
        newResults.push({ original: file, psdBlob });
      }
      setResults(newResults);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('转换失败，请检查控制台了解详情。');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPsd = (blob: Blob, originalName: string) => {
    const filename = originalName.replace(/\.[^/.]+$/, "") + ".psd";
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">图片转 PSD 格式</h2>
        <p className="text-slate-500 text-sm">上传任意常规图片 (PNG, JPG, WebP)，一键转换为包含独立图层的标准 PSD 文件。</p>
      </div>

      <div className="space-y-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-3xl p-16 text-center hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
        >
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
            <ImageIcon size={36} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">选择需要转换的图片</p>
            <p className="text-sm text-slate-500 mt-1">支持拖拽多个文件至此区域</p>
          </div>
          {files.length > 0 && (
            <div className="mt-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
              已准备好 {files.length} 个文件
            </div>
          )}
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {files.length > 0 && (
          <div className="mt-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <ImageIcon size={16} className="text-emerald-500" />
              已上传图片预览 ({files.length}张)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm group bg-slate-50">
                  <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                    <span className="text-white text-[10px] font-medium truncate w-full">{files[idx].name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={files.length === 0 || isConverting}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-4 font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-[0.98]"
        >
          {isConverting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              正在转换 {files.length} 个文件...
            </>
          ) : (
            <>
              <FileType size={24} />
              立即转换为 PSD
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-6 pt-10 border-t-2 border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">转换完成</h3>
          <div className="space-y-4">
            {results.map((res, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <span className="font-bold text-sm">PSD</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800 truncate max-w-[200px] sm:max-w-sm" title={res.original.name}>
                      {res.original.name.replace(/\.[^/.]+$/, "") + ".psd"}
                    </p>
                    <p className="text-sm text-emerald-600 font-medium mt-0.5">转换成功，可下载</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadPsd(res.psdBlob, res.original.name)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-blue-200"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">下载文件</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
