/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI, Modality} from '@google/genai';
import {
  ChevronDown,
  Download,
  ImageUp,
  Info,
  LoaderCircle,
  Moon,
  Paintbrush,
  Redo2,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {useState, useRef, useEffect} from 'react';

// REMOVED: const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

type Mode = 'text-to-image' | 'image-to-image' | 'draw-to-image';
type Theme = 'light' | 'dark';

function parseError(error: any): string {
  if (error instanceof Error) {
    const match = error.message.match(/"message":\s*"(.*?)"/);
    if (match && match[1]) {
      return match[1];
    }
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred.';
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [downloadType, setDownloadType] = useState<'png' | 'jpeg'>('png');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for API Key management
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL();
        setCanvasHistory([dataUrl]);
        setHistoryIndex(0);
      }
    }
  };

  // Initialize canvas when mode changes to draw-to-image
  useEffect(() => {
    if (mode === 'draw-to-image') {
      // A small delay to ensure canvas is in the DOM
      setTimeout(initCanvas, 50);
    }
  }, [mode]);
  
  // Load generated image back to canvas in draw mode
  useEffect(() => {
    if (mode === 'draw-to-image' && resultImages.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          saveCanvasState();
        }
      };
      img.src = resultImages[0];
    }
  }, [resultImages]);


  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleModeChange = (newMode: Mode) => {
    if (mode !== newMode) {
      setMode(newMode);
      setResultImages([]);
      setSelectedImageIndex(0);
      setErrorMessage('');
      setPrompt('');
      setSourceImages([]);
      setNumberOfImages(1);
    }
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setPrompt('');
    setSourceImages([]);
    setResultImages([]);
    setSelectedImageIndex(0);
    setErrorMessage('');
    setShowAdvanced(true);
    setAspectRatio('1:1');
    setDownloadType('png');
    setNumberOfImages(1);
    if (mode === 'draw-to-image') {
      initCanvas();
    }
  };
  
    // Canvas history functions
  const saveCanvasState = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const restoreCanvasState = (index: number) => {
    if (!canvasRef.current || !canvasHistory[index]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataUrl = canvasHistory[index];
    const img = new window.Image();
    img.onload = () => {
      if(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = dataUrl;
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreCanvasState(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreCanvasState(newIndex);
    }
  };
  
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e.nativeEvent) e.preventDefault();
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const {x, y} = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e.nativeEvent) e.preventDefault();
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const {x, y} = getCoordinates(e);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, [isDrawing]);


  const processFiles = (files: FileList) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (imageFiles.length === 0) return;

    const readers = imageFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers)
      .then((newImages) => {
        setSourceImages((prev) => [...prev, ...newImages]);
        setResultImages([]);
        setSelectedImageIndex(0);
      })
      .catch(() => {
        setErrorMessage('Failed to read one or more files.');
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSourceImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    await generateOrEditImage();
    setIsSubmitting(false);

  }

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey) {
      setErrorMessage("Please enter an API key.");
      return;
    }
    setApiKey(tempApiKey);
    setShowApiKeyModal(false);
    
    // Use a timeout to allow state to update before triggering generation
    setTimeout(() => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      generateOrEditImage(tempApiKey).finally(() => setIsSubmitting(false));
    }, 0);
  };


  const generateOrEditImage = async (currentApiKey?: string) => {
    const keyToUse = currentApiKey || apiKey;
    if (!keyToUse) {
      setShowApiKeyModal(true);
      return;
    }

    if (!prompt) {
      setErrorMessage('Please enter a prompt to continue.');
      return;
    }
    if (mode === 'image-to-image' && sourceImages.length === 0) {
      setErrorMessage('Please upload at least one source image for editing.');
      return;
    }

    setIsLoading(true);
    setResultImages([]);
    setSelectedImageIndex(0);
    setErrorMessage('');

    try {
      const ai = new GoogleGenAI({apiKey: keyToUse});
      if ((mode === 'image-to-image' && sourceImages.length > 0) || mode === 'draw-to-image') {

        const parts = [];
        if (mode === 'image-to-image') {
          const imageParts = sourceImages.map((imgData) => {
            const mimeType = imgData.substring(
              imgData.indexOf(':') + 1,
              imgData.indexOf(';'),
            );
            const imageB64 = imgData.split(',')[1];
            return {inlineData: {data: imageB64, mimeType}};
          });
          parts.push(...imageParts);
        } else if (mode === 'draw-to-image' && canvasRef.current) {
          const imageB64 = canvasRef.current.toDataURL('image/png').split(',')[1];
          parts.push({inlineData: {data: imageB64, mimeType: 'image/png'}});
        }

        const textPart = {text: prompt};
        parts.push(textPart);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {parts},
        });
        
        let foundImage = false;
        const responseData = response;

        if(responseData.candidates && responseData.candidates[0].content.parts) {
          for (const part of responseData.candidates[0].content.parts) {
            if (part.inlineData) {
              const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              setResultImages([imageUrl]);
              foundImage = true;
              break;
            }
          }
        }
        
        if (!foundImage) {
          const textMessage = responseData.text;
          setErrorMessage(
            textMessage ||
              'The model did not return an image. Please try a different prompt.',
          );
        }
      } else { // Text-to-image
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-fast-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: numberOfImages,
            aspectRatio: aspectRatio as any,
            outputMimeType:
              `image/${downloadType}` as 'image/png' | 'image/jpeg',
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const imageUrls = response.generatedImages.map((img) => {
            const base64Image = img.image.imageBytes;
            return `data:image/${downloadType};base64,${base64Image}`;
          });
          setResultImages(imageUrls);
        } else {
          setErrorMessage(
            'The model did not return an image. Please try again.',
          );
        }
      }
    } catch (error) {
      console.error('Error during API call:', error);
      setErrorMessage(parseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    const targetMimeType = `image/${downloadType}`;
    const targetExtension = downloadType;
    const sourceMimeType = imageUrl.match(/data:(image\/.*?);/)?.[1];

    let finalImageUrl = imageUrl;

    if (sourceMimeType && sourceMimeType !== targetMimeType) {
      try {
        finalImageUrl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            if (targetMimeType === 'image/jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL(targetMimeType, 0.9));
          };
          img.onerror = () => {
            reject(new Error('Failed to load image for conversion.'));
          };
          img.src = imageUrl;
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Image conversion failed.',
        );
        return;
      }
    }

    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = `gemini-studio-image.${targetExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Gemini-Image-Studio</h1>
          <p>State-of-the-art image generation and editing app, built by 
          <a href="https://hf.co/prithivMLmods" target="_blank"> hf.co/prithivMLmods</a>
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="button theme-toggle"
          aria-label="Toggle theme">
          {theme === 'light' ? (
            <Moon className="w-6 h-6" />
          ) : (
            <Sun className="w-6 h-6" />
          )}
        </button>
      </header>
      <main className="app-main">
        <div className="main-grid">
          {/* Input Card */}
          <div className="card">
            <div className="head">
              <span>INPUT</span>
              <div
                className="relative inline-block text-left"
                ref={dropdownRef}>
                <button
                  type="button"
                  className="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  {mode === 'text-to-image'
                    ? 'Text-to-Image'
                    : mode === 'image-to-image'
                    ? 'Image-to-Image'
                    : 'Draw-to-Image'}
                  <ChevronDown className="-mr-1 h-5 w-5" />
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-panel">
                    <div
                      onClick={() => handleModeChange('text-to-image')}
                      className={`dropdown-item ${
                        mode === 'text-to-image' ? 'active' : ''
                      }`}
                      role="menuitem">
                      Text-to-Image
                    </div>
                    <div
                      onClick={() => handleModeChange('image-to-image')}
                      className={`dropdown-item ${
                        mode === 'image-to-image' ? 'active' : ''
                      }`}
                      role="menuitem">
                      Image-to-Image
                    </div>
                    <div
                      onClick={() => handleModeChange('draw-to-image')}
                      className={`dropdown-item ${
                        mode === 'draw-to-image' ? 'active' : ''
                      }`}
                      role="menuitem">
                      Draw-to-Image
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="content">
              <form onSubmit={handleSubmit} className="form-content">
                {mode === 'image-to-image' && (
                  <div className="form-group">
                    <label>Source Image(s)</label>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      multiple
                    />
                    <div
                      className="uploader"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}>
                      {sourceImages.length > 0 ? (
                        <div className="image-grid">
                          {sourceImages.map((image, index) => (
                            <div
                              key={index}
                              className="relative group aspect-square">
                              <img src={image} alt={`Source ${index + 1}`} />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="image-remove-button"
                                aria-label={`Remove image ${index + 1}`}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="uploader-add-button">
                            + Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="uploader-placeholder">
                          <ImageUp className="w-8 h-8" />
                          <span>Click or Drag & Drop</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {mode === 'draw-to-image' && (
                  <div className="form-group">
                    <label>Canvas</label>
                    <div className="canvas-container">
                       <canvas
                          ref={canvasRef}
                          width={960}
                          height={540}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                       <div className="canvas-controls">
                        <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} aria-label="Undo">
                          <Undo2 className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={handleRedo} disabled={historyIndex >= canvasHistory.length - 1} aria-label="Redo">
                          <Redo2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}


                <div className="form-group">
                  <div className="label-with-info">
                    <label htmlFor="prompt">Prompt</label>
                    {mode === 'text-to-image' && (
                      <div className="info-tooltip-container">
                        <Info className="w-4 h-4 info-icon" />
                        <span className="info-tooltip">
                          The model used for this mode is <code>imagen-4.0-fast-generate-001</code>.
                        </span>
                      </div>
                    )}
                    {(mode === 'image-to-image' || mode === 'draw-to-image') && (
                      <div className="info-tooltip-container">
                        <Info className="w-4 h-4 info-icon" />
                        <span className="info-tooltip">
                          The model used for image editing is <code>gemini-2.5-flash-image</code>.
                        </span>
                      </div>
                    )}
                  </div>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      mode === 'image-to-image'
                        ? 'Describe how to edit the image(s)...'
                        : mode === 'draw-to-image'
                        ? 'Describe the image you want to create from your drawing...'
                        : 'A photorealistic cat astronaut on Mars...'
                    }
                    className="input"
                    required
                  />
                </div>

                <div className="form-group">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="advanced-toggle">
                    <span>Advanced Settings</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        showAdvanced ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {showAdvanced && (
                    <div className="advanced-panel">
                      {mode === 'text-to-image' && (
                        <>
                          <div className="form-group">
                            <div className="label-with-value">
                              <label htmlFor="number-of-images">
                                Number of Images
                              </label>
                              <span>{numberOfImages}</span>
                            </div>
                            <input
                              id="number-of-images"
                              type="range"
                              value={numberOfImages}
                              onChange={(e) =>
                                setNumberOfImages(parseInt(e.target.value, 10))
                              }
                              min="1"
                              max="4"
                              step="1"
                              className="slider"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="aspect-ratio">Aspect Ratio</label>
                            <select
                              id="aspect-ratio"
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                              className="input">
                              {aspectRatios.map((ar) => (
                                <option key={ar} value={ar}>
                                  {ar}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                      <div className="form-group">
                        <label htmlFor="download-type">Download Format</label>
                        <select
                          id="download-type"
                          value={downloadType}
                          onChange={(e) =>
                            setDownloadType(e.target.value as 'png' | 'jpeg')
                          }
                          className="input">
                          <option value="png">PNG</option>
                          <option value="jpeg">JPEG</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="button primary">
                    {isLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <span>
                          {mode === 'image-to-image'
                            ? 'Editing...'
                            : 'Generating...'}
                        </span>
                      </>
                    ) : (
                      <>
                        {mode === 'text-to-image' && 'Generate Image'}
                        {mode === 'image-to-image' && 'Edit Image'}
                        {mode === 'draw-to-image' && 'Generate from Drawing'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="button secondary"
                    aria-label="Clear inputs">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Result Card */}
          <div className="card">
            <div className="head">
              <span>RESULT</span>
            </div>
            <div className="content">
              <div className="result-area">
                {isLoading ? (
                  <div className="result-placeholder">
                    <LoaderCircle className="w-10 h-10 animate-spin" />
                    <p>
                      {mode === 'image-to-image' || mode === 'draw-to-image'
                        ? 'Processing your image...'
                        : `Generating ${numberOfImages} image(s)...`}
                    </p>
                  </div>
                ) : resultImages.length > 0 ? (
                  <div className="showcase-container">
                    <div className="main-image-wrapper group">
                      <img
                        src={resultImages[selectedImageIndex]}
                        alt={`Generated result ${selectedImageIndex + 1}`}
                      />
                      <button
                        onClick={() =>
                          handleDownload(resultImages[selectedImageIndex])
                        }
                        className="download-button"
                        aria-label="Download image">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                    {resultImages.length > 1 && (
                      <div className="thumbnail-container">
                        {resultImages.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className={`thumbnail-image ${
                              index === selectedImageIndex ? 'active' : ''
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="result-placeholder">
                    {mode === 'draw-to-image' ? <Paintbrush className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
                    <h3>
                      {mode === 'draw-to-image' 
                        ? "Start drawing and see your ideas come to life"
                        : "Your result will appear here"
                      }
                    </h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {errorMessage && (
        <div className="modal-backdrop">
          <div className="card modal-card">
            <div className="head">
              <span>REQUEST FAILED</span>
              <button
                onClick={() => setErrorMessage('')}
                className="modal-close-button">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="content">
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {showApiKeyModal && (
        <div className="modal-backdrop">
          <div className="card modal-card api-key-modal">
            <div className="head">
              <span>Add Your Gemini API Key</span>
               <button
                onClick={() => setShowApiKeyModal(false)}
                className="modal-close-button">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="content">
              <p className="api-key-info">
                Your API key is only stored for this session and will be lost when you reload or exit the page. It is not shared or exposed anywhere.
              </p>
              <form onSubmit={handleApiKeySubmit} className="api-key-form">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="input"
                  placeholder="Enter your Gemini API Key"
                  required
                />
                <button type="submit" className="button primary" disabled={isLoading}>
                  {isLoading ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit & Run"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}