import { FileText, Loader2 } from 'lucide-react';

const ImageSlider = ({ 
  video, 
  result, 
  regeneratingItems, 
  openRegenerateModal,
  downloadingImages, 
  downloadImage,
  activeImageTab,
  setActiveImageTab 
}) => {
  const videoId = video.uniqueId;
  const currentTab = activeImageTab[videoId] || 'colored';
  
  const images = [];
  if (result.generatedContent?.images?.colored?.base64) {
    images.push({
      id: 'colored',
      name: 'Colored Version',
      icon: '🎨',
      base64: result.generatedContent.images.colored.base64,
      gradient: 'from-pink-500 to-purple-600'
    });
  }
  if (result.generatedContent?.images?.blackAndWhite?.base64) {
    images.push({
      id: 'blackAndWhite',
      name: 'Black & White Version',
      icon: '🖤',
      base64: result.generatedContent.images.blackAndWhite.base64,
      gradient: 'from-gray-500 to-gray-700'
    });
  }

  if (images.length === 0) return null;

  const handleDownload = (imageData, filename) => {
    if (downloadImage) {
      downloadImage(imageData, filename);
    }
  };

  const handleRegenerate = () => {
    if (openRegenerateModal) {
      openRegenerateModal(video, 'image');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Generated Images
        </h4>
        <button
          onClick={handleRegenerate}
          disabled={regeneratingItems[`${video.uniqueId}_image`]}
          className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          title="Regenerate Images Only"
        >
          {regeneratingItems[`${video.uniqueId}_image`] ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-1" />
          )}
          Images
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setActiveImageTab(prev => ({ ...prev, [videoId]: image.id }))}
            className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg transition-all duration-300 font-medium text-sm ${
              currentTab === image.id
                ? `bg-gradient-to-r ${image.gradient} text-white shadow-lg transform scale-105`
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{image.icon}</span>
            {image.name}
          </button>
        ))}
      </div>

      {/* Image Display with Smooth Transition */}
      <div className="relative bg-gray-50 rounded-2xl p-4 overflow-hidden">
        <div className="relative min-h-[300px] rounded-xl overflow-hidden bg-white shadow-inner">
          {images.map((image) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${
                currentTab === image.id
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 translate-x-4 scale-95 pointer-events-none'
              }`}
            >
              <img
                src={`data:image/png;base64,${image.base64}`}
                alt={image.name}
                className="w-full h-full object-contain rounded-xl"
                style={{ maxHeight: '400px' }}
              />
              
              {/* Floating Download Button */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={() => handleDownload(
                    image.base64,
                    `${video.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30)}_${image.id}.png`
                  )}
                  disabled={downloadingImages[`${video.title}_${image.id}.png`]}
                  className={`flex items-center px-4 py-2 bg-gradient-to-r ${image.gradient} text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {downloadingImages[`${video.title}_${image.id}.png`] ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Image Counter */}
        <div className="flex justify-center mt-4">
          <div className="bg-white rounded-full px-4 py-2 shadow-sm">
            <div className="flex space-x-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentTab === image.id ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;