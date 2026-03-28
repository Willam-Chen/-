import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Download, Loader2, Link as LinkIcon, Wand2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { convertImageToPsd, fileToBase64 } from '../lib/psd-utils';

export default function BatchGenerator() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<'png' | 'psd'>('psd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ original: File, resultUrl: string, resultPsd?: Blob }[]>([]);
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
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setIsGenerating(true);
    setResults([]);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const newResults = [];

      for (const file of files) {
        const base64Full = await fileToBase64(file);
        const base64Data = base64Full.split(',')[1];

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type,
                },
              },
              {
                text: prompt || '将此图案转化为适合手机壳打印的高清图案，优化细节和色彩，保持主体清晰。',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "9:16",
              imageSize: "2K"
            }
          }
        });

        let generatedImageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (generatedImageUrl) {
          let psdBlob;
          if (outputFormat === 'psd') {
            psdBlob = await convertImageToPsd(generatedImageUrl);
          }
          newResults.push({ original: file, resultUrl: generatedImageUrl, resultPsd: psdBlob });
        }
      }
      setResults(newResults);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('转化失败，请检查控制台了解详情。如果提示权限不足，请确保已配置有效的 API Key。');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPsd = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">来图转化 (转印工厂 PSD)</h2>
        <p className="text-slate-500 text-sm">上传其他店铺的主图或参考图，AI 将自动优化并转化为可直接用于生产的 9:16 高清图案。</p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="text-pink-500" size={18} />
              上传参考图
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-pink-200 bg-pink-50/30 rounded-3xl p-12 text-center hover:bg-pink-50 hover:border-pink-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-sm group-hover:scale-110 transition-transform">
                <ImageIcon size={28} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">点击或拖拽图片至此</p>
                <p className="text-sm text-slate-500 mt-1">支持批量上传 PNG, JPG</p>
              </div>
              {files.length > 0 && (
                <div className="mt-4 px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-bold shadow-sm">
                  已选择 {files.length} 张图片
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
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <ImageIcon size={16} className="text-pink-500" />
                  已上传参考图预览 ({files.length}张)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Wand2 className="text-pink-500" size={18} />
              附加要求 (可选)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：去除背景文字，增强色彩对比度，转为水彩风格..."
              className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-pink-300 transition-all resize-none h-28 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-4">输出设置</h3>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">目标格式</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOutputFormat('png')}
                  className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    outputFormat === 'png'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  PNG (预览)
                </button>
                <button
                  onClick={() => setOutputFormat('psd')}
                  className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    outputFormat === 'psd'
                      ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  PSD (工厂生产)
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>商品链接抓取</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">即将上线</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon size={16} />
                </div>
                <input
                  type="text"
                  disabled
                  placeholder="输入淘宝/1688商品链接..."
                  className="w-full border-2 border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={files.length === 0 || isGenerating}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl py-4 font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-200 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                正在处理 {files.length} 张图片...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                开始批量转化
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6 pt-10 border-t-2 border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" />
            转化结果
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((res, idx) => (
              <div key={idx} className="group border-2 border-slate-100 rounded-3xl overflow-hidden bg-white hover:shadow-xl hover:border-pink-200 transition-all">
                <div className="aspect-[9/16] bg-slate-50 relative p-4">
                  <img src={res.resultUrl} alt={`Result ${idx}`} className="w-full h-full object-contain rounded-xl shadow-sm" />
                </div>
                <div className="p-5 flex items-center justify-between bg-white">
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]" title={res.original.name}>
                    {res.original.name}
                  </span>
                  {outputFormat === 'psd' && res.resultPsd ? (
                    <button
                      onClick={() => downloadPsd(res.resultPsd!, `case_design_${idx}.psd`)}
                      className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      PSD
                    </button>
                  ) : (
                    <button
                      onClick={() => downloadFile(res.resultUrl, `case_design_${idx}.png`)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      PNG
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
