import { X, Image, FileText } from 'lucide-react';

const RegenerateModal = ({
  showRegenerateModal, setShowRegenerateModal,
  regenerateConfig, setRegenerateConfig,
  setRegeneratingItems,
  setProcessedResults,
  setError,
  contentTypes,
  N8N_WEBHOOK_PROCESS_VIDEO,
  N8N_WEBHOOK_PROCESS_SCRIPT
}) => {
  if (!showRegenerateModal) return null;

  const regenerateContent = async () => {
    const { video, additionalInstructions, type } = regenerateConfig;
    if (!video) return;

    const regenerateId = `${video.uniqueId}_${type}`;
    setRegeneratingItems(prev => ({ ...prev, [regenerateId]: true }));
    setShowRegenerateModal(false);

    try {
      let response;
      
      if (type === 'image') {
        // Use N8N_WEBHOOK_PROCESS_VIDEO for image regeneration
        const contentType = contentTypes.find(ct => ct.id === video.selectedType);
        
        response = await fetch(N8N_WEBHOOK_PROCESS_VIDEO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: {
              ...video,
              additionalInstructions: additionalInstructions
            },
            selectedType: video.selectedType,
            selectedPrompt: contentType?.imagePrompt || video.selectedPrompt,
            selectedScriptPrompt: contentType?.scriptPrompt || video.selectedScriptPrompt
          })
        });
      } else if (type === 'script') {
        // Use N8N_WEBHOOK_PROCESS_SCRIPT for script regeneration
        const contentType = contentTypes.find(ct => ct.id === video.selectedType);
        const scriptContent = video.result?.generatedContent?.script?.content || '';

        const enhancedScriptPrompt = additionalInstructions ? 
          `${contentType?.scriptPrompt || ''}\n\nAdditional instructions: ${additionalInstructions}\n\nPrevious script to improve:\n${scriptContent}` : 
          contentType?.scriptPrompt || video.selectedScriptPrompt;

        response = await fetch(N8N_WEBHOOK_PROCESS_SCRIPT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedScriptPrompt: enhancedScriptPrompt
          })
        });
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setProcessedResults(prev => prev.map(v => {
          if (v.uniqueId === video.uniqueId) {
            const updatedVideo = { ...v };            
            
            if (type === 'image' && result.data?.generatedContent?.images) {
              updatedVideo.result.generatedContent.images = result.data.generatedContent.images;
            } else if (type === 'script' && result.data?.generatedContent?.script) {
              updatedVideo.result.generatedContent.script = result.data.generatedContent.script;
            }
            
            // Mark as needing re-save and track what was regenerated
            updatedVideo.lastRegenerated = new Date().toISOString();
            updatedVideo.lastRegeneratedType = type;
            updatedVideo.needsResave = true;
            updatedVideo.regeneratedContent = type;
            
            // If previously saved to Drive, mark for potential re-save
            if (updatedVideo.savedToDrive) {
              updatedVideo.hasUnsavedChanges = true;
            }
            
            return updatedVideo;
          }
          return v;
        }));
      } else {
        throw new Error(result.message || `Failed to regenerate ${type}`);
      }
    } catch (err) {
      console.error(`Failed to regenerate ${type}:`, err);
      setError(`Failed to regenerate ${type}: ${err.message}`);
    } finally {
      setRegeneratingItems(prev => ({ ...prev, [regenerateId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">
                Regenerate {regenerateConfig.type === 'image' ? 'Images' : 'Script'}
              </h3>
              <p className="text-blue-100 text-sm">
                For: {regenerateConfig.video?.title}
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
              value={regenerateConfig.additionalInstructions}
              onChange={(e) => setRegenerateConfig(prev => ({ ...prev, additionalInstructions: e.target.value }))}
              placeholder={regenerateConfig.type === 'image' ? 
                `Add specific instructions for image regeneration...
Examples:
- Make the outlines bolder
- Add more vibrant colors
- Include specific elements from the video
- Adjust the composition
- Change the background
- Make it more child-friendly` :
                `Add specific instructions for script regeneration...
Examples:
- Add more educational content
- Include a specific lesson
- Make it more interactive
- Focus on a particular age group
- Add more questions for engagement
- Include specific vocabulary`}
              className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              {regenerateConfig.type === 'image' ? <Image className="w-4 h-4 mr-2 text-purple-600" /> :
               <FileText className="w-4 h-4 mr-2 text-orange-600" />}
              Current Settings
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Type:</span> {regenerateConfig.video?.typeName}</p>
              <p><span className="font-medium">Regenerating:</span> {
                regenerateConfig.type === 'image' ? 'Both Colored & B&W Images' : 'Script Only'
              }</p>
              {regenerateConfig.type === 'image' && (
                <p className="text-xs text-gray-500 mt-2">
                  Note: Both colored and black & white versions will be regenerated together
                </p>
              )}
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
              className={`flex-1 px-4 py-3 text-white rounded-xl transition-all font-medium flex items-center justify-center ${
                regenerateConfig.type === 'image' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' :
                'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
              }`}
            >
              {regenerateConfig.type === 'image' ? <Image className="w-4 h-4 mr-2" /> :
               <FileText className="w-4 h-4 mr-2" />}
              Regenerate {regenerateConfig.type === 'image' ? 'Images' : 'Script'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegenerateModal;