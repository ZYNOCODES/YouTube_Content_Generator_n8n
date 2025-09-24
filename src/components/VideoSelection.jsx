import { Play, Eye, Clock, CheckCircle, Plus, X, Video, Link2 } from 'lucide-react';

const VideoSelection = ({
  channelsData,
  selectedVideos, setSelectedVideos,
  setStep,
  setCurrentVideoForType,
  setShowTypeModal,
  setError,
  N8N_WEBHOOK_PROCESS_VIDEO,
  N8N_WEBHOOK_PROCESS_SCRIPT,
  setProcessingQueue,
  setProcessedResults,
  contentTypes
}) => {
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

  // Video Selection Functions
  const handleVideoSelect = (video, channelId) => {
    setCurrentVideoForType({ ...video, channelId });
    setShowTypeModal(true);
  };

  const removeSelectedVideo = (uniqueId) => {
    setSelectedVideos(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  // Processing Function
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

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

        // Step 1: Process images using N8N_WEBHOOK_PROCESS_VIDEO
        const imageResponse = await fetch(N8N_WEBHOOK_PROCESS_VIDEO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedPrompt: video.selectedPrompt,
          }),
          signal: controller.signal
        });

        if (!imageResponse.ok) throw new Error(`Image processing failed! status: ${imageResponse.status}`);
        
        const imageResult = await imageResponse.json();

        // Step 2: Process script using N8N_WEBHOOK_PROCESS_SCRIPT
        const scriptResponse = await fetch(N8N_WEBHOOK_PROCESS_SCRIPT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedScriptPrompt: video.selectedScriptPrompt
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!scriptResponse.ok) throw new Error(`Script processing failed! status: ${scriptResponse.status}`);
        
        const scriptResult = await scriptResponse.json();

        // Combine both results
        if (imageResult.success && scriptResult.success && imageResult.data && scriptResult.data) {
          const processedVideo = {
            ...video,
            result: {
              generatedContent: {
                images: imageResult.data.generatedContent?.images || null,
                script: scriptResult.data.generatedContent?.script || null
              },
              processingInfo: {
                ...imageResult.data.processingInfo,
                scriptProcessing: scriptResult.data.processingInfo
              },
              video: imageResult.data.video || {
                title: video.title,
                id: video.id,
                type: video.selectedType
              }
            },
            status: 'completed',
            processedAt: new Date().toISOString()
          };
                    
          setProcessedResults(prev => [...prev, processedVideo]);
          setProcessingQueue(prev => prev.map(v => 
            v.uniqueId === video.uniqueId ? { ...v, status: 'completed' } : v
          ));
        } else {
          throw new Error('Failed to process video - invalid response structure from one or both services');
        }
      } catch (err) {
        console.error(`Failed to process video ${video.title}:`, err);
        
        let errorMessage = err.message;
        if (err.name === 'AbortError') {
          errorMessage = 'Processing timeout (10 minutes) - the workflow may still be running in the background';
        }
        
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'error', error: errorMessage } : v
        ));
        
        // Add to processed results even with error for visibility
        setProcessedResults(prev => [...prev, {
          ...video,
          status: 'error',
          error: errorMessage,
          processedAt: new Date().toISOString()
        }]);
      }
    }

    setStep('results');
  };

  // Separate channel and direct video data
  const channelData = Object.entries(channelsData).filter(([_, data]) => data.type !== 'direct_video');
  const directVideoData = Object.entries(channelsData).filter(([_, data]) => data.type === 'direct_video');

  return (
    <div>
      {/* Header Section */}
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

      {/* Direct Videos Section */}
      {directVideoData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-lg p-2 mr-3">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Direct Videos</h3>
              <p className="text-gray-600 text-sm">Videos added with direct URLs</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {directVideoData.map(([channelId, channelData]) => {
              if (channelData.videos && channelData.videos.length > 0) {
                return channelData.videos.map((video) => {
                  const isSelected = selectedVideos.some(v => v.id === video.id && v.channelId === channelId);
                  
                  return (
                    <div 
                      key={`${channelId}-${video.id}`} 
                      className={`border-2 rounded-lg p-4 transition-all hover:shadow-md
                        ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                    >
                      <div className="flex space-x-4">
                        <img
                          src={video.thumbnail || '/api/placeholder/120/90'}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2" title={video.title}>
                            {video.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {formatViewCount(video.viewCount)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDuration(video.duration)}
                            </span>
                            <span className="text-purple-600 font-semibold bg-purple-100 px-2 py-1 rounded-full">
                              VPH: {video.vph}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            Channel: {video.channelTitle}
                          </p>
                          {!isSelected ? (
                            <button
                              onClick={() => handleVideoSelect(video, channelId)}
                              className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Select Type
                            </button>
                          ) : (
                            <div className="flex items-center text-purple-600 font-medium text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              } else if (channelData.error) {
                return (
                  <div key={channelId} className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium">Error loading video:</p>
                    <p className="text-red-600 text-sm">{channelData.originalUrl}</p>
                    <p className="text-red-500 text-xs mt-1">{channelData.error}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Channel Videos Section */}
      {channelData.length > 0 && channelData.map(([channelId, channelData]) => (
        <div key={channelId} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <Link2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Channel: {channelData.channelUrl}
              </h3>
              {channelData.error && (
                <p className="text-red-500 text-sm">Error: {channelData.error}</p>
              )}
              {channelData.videos && channelData.videos.length > 0 && (
                <p className="text-gray-600 text-sm">
                  {channelData.videos.length} videos found
                </p>
              )}
            </div>
          </div>
          
          {channelData.videos && channelData.videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channelData.videos.map((video) => {
                const isSelected = selectedVideos.some(v => v.id === video.id && v.channelId === channelId);
                
                return (
                  <div 
                    key={video.id} 
                    className={`border-2 rounded-lg p-4 transition-all hover:shadow-md
                      ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex space-x-4">
                      <img
                        src={video.thumbnail || '/api/placeholder/120/90'}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2" title={video.title}>
                          {video.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatViewCount(video.viewCount)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(video.duration)}
                          </span>
                          {video.vph && (
                            <span className="text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                              VPH: {video.vph}
                            </span>
                          )}
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
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No videos found for this channel</p>
              {channelData.error && (
                <p className="text-red-500 text-sm mt-2">
                  Error details: {channelData.error}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Empty State */}
      {Object.keys(channelsData).length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No channels or videos loaded yet</p>
          <p className="text-gray-400 text-sm mt-2">Go back to add channel URLs or direct video links</p>
        </div>
      )}
    </div>
  );
};

export default VideoSelection;  