import { useState } from 'react';
import { Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { convertImageToPsd } from '../lib/psd-utils';

const ASPECT_RATIOS = [
  { label: '1:1 (方形)', value: '1:1' },
  { label: '3:4 (竖版)', value: '3:4' },
  { label: '4:3 (横版)', value: '4:3' },
  { label: '9:16 (手机壳推荐)', value: '9:16' },
  { label: '16:9 (宽屏)', value: '16:9' },
  { label: '1:4 (超长竖版)', value: '1:4' },
  { label: '4:1 (超长横版)', value: '4:1' },
];

const IMAGE_SIZES = [
  { label: '512px (快速预览)', value: '512px' },
  { label: '1K (标准高清)', value: '1K' },
  { label: '2K (超清印刷)', value: '2K' },
  { label: '4K (极致细节)', value: '4K' },
];

export default function NewDesign() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [imageSize, setImageSize] = useState('2K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultPsd, setResultPsd] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResultUrl(null);
    setResultPsd(null);

    try {
      // Use API_KEY if available (from openSelectKey), otherwise fallback to GEMINI_API_KEY
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize,
          },
        },
      });

      let generatedImageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImageUrl) {
        setResultUrl(generatedImageUrl);
        // Automatically prepare PSD in background
        const psdBlob = await convertImageToPsd(generatedImageUrl);
        setResultPsd(psdBlob);
      } else {
        throw new Error('未找到生成的图片数据');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成失败，请检查控制台了解详情。如果提示权限不足，请确保已配置有效的 API Key。');
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

  const downloadPsd = () => {
    if (!resultPsd) return;
    const url = URL.createObjectURL(resultPsd);
    downloadFile(url, `design_${Date.now()}.psd`);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              画面描述 (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述您想要的手机壳图案，例如：赛博朋克风格的机械猫咪，霓虹灯光效，极具未来感，高清细节..."
              className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none h-40 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800">图片比例</label>
              <div className="space-y-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      aspectRatio === ratio.value
                        ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800">输出画质</label>
              <div className="space-y-2">
                {IMAGE_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setImageSize(size.value)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      imageSize === size.value
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 shadow-sm'
                        : 'bg-white text-slate-600 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl py-4 font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                正在为您创作专属图案...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                开始生成设计
              </>
            )}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-7">
          <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 h-full min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            {resultUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative group rounded-2xl overflow-hidden shadow-2xl max-h-[600px]">
                  <img src={resultUrl} alt="Generated Design" className="max-w-full max-h-[600px] object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button
                      onClick={() => downloadFile(resultUrl, `design_${Date.now()}.png`)}
                      className="bg-white text-slate-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-lg"
                    >
                      <Download size={18} />
                      下载 PNG
                    </button>
                    {resultPsd && (
                      <button
                        onClick={downloadPsd}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        <Download size={18} />
                        下载 PSD
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => downloadFile(resultUrl, `design_${Date.now()}.png`)}
                    className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={18} />
                    保存 PNG
                  </button>
                  {resultPsd && (
                    <button
                      onClick={downloadPsd}
                      className="px-6 py-2.5 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Download size={18} />
                      保存工厂 PSD
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 text-slate-400">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 rotate-3">
                  <ImageIcon size={40} className="text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-500">设计预览区</p>
                <p className="text-sm max-w-xs mx-auto">
                  在左侧输入您的创意描述，选择合适的比例和画质，AI 将为您生成独一无二的手机壳图案。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
