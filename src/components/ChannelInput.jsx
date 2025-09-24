import { Loader2, Link2, Plus, Trash2, Search, Video, Youtube } from 'lucide-react';
import { useState } from 'react';

const ChannelInput = ({
  channelUrls, setChannelUrls,
  setChannelsData,
  loading, setLoading,
  setError, setStep,
  N8N_WEBHOOK_FETCH
}) => {
  const [directVideoUrls, setDirectVideoUrls] = useState(['']);
  const [inputMode, setInputMode] = useState('channels'); // 'channels' or 'videos'

  // Extract Channel ID from URL
  const extractChannelId = (url) => {
    if (url.includes('youtube.com/channel/')) {
      return url.split('channel/')[1].split(/[?&/]/)[0];
    } else if (url.includes('youtube.com/c/')) {
      return url;
    } else if (url.includes('youtube.com/@')) {
      return url;
    } else if (url.includes('youtube.com/user/')) {
      return url;
    } else if (url.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return url;
    }
    return url;
  };

  // Extract Video ID from YouTube URL
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Calculate VPH for a video
  const calculateVPH = (views, publishedAt) => {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const hoursSince = Math.max(1, (now - publishedDate) / (1000 * 60 * 60));
    return parseFloat((views / hoursSince).toFixed(2));
  };

  // Fetch video details from YouTube API
  const fetchVideoDetails = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=AIzaSyBQb8tbihJmrCfTb203WYsM9WpSB4dd7CY`
      );
      
      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
      
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found or is private');
      }

      const video = data.items[0];
      const statistics = video.statistics || {};
      const snippet = video.snippet || {};
      const contentDetails = video.contentDetails || {};
      
      const views = parseInt(statistics.viewCount || '0', 10);
      const likes = parseInt(statistics.likeCount || '0', 10);
      const comments = parseInt(statistics.commentCount || '0', 10);
      
      // Parse duration
      const duration = contentDetails.duration || 'PT0S';
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      const vph = calculateVPH(views, snippet.publishedAt);
      
      return {
        id: video.id,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        publishedAt: snippet.publishedAt,
        duration: totalSeconds,
        vph: vph,
        description: snippet.description || '',
        channelTitle: snippet.channelTitle || 'Unknown Channel'
      };
    } catch (error) {
      throw new Error(`Failed to fetch video details: ${error.message}`);
    }
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

  // Direct Video Management Functions
  const addVideoInput = () => {
    setDirectVideoUrls([...directVideoUrls, '']);
  };

  const removeVideoInput = (index) => {
    const newVideoUrls = directVideoUrls.filter((_, i) => i !== index);
    setDirectVideoUrls(newVideoUrls.length > 0 ? newVideoUrls : ['']);
  };

  const updateVideoUrl = (index, value) => {
    const newVideoUrls = [...directVideoUrls];
    newVideoUrls[index] = value;
    setDirectVideoUrls(newVideoUrls);
  };

  // Validation Functions
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

  const validateVideoUrls = () => {
    const validUrls = directVideoUrls.filter(url => url.trim());
    const videoIds = validUrls.map(url => extractVideoId(url.trim())).filter(id => id);
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid YouTube video URL');
      return false;
    }
    
    if (videoIds.length !== validUrls.length) {
      setError('Some video URLs are invalid. Please check the format.');
      return false;
    }
    
    const uniqueIds = [...new Set(videoIds)];
    if (uniqueIds.length !== videoIds.length) {
      setError('Duplicate video URLs detected. Please remove duplicates.');
      return false;
    }
    
    return videoIds;
  };

  // Fetch Functions
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
          body: JSON.stringify({ channelUrl: channelUrl })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.success && data.videos && data.videos.length > 0) {
          newChannelsData[channelIdentifier] = {
            channelUrl,
            channelId: channelIdentifier,
            videos: data.videos,
            fetchedAt: new Date().toISOString(),
            type: 'channel'
          };
        }
      } catch (err) {
        console.error(`Failed to fetch channel ${channelUrl}:`, err);
        newChannelsData[channelIdentifier] = {
          channelUrl,
          channelId: channelIdentifier,
          error: err.message,
          videos: [],
          type: 'channel'
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

  const fetchDirectVideos = async () => {
    const videoIds = validateVideoUrls();
    if (!videoIds) return;

    setError('');
    const newChannelsData = {};

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      setLoading(prev => ({ ...prev, [`direct_${videoId}`]: true }));
      
      try {
        const videoData = await fetchVideoDetails(videoId);
        
        // Create a unique channel identifier for direct videos
        const channelIdentifier = `direct_videos_${Date.now()}_${i}`;
        
        newChannelsData[channelIdentifier] = {
          channelUrl: `Direct Video: ${videoData.title}`,
          channelId: channelIdentifier,
          videos: [videoData],
          fetchedAt: new Date().toISOString(),
          type: 'direct_video',
          originalUrl: directVideoUrls[i]
        };
      } catch (err) {
        console.error(`Failed to fetch video ${videoId}:`, err);
        const channelIdentifier = `direct_videos_error_${Date.now()}_${i}`;
        newChannelsData[channelIdentifier] = {
          channelUrl: `Direct Video Error: ${directVideoUrls[i]}`,
          channelId: channelIdentifier,
          error: err.message,
          videos: [],
          type: 'direct_video',
          originalUrl: directVideoUrls[i]
        };
      } finally {
        setLoading(prev => ({ ...prev, [`direct_${videoId}`]: false }));
      }
    }

    setChannelsData(newChannelsData);
    if (Object.values(newChannelsData).some(channel => channel.videos?.length > 0)) {
      setStep('selection');
    }
  };

  const fetchAll = async () => {
    if (inputMode === 'channels') {
      await fetchAllChannels();
    } else {
      await fetchDirectVideos();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Mode Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-100 rounded-2xl p-1 flex">
            <button
              onClick={() => setInputMode('channels')}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                inputMode === 'channels'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Link2 className="w-5 h-5 mr-2" />
              Channel URLs
            </button>
            <button
              onClick={() => setInputMode('videos')}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                inputMode === 'videos'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Video className="w-5 h-5 mr-2" />
              Direct Videos
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
            {inputMode === 'channels' ? (
              <>
                <Link2 className="w-6 h-6 mr-3 text-blue-600" />
                Enter YouTube Channel URLs
              </>
            ) : (
              <>
                <Video className="w-6 h-6 mr-3 text-purple-600" />
                Enter Direct Video URLs
              </>
            )}
          </h2>
          <p className="text-gray-600 text-sm">
            {inputMode === 'channels' 
              ? 'Fetch recent videos from YouTube channels'
              : 'Add specific YouTube videos and calculate their VPH'
            }
          </p>
        </div>
      </div>
      
      <div className="space-y-4 mb-6 max-w-2xl mx-auto">
        {inputMode === 'channels' ? (
          // Channel URL Inputs
          channelUrls.map((channelUrl, index) => (
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
          ))
        ) : (
          // Direct Video URL Inputs
          directVideoUrls.map((videoUrl, index) => {
            const videoId = extractVideoId(videoUrl);
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => updateVideoUrl(index, e.target.value)}
                    placeholder="e.g., https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    disabled={loading[`direct_${videoId}`]}
                  />
                </div>
                {directVideoUrls.length > 1 && (
                  <button
                    onClick={() => removeVideoInput(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {loading[`direct_${videoId}`] && (
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={inputMode === 'channels' ? addChannelInput : addVideoInput}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {inputMode === 'channels' ? 'Add Channel' : 'Add Video'}
        </button>
        
        <button
          onClick={fetchAll}
          disabled={Object.values(loading).some(l => l)}
          className={`flex items-center px-6 py-2 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            inputMode === 'channels'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {Object.values(loading).some(l => l) ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {inputMode === 'channels' ? 'Fetching Videos...' : 'Fetching Details...'}
            </>
          ) : (
            <>
              {inputMode === 'channels' ? <Search className="w-5 h-5 mr-2" /> : <Youtube className="w-5 h-5 mr-2" />}
              {inputMode === 'channels' ? 'Fetch All Channels' : 'Fetch Video Details'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChannelInput;