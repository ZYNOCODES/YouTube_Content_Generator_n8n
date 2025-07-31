  import React, { useState, useEffect } from 'react';
  import { Play, Loader2, AlertCircle, Eye, Calendar, Clock, Image, FileText, CheckCircle, Palette, BookOpen, MapPin, Heart, Home, Save, ExternalLink, FolderOpen } from 'lucide-react';

  const YouTubeChannelProcessor = () => {
    const [selectedType, setSelectedType] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [channelId, setChannelId] = useState('');
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [finalResult, setFinalResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processingVideo, setProcessingVideo] = useState(false);
    const [processingStatus, setProcessingStatus] = useState({});
    const [error, setError] = useState('');
    const [step, setStep] = useState('type'); // 'type', 'channel', 'selection', 'processing', 'result'
    const [savingToDrive, setSavingToDrive] = useState(false);
    const [driveResult, setDriveResult] = useState(null);
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);

    const N8N_WEBHOOK_FETCH = import.meta.env.VITE_APP_N8N_WEBHOOK_FETCH;
    const N8N_WEBHOOK_PROCESS = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS;

    // Google Drive API configuration
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_DRIVE_CLIENT_ID;
    const GOOGLE_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;
    
    // Load Google APIs
    useEffect(() => {
      const loadGoogleAPI = () => {
        // Load Google Identity Services
        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.onload = () => {
          // Load Google API for Drive
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
                setError('Failed to initialize Google Drive. Please check your API configuration.');
              });
            });
          };
          gapiScript.onerror = () => {
            console.error('Failed to load Google API script');
            setError('Failed to load Google Drive API. Please check your internet connection.');
          };
          document.head.appendChild(gapiScript);
        };
        gsiScript.onerror = () => {
          console.error('Failed to load Google Identity Services script');
          setError('Failed to load Google Sign-in API. Please check your internet connection.');
        };
        document.head.appendChild(gsiScript);
      };
      loadGoogleAPI();
    }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

    // Save to Google Drive function
    const saveToDrive = async () => {
      if (!finalResult || !isGapiLoaded) return;
      setSavingToDrive(true);
      setError('');

      try {
        // Get access token using Google Identity Services
        const tokenResponse = await new Promise((resolve, reject) => {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
              if (response.error) {
                reject(response);
              } else {
                resolve(response);
              }
            }
          });
          tokenClient.requestAccessToken();
        });

        if (!tokenResponse.access_token) {
          throw new Error('No access token received from Google');
        }

        // Set the access token for gapi client
        window.gapi.client.setToken({
          access_token: tokenResponse.access_token
        });

        // Create folder name - Fix the data structure access
        const videoTitle = finalResult.data?.video?.title || finalResult.video?.title || 'Unknown Video';
        const folderName = `${new Date().toISOString().slice(0, 10)}_${selectedType}_${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)}`;
        
        // Create folder in Google Drive
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await window.gapi.client.drive.files.create({
          resource: folderMetadata
        });
        
        const folderId = folder.result.id;

        // Save image to Drive
        // Save image to Drive with improved error handling and CORS support
        let imageFileId = null;
        const imageUrl = finalResult.data?.generatedContent?.image?.url || finalResult.generatedContent?.image?.url;
        if (imageUrl) {
          try {
            console.log('Attempting to fetch image from:', imageUrl);
            
            // Try to fetch the image with proper headers and error handling
            const imageResponse = await fetch(imageUrl, {
              method: 'GET',
              mode: 'cors', // Explicitly set CORS mode
              headers: {
                'Accept': 'image/*',
                'User-Agent': 'Mozilla/5.0 (compatible; GoogleDriveUploader/1.0)'
              }
            });
            
            if (!imageResponse.ok) {
              console.error('Image fetch failed:', imageResponse.status, imageResponse.statusText);
              throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
            }
            
            // Check if the response is actually an image
            const contentType = imageResponse.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
              console.error('Response is not an image:', contentType);
              throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
            }
            
            const imageBlob = await imageResponse.blob();
            console.log('Image blob created:', imageBlob.size, 'bytes');
            
            // Ensure we have a valid blob
            if (imageBlob.size === 0) {
              throw new Error('Image blob is empty');
            }
            
            const imageMetadata = {
              name: `${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_coloring_page.png`,
              parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(imageMetadata)], {type: 'application/json'}));
            form.append('file', imageBlob);

            console.log('Uploading image to Google Drive...');
            const imageUpload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: new Headers({
                'Authorization': `Bearer ${tokenResponse.access_token}`
              }),
              body: form
            });

            if (!imageUpload.ok) {
              const errorText = await imageUpload.text();
              console.error('Drive upload failed:', imageUpload.status, errorText);
              throw new Error(`Failed to upload image to Drive: ${imageUpload.status} - ${errorText}`);
            }

            const imageResult = await imageUpload.json();
            imageFileId = imageResult.id;
            console.log('Image uploaded successfully:', imageFileId);
            
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
            
            // Add more specific error handling
            if (imageError.name === 'TypeError' && imageError.message.includes('Failed to fetch')) {
              console.error('This might be a CORS issue or the image URL is not accessible');
              setError(`Failed to fetch image: The image URL might not be accessible due to CORS restrictions or the server is blocking the request. Image URL: ${imageUrl}`);
            } else {
              console.error('Image upload error details:', {
                name: imageError.name,
                message: imageError.message,
                stack: imageError.stack
              });
            }
            // Continue with script upload even if image fails
          }
        }

        // Save script to Drive
        let scriptFileId = null;
        const scriptContent = finalResult.data?.generatedContent?.script?.content || finalResult.generatedContent?.script?.content;
        if (scriptContent) {
          try {
            const videoId = finalResult.data?.video?.id || finalResult.video?.id || 'Unknown ID';
            const videoType = finalResult.data?.video?.type || finalResult.video?.type || selectedType;
            
            const fullScriptContent = `Video Title: ${videoTitle}\nVideo ID: ${videoId}\nContent Type: ${videoType}\nGenerated: ${new Date().toISOString()}\n\n---SCRIPT---\n\n${scriptContent}`;
            
            const scriptBlob = new Blob([fullScriptContent], { type: 'text/plain' });
            
            const scriptMetadata = {
              name: `${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_script.txt`,
              parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(scriptMetadata)], {type: 'application/json'}));
            form.append('file', scriptBlob);

            const scriptUpload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: new Headers({
                'Authorization': `Bearer ${tokenResponse.access_token}` // Fixed: was authResponse.access_token
              }),
              body: form
            });

            if (!scriptUpload.ok) {
              throw new Error('Failed to upload script to Drive');
            }

            const scriptResult = await scriptUpload.json();
            scriptFileId = scriptResult.id;
          } catch (scriptError) {
            console.error('Error uploading script:', scriptError);
            // Continue even if script upload fails
          }
        }
        
        // Set drive result
        const driveInfo = {
          folderId: folderId,
          folderName: folderName,
          folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
          files: {
            image: imageFileId ? {
              id: imageFileId,
              name: `${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_coloring_page.png`,
              url: `https://drive.google.com/file/d/${imageFileId}/view`
            } : null,
            script: scriptFileId ? {
              id: scriptFileId,
              name: `${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_script.txt`,
              url: `https://drive.google.com/file/d/${scriptFileId}/view`
            } : null
          }
        };

        setDriveResult(driveInfo);
        
      } catch (error) {
        console.error('Error saving to Drive:', error);
        setError(`Failed to save to Google Drive: ${error.message}`);
      } finally {
        setSavingToDrive(false);
      }
    };

    const contentTypes = [
      {
        id: 'IDYT',
        name: 'IDYT',
        icon: null /*<BookOpen className="h-6 w-6" />*/,
        description: 'Learning-focused content with cartoon elements',
        color: 'bg-blue-500',
        prompt: 'generate only one image of A simple, cute cartoon-style illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The subject should be easily recognizable, appealing, and fun to color.'
      },
      {
        id: 'IDPP',
        name: 'IDPP',
        icon: null,
        description: 'Exciting adventure scenes and exploration',
        color: 'bg-green-500',
        prompt: 'A simple, cute cartoon-style adventure scene based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be exciting, adventurous, and fun to color.'
      },
      {
        id: 'IDMP',
        name: 'IDMP',
        icon: null,
        description: 'Cute animals and wildlife content',
        color: 'bg-pink-500',
        prompt: 'A simple, cute cartoon-style animal illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The animal should be adorable, child-friendly, and fun to color.'
      },
      {
        id: 'IDST',
        name: 'IDST',
        icon: null,
        description: 'Magical and whimsical fantasy elements',
        color: 'bg-purple-500',
        prompt: 'A simple, cute cartoon-style fantasy illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The fantasy elements should be magical, whimsical, and fun to color.'
      },
      {
        id: 'IDSO',
        name: 'IDSO',
        icon: null,
        description: 'Relatable everyday situations and activities',
        color: 'bg-orange-500',
        prompt: 'A simple, cute cartoon-style everyday life illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be relatable, familiar, and fun to color.'
      },
      {
        id: 'IDI',
        name: 'IDI',
        icon: null,
        description: 'Relatable everyday situations and activities',
        color: 'bg-red-500',
        prompt: 'A simple, cute cartoon-style everyday life illustration based on the input, drawn with clean black outlines. The image is designed as a coloring page for children, with no background or a plain white background. The scene should be relatable, familiar, and fun to color.'
      }
    ];

    const handleTypeSelection = (type) => {
      setSelectedType(type.id);
      setSelectedPrompt(type.prompt);
      setStep('channel');
      setError('');
    };

    const handleChannelSubmit = async (e) => {
      if (e) e.preventDefault();
      if (!channelId.trim()) {
        setError('Please enter a valid YouTube Channel ID');
        return;
      }

      setLoading(true);
      setError('');
      setVideos([]);

      try {
        const response = await fetch(N8N_WEBHOOK_FETCH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelId: channelId.trim(),
            action: 'fetch_videos'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          setStep('selection');
        } else {
          throw new Error(data.message || 'No videos found for this channel');
        }
      } catch (err) {
        setError(`Failed to fetch videos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const handleVideoSelection = async (video) => {
      setSelectedVideo(video);
      setProcessingVideo(true);
      setStep('processing');
      setError('');
      
      // Initialize processing status
      setProcessingStatus({
        imageGeneration: 'pending',
        scriptGeneration: 'pending',
        finalProcessing: 'pending'
      });

      // Simulate progress updates
      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, imageGeneration: 'processing' }));
      }, 500);

      setTimeout(() => {
        setProcessingStatus(prev => ({ ...prev, scriptGeneration: 'processing' }));
      }, 2000);

      try {
        const response = await fetch(N8N_WEBHOOK_PROCESS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: selectedType,
            selectedPrompt: selectedPrompt,
            channelId: channelId,
            action: 'process_video'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setProcessingStatus({
            imageGeneration: 'completed',
            scriptGeneration: 'completed',
            finalProcessing: 'completed'
          });
          
          setTimeout(() => {
            setFinalResult(result.data);
            setStep('result');
          }, 1000);
        } else {
          throw new Error(result.message || 'Failed to process video');
        }
      } catch (err) {
        setError(`Failed to process video: ${err.message}`);
        setProcessingStatus({
          imageGeneration: 'error',
          scriptGeneration: 'error',
          finalProcessing: 'error'
        });
      } finally {
        setProcessingVideo(false);
      }
    };

    const formatViewCount = (views) => {
      if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
      } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
      }
      return views?.toString() || '0';
    };

    const formatDuration = (duration) => {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const resetToStart = () => {
      setSelectedType('');
      setSelectedPrompt('');
      setChannelId('');
      setVideos([]);
      setSelectedVideo(null);
      setFinalResult(null);
      setError('');
      setProcessingStatus({});
      setSavingToDrive(false);
      setDriveResult(null);
      setStep('type');
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'processing':
          return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
        case 'error':
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
          return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            YouTube Content Generator
          </h1>
          <p className="text-gray-600">
            Create children's content from YouTube videos with AI-generated images and scripts
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center space-x-2 ${step === 'type' ? 'text-blue-600' : step !== 'type' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'type' ? 'bg-blue-100 border-2 border-blue-600' : step !== 'type' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-semibold">1</span>
              </div>
              <span className="text-sm font-medium">Select Type</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'channel' ? 'text-blue-600' : ['selection', 'processing', 'result'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'channel' ? 'bg-blue-100 border-2 border-blue-600' : ['selection', 'processing', 'result'].includes(step) ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-semibold">2</span>
              </div>
              <span className="text-sm font-medium">Channel Discovery</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'selection' ? 'text-blue-600' : ['processing', 'result'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'selection' ? 'bg-blue-100 border-2 border-blue-600' : ['processing', 'result'].includes(step) ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className="text-sm font-medium">Video Selection</span>
            </div>
            <div className={`flex items-center space-x-2 ${['processing', 'result'].includes(step) ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['processing', 'result'].includes(step) ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-semibold">4</span>
              </div>
              <span className="text-sm font-medium">Content Generation</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ 
                width: step === 'type' ? '25%' : step === 'channel' ? '50%' : step === 'selection' ? '75%' : '100%' 
              }}
            ></div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Type Selection */}
        {step === 'type' && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-6">Step 1: Choose Content Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelection(type)}
                  className={`cursor-pointer border-2 rounded-lg p-6 transition-all hover:shadow-md ${
                    selectedType === type.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-lg ${type.color} text-white mr-3`}>
                      {type.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                  <p className="text-xs text-gray-500 italic">{type.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Channel ID Input */}
        {step === 'channel' && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Step 2: Enter YouTube Channel ID</h2>
              <button
                onClick={resetToStart}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Change Type
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Selected Type: <span className="font-semibold">{contentTypes.find(t => t.id === selectedType)?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Channel ID
                </label>
                <input
                  type="text"
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="e.g., UCBJycsmduvYEL83R_U4JriQ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && channelId.trim() && !loading) {
                      handleChannelSubmit(e);
                    }
                  }}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the YouTube channel ID (not the channel name or URL)
                </p>
              </div>
              <button
                onClick={handleChannelSubmit}
                disabled={loading || !channelId.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Fetching Latest Videos...
                  </>
                ) : (
                  'Fetch Latest 10 Videos'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Video Selection */}
        {step === 'selection' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Step 3: Select a Video to Process</h2>
              <button
                onClick={() => setStep('channel')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Channel Input
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                Found {videos.length} recent videos from this channel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video, index) => (
                <div
                  key={video.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail || '/api/placeholder/120/90'}
                        alt={video.title}
                        className="w-30 h-20 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {formatViewCount(video.viewCount)} views
                        </div>
                        {video.duration && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(video.duration)}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 mb-2">
                        VPH: {video.vph} • Likes: {formatViewCount(video.likeCount)}
                      </div>
                      <button
                        onClick={() => handleVideoSelection(video)}
                        disabled={processingVideo}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Select & Process
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Processing Status */}
        {step === 'processing' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Step 4: Processing Content</h2>
            </div>
            
            {selectedVideo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Processing Video:</h3>
                <p className="text-blue-800">{selectedVideo.title}</p>
                <p className="text-sm text-blue-600 mt-1">Type: {contentTypes.find(t => t.id === selectedType)?.name}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(processingStatus.imageGeneration)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Generating Image</h4>
                    <p className="text-sm text-gray-600">Creating custom coloring page illustration</p>
                  </div>
                  <Image className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(processingStatus.scriptGeneration)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Generating Script</h4>
                    <p className="text-sm text-gray-600">Creating 700-word children's script</p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(processingStatus.finalProcessing)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Final Processing</h4>
                    <p className="text-sm text-gray-600">Combining results and formatting output</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results Display */}
        {step === 'result' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Content Generation Complete!</h2>
              <button
                onClick={resetToStart}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Start Over
              </button>
            </div>
            
            {selectedVideo && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Processed Video:</h3>
                <p className="text-green-800">{selectedVideo.title}</p>
                <p className="text-sm text-green-600 mt-1">Type: {contentTypes.find(t => t.id === selectedType)?.name}</p>
              </div>
            )}

            {finalResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generated Image */}
                {(finalResult.data?.generatedContent?.image?.url || finalResult.generatedContent?.image?.url) && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Image className="h-5 w-5 mr-2" />
                      Generated Image
                    </h3>
                    <img
                      src={finalResult.data?.generatedContent?.image?.url || finalResult.generatedContent?.image?.url}
                      alt="Generated coloring page"
                      className="w-full rounded-lg border border-gray-200 mb-4"
                    />
                    <p className="text-sm text-gray-600">
                      Custom coloring page based on "{finalResult.data?.video?.title || finalResult.video?.title || 'Unknown Video'}"
                    </p>
                  </div>
                )}

                {/* Generated Script */}
                {(finalResult.data?.generatedContent?.script?.content || finalResult.generatedContent?.script?.content) && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Generated Script ({finalResult.data?.generatedContent?.script?.wordCount || finalResult.generatedContent?.script?.wordCount || 'N/A'} words)
                    </h3>
                    <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded border text-sm">
                      <pre className="whitespace-pre-wrap font-sans">
                        {finalResult.data?.generatedContent?.script?.content || finalResult.generatedContent?.script?.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save to Drive Section */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Save to Google Drive</h3>
                {!driveResult && (
                  <button
                    onClick={saveToDrive}
                    disabled={savingToDrive || !isGapiLoaded || !GOOGLE_API_KEY || !GOOGLE_CLIENT_ID}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingToDrive ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Saving to Drive...
                      </>
                    ) : !GOOGLE_API_KEY || !GOOGLE_CLIENT_ID ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        API Keys Missing
                      </>
                    ) : !isGapiLoaded ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Loading Google API...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to Drive
                      </>
                    )}
                  </button>
                )}
              </div>

              {!driveResult && !savingToDrive && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Click "Save to Drive" to store your generated content (image and script) in a new Google Drive folder. 
                    You'll be prompted to sign in to Google if needed.
                  </p>
                </div>
              )}

              {driveResult && (
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <h4 className="font-medium text-green-900">Successfully saved to Google Drive!</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <a 
                      href={driveResult.folderUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Open Drive Folder: {driveResult.folderName}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                    
                    {driveResult.files.image && (
                      <a 
                        href={driveResult.files.image.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 ml-4"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        View Coloring Page
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    
                    {driveResult.files.script && (
                      <a 
                        href={driveResult.files.script.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 ml-4"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Script
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default YouTubeChannelProcessor;