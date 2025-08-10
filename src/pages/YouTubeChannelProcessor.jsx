import { useState, useEffect } from 'react';
import { 
  Play, Loader2, AlertCircle, Eye, Clock, Image, FileText, 
  CheckCircle, Save, ExternalLink, Plus, X, RefreshCw,
  ChevronDown, ChevronUp, Trash2, Check, Search, Link2, Palette, Download
} from 'lucide-react';

const YouTubeChannelProcessor = () => {
  // State Management
  const [channelUrls, setChannelUrls] = useState(['']);
  const [channelsData, setChannelsData] = useState({});
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [step, setStep] = useState('channels');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [currentVideoForType, setCurrentVideoForType] = useState(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [regeneratingItems, setRegeneratingItems] = useState({});
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateConfig, setRegenerateConfig] = useState({ video: null, type: '', prompt: '' });
  const [selectedImageView, setSelectedImageView] = useState({});

  const N8N_WEBHOOK_FETCH = import.meta.env.VITE_APP_N8N_WEBHOOK_FETCH;
  const N8N_WEBHOOK_PROCESS = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_DRIVE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;

  const contentTypes = [
    {
      id: 'IDYT',
      name: 'IDYT - Educational',
      icon: '📚',
      description: 'Learning-focused content with cartoon elements',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgLight: 'bg-blue-50',
      prompt: 'generate only one image of A simple, cute cartoon-style illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The subject should be easily recognizable, appealing, and fun to color.'
    },
    {
      id: 'IDPP',
      name: 'IDPP - Adventure',
      icon: '🚀',
      description: 'Exciting adventure scenes and exploration',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      bgLight: 'bg-green-50',
      prompt: 'A simple, cute cartoon-style adventure scene based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be exciting, adventurous, and fun to color.'
    },
    {
      id: 'IDMP',
      name: 'IDMP - Animals',
      icon: '🐾',
      description: 'Cute animals and wildlife content',
      color: 'bg-pink-500',
      borderColor: 'border-pink-500',
      bgLight: 'bg-pink-50',
      prompt: 'A simple, cute cartoon-style animal illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The animal should be adorable, child-friendly, and fun to color.'
    },
    {
      id: 'IDST',
      name: 'IDST - Fantasy',
      icon: '✨',
      description: 'Magical and whimsical fantasy elements',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      bgLight: 'bg-purple-50',
      prompt: 'A simple, cute cartoon-style fantasy illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The fantasy elements should be magical, whimsical, and fun to color.'
    },
    {
      id: 'IDSO',
      name: 'IDSO - Daily Life',
      icon: '🏠',
      description: 'Relatable everyday situations and activities',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      bgLight: 'bg-orange-50',
      prompt: 'A simple, cute cartoon-style everyday life illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be relatable, familiar, and fun to color.'
    },
    {
      id: 'IDI',
      name: 'IDI - General',
      icon: '🎨',
      description: 'General creative content',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      bgLight: 'bg-red-50',
      prompt: 'A simple, cute cartoon-style illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be creative and fun to color.'
    }
  ];

  // Regeneration Functions
  const openRegenerateModal = (video, type) => {
    setRegenerateConfig({ video, type, prompt: '' });
    setShowRegenerateModal(true);
  };

  const regenerateContent = async () => {
    const { video, type, prompt } = regenerateConfig;
    if (!video || !type) return;

    const regenerateId = `${video.uniqueId}-${type}`;
    setRegeneratingItems(prev => ({ ...prev, [regenerateId]: true }));
    setShowRegenerateModal(false);

    try {
      let updatedPrompt = video.selectedPrompt;
      if (prompt) {
        updatedPrompt = `${video.selectedPrompt}\n\nAdditional instructions: ${prompt}`;
      }

      const response = await fetch(N8N_WEBHOOK_PROCESS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedVideo: video,
          selectedType: video.selectedType,
          selectedPrompt: updatedPrompt,
          channelId: video.channelId,
          action: 'process_video',
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success) {
        setProcessedResults(prev => prev.map(v => {
          if (v.uniqueId === video.uniqueId) {
            return {
              ...v,
              result: result.data,
              lastRegenerated: new Date().toISOString()
            };
          }
          return v;
        }));
      }
    } catch (err) {
      console.error(`Failed to regenerate:`, err);
      setError(`Failed to regenerate: ${err.message}`);
    } finally {
      setRegeneratingItems(prev => ({ ...prev, [regenerateId]: false }));
    }
  };

  // Load Google APIs
  useEffect(() => {
    const loadGoogleAPI = () => {
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.onload = () => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          window.gapi.load('client', () => {
            window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            }).then(() => {
              setIsGapiLoaded(true);
            }).catch(error => {
              console.error('Google API initialization error:', error);
            });
          });
        };
        document.head.appendChild(gapiScript);
      };
      document.head.appendChild(gsiScript);
    };
    if (GOOGLE_API_KEY && GOOGLE_CLIENT_ID) {
      loadGoogleAPI();
    }
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

  // Extract Channel ID from URL
  const extractChannelId = (url) => {
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/channel/')) {
      return url.split('channel/')[1].split(/[?&/]/)[0];
    } else if (url.includes('youtube.com/c/')) {
      return url; // Will be handled by the webhook
    } else if (url.includes('youtube.com/@')) {
      return url; // Will be handled by the webhook
    } else if (url.includes('youtube.com/user/')) {
      return url; // Will be handled by the webhook
    } else if (url.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return url; // Direct channel ID
    }
    return url; // Let the webhook handle validation
  };

  // Channel Management Functions
  const addChannelInput = () => {
    setChannelUrls([...channelUrls, '']);
  };

  const removeChannelInput = (index) => {
    const newChannelUrls = channelUrls.filter((_, i) => i !== index);
    setChannelUrls(newChannelUrls.length > 0 ? newChannelUrls : ['']);
  };

  const updateChannelUrl = (index, value) => {
    const newChannelUrls = [...channelUrls];
    newChannelUrls[index] = value;
    setChannelUrls(newChannelUrls);
  };

  const validateChannelUrls = () => {
    const validUrls = channelUrls.filter(url => url.trim());
    const uniqueUrls = [...new Set(validUrls.map(url => url.trim()))];
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid YouTube Channel URL');
      return false;
    }
    
    if (uniqueUrls.length !== validUrls.length) {
      setError('Duplicate channel URLs detected. Please remove duplicates.');
      return false;
    }
    
    return uniqueUrls;
  };

  const fetchAllChannels = async () => {
    const uniqueUrls = validateChannelUrls();
    if (!uniqueUrls) return;

    setError('');
    const newChannelsData = {};

    for (const channelUrl of uniqueUrls) {
      const channelIdentifier = extractChannelId(channelUrl);
      setLoading(prev => ({ ...prev, [channelIdentifier]: true }));
      
      try {
        const response = await fetch(N8N_WEBHOOK_FETCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelUrl: channelUrl, action: 'fetch_videos' })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.success && data.videos && data.videos.length > 0) {
          newChannelsData[channelIdentifier] = {
            channelUrl,
            channelId: channelIdentifier,
            videos: data.videos.slice(0, 10),
            fetchedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error(`Failed to fetch channel ${channelUrl}:`, err);
        newChannelsData[channelIdentifier] = {
          channelUrl,
          channelId: channelIdentifier,
          error: err.message,
          videos: []
        };
      } finally {
        setLoading(prev => ({ ...prev, [channelIdentifier]: false }));
      }
    }

    setChannelsData(newChannelsData);
    if (Object.values(newChannelsData).some(channel => channel.videos?.length > 0)) {
      setStep('selection');
    }
  };

  // Video Selection Functions
  const handleVideoSelect = (video, channelId) => {
    setCurrentVideoForType({ ...video, channelId });
    setShowTypeModal(true);
  };

  const confirmVideoSelection = (selectedType) => {
    if (!currentVideoForType || !selectedType) return;

    const videoWithType = {
      ...currentVideoForType,
      selectedType: selectedType.id,
      selectedPrompt: selectedType.prompt,
      typeName: selectedType.name,
      typeIcon: selectedType.icon,
      uniqueId: `${currentVideoForType.channelId}-${currentVideoForType.id}-${Date.now()}`
    };

    setSelectedVideos(prev => [...prev, videoWithType]);
    setShowTypeModal(false);
    setCurrentVideoForType(null);
  };

  const removeSelectedVideo = (uniqueId) => {
    setSelectedVideos(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  const deleteProcessedVideo = (uniqueId) => {
    setProcessedResults(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  // Processing Functions
  const processAllVideos = async () => {
    if (selectedVideos.length === 0) {
      setError('Please select at least one video to process');
      return;
    }

    setStep('processing');
    setProcessingQueue([...selectedVideos]);
    setProcessedResults([]);

    for (const video of selectedVideos) {
      try {
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'processing' } : v
        ));

        const response = await fetch(N8N_WEBHOOK_PROCESS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedPrompt: video.selectedPrompt,
            channelId: video.channelId,
            action: 'process_video'
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.success) {
          const processedVideo = {
            ...video,
            result: result.data,
            status: 'completed',
            processedAt: new Date().toISOString()
          };
          
          setProcessedResults(prev => [...prev, processedVideo]);
          setProcessingQueue(prev => prev.map(v => 
            v.uniqueId === video.uniqueId ? { ...v, status: 'completed' } : v
          ));
        } else {
          throw new Error(result.message || 'Failed to process video');
        }
      } catch (err) {
        console.error(`Failed to process video ${video.title}:`, err);
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'error', error: err.message } : v
        ));
      }
    }

    setStep('results');
  };

  // Save to Drive Function - Enhanced for both images
  const saveToDrive = async (video) => {
    if (!video.result || !isGapiLoaded) return;

    try {
      const tokenResponse = await new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response) => {
            if (response.error) reject(response);
            else resolve(response);
          }
        });
        tokenClient.requestAccessToken();
      });

      if (!tokenResponse.access_token) throw new Error('No access token received');

      window.gapi.client.setToken({ access_token: tokenResponse.access_token });

      const videoTitle = video.title || 'Unknown Video';
      const folderName = `${new Date().toISOString().slice(0, 10)}_${video.selectedType}_${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50)}`;
      
      // Create main folder
      const folder = await window.gapi.client.drive.files.create({
        resource: { 
          name: folderName, 
          mimeType: 'application/vnd.google-apps.folder' 
        }
      });
      
      const folderId = folder.result.id;

      // Save script as Google Doc
      if (video.result?.generatedContent?.script?.content) {
        await window.gapi.client.drive.files.create({
          resource: {
            name: 'Script.txt',
            parents: [folderId],
            mimeType: 'text/plain'
          },
          media: {
            mimeType: 'text/plain',
            body: video.result.generatedContent.script.content
          }
        });
      }

      // Save both images
      const images = video.result?.generatedContent?.images;
      if (images) {
        // Save colored image
        if (images.colored?.url) {
          const coloredResponse = await fetch(images.colored.url);
          const coloredBlob = await coloredResponse.blob();
          
          await window.gapi.client.drive.files.create({
            resource: {
              name: 'Colored_Image.png',
              parents: [folderId]
            },
            media: {
              mimeType: 'image/png',
              body: coloredBlob
            }
          });
        }

        // Save black & white image
        if (images.blackWhite?.url) {
          const bwResponse = await fetch(images.blackWhite.url);
          const bwBlob = await bwResponse.blob();
          
          await window.gapi.client.drive.files.create({
            resource: {
              name: 'BlackWhite_ColoringPage.png',
              parents: [folderId]
            },
            media: {
              mimeType: 'image/png',
              body: bwBlob
            }
          });
        }
      }

      setProcessedResults(prev => prev.map(v => {
        if (v.uniqueId === video.uniqueId) {
          return { ...v, savedToDrive: true, driveFolder: folderId };
        }
        return v;
      }));

    } catch (error) {
      console.error('Error saving to Drive:', error);
      setError(`Failed to save to Drive: ${error.message}`);
    }
  };

  // Utility Functions
  const formatViewCount = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views?.toString() || '0';
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetAll = () => {
    setChannelUrls(['']);
    setChannelsData({});
    setSelectedVideos([]);
    setProcessingQueue([]);
    setProcessedResults([]);
    setError('');
    setStep('channels');
    setSelectedImageView({});
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              YouTube Content Generator Pro
            </h1>
            <p className="text-gray-600">
              Generate colored and B&W coloring pages with scripts from YouTube videos
            </p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center max-w-4xl w-full">
                {['Channels', 'Selection', 'Processing', 'Results'].map((label, index) => {
                  const stepKey = label.toLowerCase();
                  const isActive = step === stepKey;
                  const isPast = ['channels', 'selection', 'processing', 'results'].indexOf(step) > index;
                  
                  return (
                    <div key={label} className="flex items-center flex-1">
                      <div className="flex items-center justify-center w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                          ${isActive ? 'bg-blue-600 text-white scale-110' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {isPast ? <Check className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={`ml-2 font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-500'}`}>
                          {label}
                        </span>
                      </div>
                      {index < 3 && (
                        <div className={`flex-1 h-1 mx-4 rounded ${isPast ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 1: Channel Input */}
          {step === 'channels' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center">
                <Link2 className="w-6 h-6 mr-3 text-blue-600" />
                Enter YouTube Channel URLs
              </h2>
              
              <div className="space-y-4 mb-6 max-w-2xl mx-auto">
                {channelUrls.map((channelUrl, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={channelUrl}
                        onChange={(e) => updateChannelUrl(index, e.target.value)}
                        placeholder="e.g., https://youtube.com/@channelname or https://youtube.com/channel/UCxxxxxx"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        disabled={loading[extractChannelId(channelUrl)]}
                      />
                    </div>
                    {channelUrls.length > 1 && (
                      <button
                        onClick={() => removeChannelInput(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {loading[extractChannelId(channelUrl)] && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={addChannelInput}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Channel
                </button>
                
                <button
                  onClick={fetchAllChannels}
                  disabled={Object.values(loading).some(l => l)}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.values(loading).some(l => l) ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Fetching Videos...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Fetch All Channels
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Video Selection */}
          {step === 'selection' && (
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Select Videos to Process</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('channels')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={processAllVideos}
                      disabled={selectedVideos.length === 0}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Process {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>

                {/* Selected Videos Summary */}
                {selectedVideos.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Selected Videos:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideos.map((video) => (
                        <div key={video.uniqueId} className="bg-white rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm">
                          <span className="text-xl">{video.typeIcon}</span>
                          <span className="text-sm font-medium text-gray-700 max-w-xs truncate">{video.title}</span>
                          <button
                            onClick={() => removeSelectedVideo(video.uniqueId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Channel Videos */}
              {Object.entries(channelsData).map(([channelId, channelData]) => (
                <div key={channelId} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Channel: {channelData.channelUrl}
                    {channelData.error && (
                      <span className="ml-3 text-sm text-red-500">Error: {channelData.error}</span>
                    )}
                  </h3>
                  
                  {channelData.videos && channelData.videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {channelData.videos.map((video) => {
                        const isSelected = selectedVideos.some(v => v.id === video.id && v.channelId === channelId);
                        
                        return (
                          <div key={video.id} className={`border-2 rounded-lg p-4 transition-all hover:shadow-md
                            ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <div className="flex space-x-4">
                              <img
                                src={video.thumbnail || '/api/placeholder/120/90'}
                                alt={video.title}
                                className="w-32 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{video.title}</h4>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {formatViewCount(video.viewCount)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDuration(video.duration)}
                                  </span>
                                  <span className="text-blue-600 font-semibold">
                                    VPH: {video.vph}
                                  </span>
                                </div>
                                {!isSelected ? (
                                  <button
                                    onClick={() => handleVideoSelect(video, channelId)}
                                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Select Type
                                  </button>
                                ) : (
                                  <div className="flex items-center text-green-600 font-medium text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No videos found for this channel</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Type Selection Modal */}
          {showTypeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Select Content Type</h3>
                    <button
                      onClick={() => setShowTypeModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  {currentVideoForType && (
                    <p className="text-gray-600 mt-2">For: {currentVideoForType.title}</p>
                  )}
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => confirmVideoSelection(type)}
                      className={`p-4 border-2 rounded-xl hover:shadow-lg transition-all text-left ${type.borderColor} hover:${type.bgLight}`}
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{type.icon}</span>
                        <h4 className="font-semibold text-lg">{type.name}</h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                      <p className="text-xs text-gray-500 italic line-clamp-2">{type.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Processing Videos</h2>
              
              <div className="space-y-4 max-w-4xl mx-auto">
                {processingQueue.map((video) => (
                  <div key={video.uniqueId} className="border-2 rounded-lg p-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{video.typeIcon}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{video.title}</h4>
                          <p className="text-sm text-gray-600">Type: {video.typeName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {video.status === 'processing' && (
                          <>
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                            <span className="text-blue-600">Processing...</span>
                          </>
                        )}
                        {video.status === 'completed' && (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-green-600">Completed</span>
                          </>
                        )}
                        {video.status === 'error' && (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-red-600">Error</span>
                          </>
                        )}
                        {!video.status && (
                          <span className="text-gray-500">Waiting...</span>
                        )}
                      </div>
                    </div>
                    {video.error && (
                      <p className="text-sm text-red-600 mt-2">{video.error}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                {processingQueue.every(v => v.status === 'completed' || v.status === 'error') && (
                  <button
                    onClick={() => setStep('results')}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                  >
                    View Results →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 'results' && (
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Generated Content</h2>
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Start New Batch
                  </button>
                </div>
              </div>

              {processedResults.map((video, index) => {
                const isExpanded = expandedResults[video.uniqueId];
                const result = video.result;
                const currentImageView = selectedImageView[video.uniqueId] || 'colored';
                
                return (
                  <div key={video.uniqueId} className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
                    {/* Result Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl">{video.typeIcon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{video.title}</h3>
                            <p className="text-sm text-gray-600">
                              Channel: {video.channelId} • Type: {video.typeName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => deleteProcessedVideo(video.uniqueId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete this result"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setExpandedResults(prev => ({ ...prev, [video.uniqueId]: !prev[video.uniqueId] }))}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Result Content */}
                    {isExpanded && result && (
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Generated Images Section */}
                          {result.generatedContent?.images && (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <Image className="w-5 h-5 mr-2" />
                                  Generated Images
                                </h4>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setSelectedImageView(prev => ({ ...prev, [video.uniqueId]: 'colored' }))}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      currentImageView === 'colored' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    <Palette className="w-4 h-4 inline mr-1" />
                                    Colored
                                  </button>
                                  <button
                                    onClick={() => setSelectedImageView(prev => ({ ...prev, [video.uniqueId]: 'bw' }))}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      currentImageView === 'bw' 
                                        ? 'bg-gray-800 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    B&W
                                  </button>
                                </div>
                              </div>
                              
                              {/* Image Display */}
                              <div className="relative">
                                {currentImageView === 'colored' && result.generatedContent.images.colored?.url && (
                                  <div>
                                    <img
                                      src={result.generatedContent.images.colored.url}
                                      alt="Generated colored image"
                                      className="w-full rounded-lg border-2 border-gray-200 shadow-md"
                                    />
                                    <a
                                      href={result.generatedContent.images.colored.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={`colored_${video.title.replace(/[^a-z0-9]/gi, '_')}.png`}
                                      className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download Colored
                                    </a>
                                  </div>
                                )}
                                
                                {currentImageView === 'bw' && result.generatedContent.images.blackWhite?.url && (
                                  <div>
                                    <img
                                      src={result.generatedContent.images.blackWhite.url}
                                      alt="Generated black and white coloring page"
                                      className="w-full rounded-lg border-2 border-gray-200 shadow-md"
                                    />
                                    <a
                                      href={result.generatedContent.images.blackWhite.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={`coloring_page_${video.title.replace(/[^a-z0-9]/gi, '_')}.png`}
                                      className="mt-2 inline-flex items-center px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download B&W
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Both Images Preview */}
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <div 
                                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    currentImageView === 'colored' ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                                  }`}
                                  onClick={() => setSelectedImageView(prev => ({ ...prev, [video.uniqueId]: 'colored' }))}
                                >
                                  {result.generatedContent.images.colored?.url && (
                                    <img
                                      src={result.generatedContent.images.colored.url}
                                      alt="Colored thumbnail"
                                      className="w-full h-24 object-cover"
                                    />
                                  )}
                                  <p className="text-xs text-center py-1 bg-gray-50">Colored</p>
                                </div>
                                <div 
                                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    currentImageView === 'bw' ? 'border-gray-800 shadow-lg' : 'border-gray-200'
                                  }`}
                                  onClick={() => setSelectedImageView(prev => ({ ...prev, [video.uniqueId]: 'bw' }))}
                                >
                                  {result.generatedContent.images.blackWhite?.url && (
                                    <img
                                      src={result.generatedContent.images.blackWhite.url}
                                      alt="B&W thumbnail"
                                      className="w-full h-24 object-cover"
                                    />
                                  )}
                                  <p className="text-xs text-center py-1 bg-gray-50">B&W</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Generated Script */}
                          {result.generatedContent?.script?.content && (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <FileText className="w-5 h-5 mr-2" />
                                  Script ({result.generatedContent.script.wordCount || 'N/A'} words)
                                </h4>
                                <button
                                  onClick={() => openRegenerateModal(video, 'script')}
                                  disabled={regeneratingItems[`${video.uniqueId}-script`]}
                                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {regeneratingItems[`${video.uniqueId}-script`] ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                  )}
                                  Regenerate
                                </button>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                                  {result.generatedContent.script.content}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save to Drive Button */}
                        <div className="mt-6 pt-6 border-t flex justify-end">
                          {!video.savedToDrive ? (
                            <button
                              onClick={() => saveToDrive(video)}
                              disabled={!isGapiLoaded}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                              <Save className="w-5 h-5 mr-2" />
                              Save All to Google Drive
                            </button>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Saved to Drive</span>
                              {video.driveFolder && (
                                <a
                                  href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-3 flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Open Folder
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Batch Save Option */}
              {processedResults.length > 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Batch Operations</h3>
                      <p className="text-sm text-gray-600">Save all generated content to Google Drive</p>
                    </div>
                    <button
                      onClick={() => processedResults.forEach(video => !video.savedToDrive && saveToDrive(video))}
                      disabled={!isGapiLoaded || processedResults.every(v => v.savedToDrive)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save All to Drive
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Regenerate Modal */}
          {showRegenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Regenerate Content</h3>
                      <p className="text-blue-100 text-sm">
                        Regenerating for: {regenerateConfig.video?.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRegenerateModal(false)}
                      className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Additional Instructions (Optional)
                    </label>
                    <textarea
                      value={regenerateConfig.prompt}
                      onChange={(e) => setRegenerateConfig(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder={`Add specific instructions for regeneration...
                        Examples:
                        - Make it more colorful
                        - Add more details to the background
                        - Focus on specific elements
                        - Change the style or mood`
                      }
                      className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 text-blue-600" />
                      Current Settings
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Video:</span> {regenerateConfig.video?.typeName}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRegenerateModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={regenerateContent}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate {regenerateConfig.type}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeChannelProcessor;