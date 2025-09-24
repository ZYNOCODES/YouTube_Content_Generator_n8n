import { X } from 'lucide-react';

const TypeSelectionModal = ({
  showTypeModal, setShowTypeModal,
  currentVideoForType, setCurrentVideoForType,
  selectedVideos, setSelectedVideos,
  contentTypes
}) => {
  if (!showTypeModal) return null;

  const confirmVideoSelection = (selectedType) => {
    if (!currentVideoForType || !selectedType) return;

    const videoWithType = {
      ...currentVideoForType,
      selectedType: selectedType.id,
      selectedPrompt: selectedType.imagePrompt,
      selectedScriptPrompt: selectedType.scriptPrompt,
      typeName: selectedType.name,
      typeIcon: selectedType.icon,
      uniqueId: `${currentVideoForType.channelId}-${currentVideoForType.id}-${Date.now()}`
    };

    setSelectedVideos(prev => [...prev, videoWithType]);
    setShowTypeModal(false);
    setCurrentVideoForType(null);
  };

  return (
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
              <p className="text-xs text-gray-500 italic line-clamp-2">{type.imagePrompt?.substring(0, 100)}...</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypeSelectionModal;