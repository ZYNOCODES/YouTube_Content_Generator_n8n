import { X } from 'lucide-react';
import { useState } from 'react';

const TypeSelectionModal = ({
  showTypeModal, setShowTypeModal,
  currentVideoForType, setCurrentVideoForType,
  selectedVideos, setSelectedVideos,
  contentTypes
}) => {
  const [mainTopic, setMainTopic] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  if (!showTypeModal) return null;

  const confirmVideoSelection = () => {
  if (!currentVideoForType || !selectedType) return;

  // Initialize with original script prompt
  let updatedScriptPrompt = selectedType.scriptPrompt;
  
  // Replace {MAIN_TOPIC} placeholder only for specific content types
  if (selectedType.id === 'LDL' || selectedType.id === 'LDST' || selectedType.id === 'LDSO') {   
    updatedScriptPrompt = selectedType.scriptPrompt.replace(
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
    uniqueId: `${currentVideoForType.channelId}-${currentVideoForType.id}-${Date.now()}`
  };

  setSelectedVideos(prev => [...prev, videoWithType]);
  setShowTypeModal(false);
  setCurrentVideoForType(null);
  setMainTopic('');
  setSelectedType(null);
};

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleClose = () => {
    setShowTypeModal(false);
    setCurrentVideoForType(null);
    setMainTopic('');
    setSelectedType(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Select Content Type</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {currentVideoForType && (
            <p className="text-gray-600 mt-2">For: {currentVideoForType.title}</p>
          )}
        </div>
        
        <div className="p-6">
          {/* Main Topic Input Field */}
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

          {/* Content Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={`p-4 border-2 rounded-xl hover:shadow-lg transition-all text-left ${
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
                <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                <p className="text-xs text-gray-500 italic line-clamp-2">
                  {type.imagePrompt?.substring(0, 100)}...
                </p>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmVideoSelection}
              disabled={!selectedType}
              className={`px-6 py-3 text-white rounded-xl transition-all font-medium ${
                selectedType
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm Selection
            </button>
          </div>

          {/* Preview Section */}
          {selectedType && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-2">Selection Preview:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Type:</span> {selectedType.name}</p>
                <p><span className="font-medium">Main Topic:</span> {mainTopic.trim() || '[Not specified]'}</p>
                {mainTopic.trim() && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ The script will be customized with this main topic
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeSelectionModal;