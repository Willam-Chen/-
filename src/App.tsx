/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Smartphone, Sparkles, Image as ImageIcon, FileType, Key } from 'lucide-react';
import BatchGenerator from './components/BatchGenerator';
import FormatConverter from './components/FormatConverter';
import NewDesign from './components/NewDesign';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'design' | 'batch' | 'convert'>('design');
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        setHasKey(keySelected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume success to mitigate race condition
    }
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-pink-200 rotate-12">
            <Key size={36} className="-rotate-12" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">需要配置 API Key</h1>
            <p className="text-slate-500 leading-relaxed">
              本项目使用了最新的高质量图像生成模型 (Nano Banana 2)。
              请先选择或配置您的付费 Google Cloud 项目 API Key 才能继续使用。
            </p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 font-medium hover:underline inline-block mt-2">
              了解计费详情 &rarr;
            </a>
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
          >
            选择 API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-fuchsia-200">
              <Smartphone size={22} />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              手机壳来图定制
            </h1>
          </div>
          <nav className="flex items-center gap-2 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveTab('design')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'design' 
                  ? 'bg-white shadow-sm text-indigo-600 border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Sparkles size={16} className={activeTab === 'design' ? 'text-indigo-500' : ''} />
              全新设计
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'batch' 
                  ? 'bg-white shadow-sm text-pink-600 border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <ImageIcon size={16} className={activeTab === 'batch' ? 'text-pink-500' : ''} />
              来图转化
            </button>
            <button
              onClick={() => setActiveTab('convert')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'convert' 
                  ? 'bg-white shadow-sm text-emerald-600 border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <FileType size={16} className={activeTab === 'convert' ? 'text-emerald-500' : ''} />
              格式转换
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'design' && <NewDesign />}
        {activeTab === 'batch' && <BatchGenerator />}
        {activeTab === 'convert' && <FormatConverter />}
      </main>
    </div>
  );
}
