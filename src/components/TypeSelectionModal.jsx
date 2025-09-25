import { X, Loader2, FileText } from 'lucide-react';
import { useState } from 'react';

const TypeSelectionModal = ({
  showTypeModal, setShowTypeModal,
  currentVideoForType, setCurrentVideoForType,
  selectedVideos, setSelectedVideos,
  contentTypes,
  setError
}) => {
  const [mainTopic, setMainTopic] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState('');

  if (!showTypeModal) return null;

  // Types that require transcripts
  const typesNeedingTranscript = ['LDST', 'LDYT', 'LDBM', 'LDPP'];
  const typesNeedingMainTopic = ['LDL', 'LDST', 'LDSO'];

  const fetchTranscriptFromSupadata = async (videoUrl, videoId) => {
    try {
      setTranscriptProgress('Connecting to Supadata Transcript API...');
      
      const SUPADATA_API_KEY = import.meta.env.VITE_APP_SUPADATA_API_KEY;
      
      if (!SUPADATA_API_KEY) {
        throw new Error('Supadata API key not configured');
      }

      // Construct the API request
      const apiUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-api-key': SUPADATA_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supadata API error (${response.status}): ${errorText}`);
      }

      setTranscriptProgress('Processing video transcript...');
      
      const data = await response.json();
      console.log('Supadata Transcript response:', data);
      
      // Handle Supadata response format
      if (data && data.content && Array.isArray(data.content)) {
        // Extract text from content array and filter out non-speech elements
        const textSegments = data.content
          .filter(segment => segment.text && !segment.text.match(/^\[.*\]$/)) // Filter out [Music], [Applause], etc.
          .map(segment => segment.text.trim())
          .filter(text => text.length > 0);
        
        const transcript = textSegments.join(' ');
        const wordCount = transcript.split(' ').filter(word => word.length > 0).length;
        
        if (transcript.length === 0) {
          throw new Error('No speech content found in transcript (only music/sound effects detected)');
        }
        console.log('Extracted Transcript:', transcript);
        
        setTranscriptProgress(`Transcript processed: ${textSegments.length} speech segments, ${wordCount} words`);
        return {
          transcript: transcript,
          wordCount: wordCount,
          segments: data.content, // Keep original segments for reference
          totalSegments: data.content.length,
          speechSegments: textSegments.length,
          duration: data.content[data.content.length - 1]?.offset + data.content[data.content.length - 1]?.duration || null,
          language: data.lang || data.availableLangs?.[0] || 'en',
          availableLanguages: data.availableLangs || ['en']
        };
      } else {
        throw new Error('No content found in Supadata response');
      }
    } catch (error) {
      console.error('Supadata Transcript fetch error:', error);
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  };

  const confirmVideoSelection = async () => {
    if (!currentVideoForType || !selectedType) return;

    try {
      let transcript = '';
      let transcriptData = null;
      let updatedScriptPrompt = selectedType.scriptPrompt;

      // Check if this type needs a transcript
      if (typesNeedingTranscript.includes(selectedType.id)) {
        setFetchingTranscript(true);
        setTranscriptProgress('Preparing to fetch transcript...');

        try {
          // Construct YouTube URL from video data
          const videoUrl = `https://www.youtube.com/watch?v=${currentVideoForType.id}`;
          
          // Fetch transcript from Supadata API
          transcriptData = await fetchTranscriptFromSupadata(videoUrl, currentVideoForType.id);
          
          if (transcriptData && transcriptData.transcript) {
            // Add transcript to the script prompt
            updatedScriptPrompt = `${selectedType.scriptPrompt}\n\nVIDEO TRANSCRIPT:\n${transcriptData.transcript}`;
            setTranscriptProgress(`Transcript integrated successfully! (${transcriptData.speechSegments}/${transcriptData.totalSegments} segments, ${transcriptData.wordCount} words)`);
            
            // Add transcript metadata to video
            transcript = transcriptData.transcript;
          }
        } catch (transcriptError) {
          console.error('Transcript fetch failed:', transcriptError);
          setError(`Transcript fetch failed: ${transcriptError.message}. Proceeding without transcript.`);
          // Continue without transcript rather than blocking the process
        }
      }

      // Replace {MAIN_TOPIC} placeholder for specific content types
      if (typesNeedingMainTopic.includes(selectedType.id)) {   
        updatedScriptPrompt = updatedScriptPrompt.replace(
          /{MAIN_TOPIC}/g, 
          mainTopic.trim() || '[Not specified]'
        );
      }
      
      const videoWithType = {
        ...currentVideoForType,
        selectedType: selectedType.id,
        selectedPrompt: selectedType.imagePrompt,
        selectedScriptPrompt: updatedScriptPrompt,
        typeName: selectedType.name,
        typeIcon: selectedType.icon,
        mainTopic: mainTopic.trim(),
        uniqueId: `${currentVideoForType.channelId}-${currentVideoForType.id}-${Date.now()}`,
        hasTranscript: !!transcript,
        transcriptLength: transcript ? transcript.length : 0,
        transcriptWordCount: transcriptData?.wordCount || 0,
        transcriptLanguage: transcriptData?.language || null,
        transcriptSegments: transcriptData?.speechSegments || 0,
        totalTranscriptSegments: transcriptData?.totalSegments || 0,
        transcriptDuration: transcriptData?.duration || null
      };

      setSelectedVideos(prev => [...prev, videoWithType]);
      handleClose();
    } catch (error) {
      console.error('Video selection error:', error);
      setError(`Failed to process video selection: ${error.message}`);
    } finally {
      setFetchingTranscript(false);
      setTranscriptProgress('');
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleClose = () => {
    setShowTypeModal(false);
    setCurrentVideoForType(null);
    setMainTopic('');
    setSelectedType(null);
    setFetchingTranscript(false);
    setTranscriptProgress('');
  };

  const needsTranscript = selectedType && typesNeedingTranscript.includes(selectedType.id);
  const needsMainTopic = selectedType && typesNeedingMainTopic.includes(selectedType.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Select Content Type</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={fetchingTranscript}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {currentVideoForType && (
            <p className="text-gray-600 mt-2">For: {currentVideoForType.title}</p>
          )}
        </div>
        
        <div className="p-6">
          {/* Transcript Fetching Progress */}
          {fetchingTranscript && (
            <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-blue-800 mb-1">Fetching Video Transcript</h4>
                  <p className="text-blue-600 text-sm">{transcriptProgress}</p>
                </div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="flex items-center text-blue-700 text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Using Supadata API to extract transcript from: {currentVideoForType?.title}</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-blue-700 text-sm font-medium">This may take a few moments...</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Topic Input Field */}
          {!fetchingTranscript && (
            <>
              {needsMainTopic && 
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Main Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={mainTopic}
                    onChange={(e) => setMainTopic(e.target.value)}
                    placeholder="Enter the main topic for this video content (e.g., 'Dinosaurs', 'Ocean Animals', 'Space Adventure')..."
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This will be used to customize the script content. Leave empty if not needed.
                  </p>
                </div>
              }

              {/* Content Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className={`p-4 border-2 rounded-xl hover:shadow-lg transition-all text-left relative ${
                      selectedType?.id === type.id 
                        ? `${type.borderColor} ${type.bgLight} ring-2 ring-blue-400` 
                        : `${type.borderColor} hover:${type.bgLight}`
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <h4 className="font-semibold text-lg">{type.name}</h4>
                      {selectedType?.id === type.id && (
                        <div className="ml-auto">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Transcript indicator */}
                    {typesNeedingTranscript.includes(type.id) && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <FileText className="w-3 h-3 mr-1" />
                          Transcript
                        </div>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                    <p className="text-xs text-gray-500 italic line-clamp-2">
                      {type.imagePrompt?.substring(0, 100)}...
                    </p>
                  </button>
                ))}
              </div>

              {/* Transcript Info */}
              {needsTranscript && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="font-semibold text-orange-800">Transcript Required</h4>
                  </div>
                  <p className="text-orange-700 text-sm mb-2">
                    This content type requires a video transcript to generate accurate content. 
                    We'll automatically fetch the transcript when you confirm.
                  </p>
                  <div className="bg-orange-100 rounded-lg p-3 text-orange-600 text-xs">
                    <strong>Note:</strong> The transcript will be integrated into the script prompt to provide 
                    context-aware content generation based on the actual video content.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  disabled={fetchingTranscript}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVideoSelection}
                  disabled={!selectedType || fetchingTranscript}
                  className={`px-6 py-3 text-white rounded-xl transition-all font-medium flex items-center ${
                    selectedType && !fetchingTranscript
                      ? needsTranscript 
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {fetchingTranscript ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {needsTranscript && <FileText className="w-4 h-4 mr-2" />}
                      {needsTranscript ? 'Fetch Transcript & Confirm' : 'Confirm Selection'}
                    </>
                  )}
                </button>
              </div>

              {/* Preview Section */}
              {selectedType && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-2">Selection Preview:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Type:</span> {selectedType.name}</p>
                    <p><span className="font-medium">Main Topic:</span> {mainTopic.trim() || '[Not specified]'}</p>
                    {needsTranscript && (
                      <p><span className="font-medium">Transcript:</span> Will be fetched from Supadata</p>
                    )}
                    {mainTopic.trim() && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ The script will be customized with this main topic
                      </p>
                    )}
                    {needsTranscript && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠ Transcript will be automatically fetched and integrated into the script prompt
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeSelectionModal;