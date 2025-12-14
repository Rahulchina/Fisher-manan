import React, { useState, useRef } from 'react';
import { editImageWithGemini, generateImageWithGemini } from '../services/geminiService';
import { Button } from './Button';
import { Wand2, Image as ImageIcon, Download, Upload, Paintbrush, Sparkles, Palette } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Pixel Art');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STYLES = ['No Style', 'Pixel Art', '3D Render', 'Watercolor', 'Cyberpunk', 'Ukiyo-e', 'Oil Painting'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !selectedImage) return;

    setIsProcessing(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let result: string;
      if (mode === 'generate') {
        const finalPrompt = style !== 'No Style' ? `${style} style. ${prompt}` : prompt;
        result = await generateImageWithGemini(finalPrompt);
      } else {
        result = await editImageWithGemini(selectedImage!, prompt);
      }
      setGeneratedImage(result);
    } catch (err: any) {
      setError("Failed to process image. " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Wand2 className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Nano Banana Studio</h2>
        </div>
        <p className="text-slate-300">
          Use the power of Gemini 2.5 Flash to create amazing visuals. Generate new characters from scratch or edit your prize catches!
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md mx-auto">
        <button
          onClick={() => setMode('generate')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'generate' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Generate
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'edit' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Paintbrush className="w-4 h-4" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Controls */}
        <div className="space-y-6">
          
          {mode === 'edit' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                1. Upload Source Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-dashed border-2 border-slate-600 bg-slate-800/50 hover:bg-slate-700/50"
              >
                 {selectedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={selectedImage} alt="Source" className="max-h-24 object-contain rounded" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded">
                            <span className="text-white font-medium">Change Image</span>
                        </div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span>Click to Upload Source</span>
                    </div>
                 )}
              </Button>
            </div>
          )}

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            {mode === 'generate' && (
               <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Art Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          style === s 
                            ? 'bg-purple-600 border-purple-400 text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
               </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {mode === 'generate' ? 'Describe your imagination' : 'Describe your edits'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'generate' 
                  ? "E.g., 'A stylized 3D fantasy character with spiky red hair, large expressive eyes, wearing leather armor...'"
                  : "E.g., 'Add a golden aura around the fish', 'Make the background a stormy ocean', 'Turn the fish into a robot'"
                }
                className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || (mode === 'edit' && !selectedImage)} 
            isLoading={isProcessing}
            variant="vip" // Purple style for AI feature
            className="w-full py-4 text-lg"
          >
            <Wand2 className="w-5 h-5" /> 
            {mode === 'generate' ? 'Generate Image' : 'Apply Edits'}
          </Button>

          {error && (
            <div className="p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-500/30 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-1 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
            {generatedImage ? (
                <img 
                    src={generatedImage} 
                    alt="Result" 
                    className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl"
                />
            ) : (
                <div className="text-center text-slate-600">
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Wand2 className="w-16 h-16 text-purple-500 animate-spin" />
                            <p className="text-purple-300">Dreaming up your image...</p>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Result will appear here</p>
                        </>
                    )}
                </div>
            )}
            
            {generatedImage && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <a 
                        href={generatedImage} 
                        download={`nano-angler-${mode}-${Date.now()}.png`} 
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 transition-colors"
                        title="Download Image"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};