import { ChevronDown, ChevronUp, Trash2, FileText, Loader2 } from 'lucide-react';
import ImageSlider from './ImageSlider';
import DriveSaveButton from './DriveSaveButton';

const ResultsView = ({
  processedResults, setProcessedResults,
  expandedResults, setExpandedResults,
  regeneratingItems,
  openRegenerateModal,
  downloadingImages,
  downloadImage,
  activeImageTab, setActiveImageTab,
  savingToDrive,
  batchSavingToDrive,
  isGapiLoaded,
  saveToDrive,
  batchSaveToDrive,
  resetAll
}) => {
  const deleteProcessedVideo = (uniqueId) => {
    setProcessedResults(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  const openRegenerateModalWrapper = (video, type) => {
    if (typeof openRegenerateModal === 'function') {
      openRegenerateModal(video, type);
    }
  };

  const handleDownloadImage = (base64Data, filename) => {
    if (typeof downloadImage === 'function') {
      downloadImage(base64Data, filename);
    }
  };

  return (
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

      {processedResults.map((video) => {
        const isExpanded = expandedResults[video.uniqueId];
        const result = video.result;
        
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
                    {video.lastRegenerated && (
                      <p className="text-xs text-blue-600">
                        Last regenerated ({video.lastRegeneratedType}): {new Date(video.lastRegenerated).toLocaleString()}
                      </p>
                    )}
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
                    <ImageSlider 
                      video={video} 
                      result={result} 
                      regeneratingItems={regeneratingItems}
                      openRegenerateModal={openRegenerateModalWrapper}
                      downloadingImages={downloadingImages}
                      downloadImage={handleDownloadImage}
                      activeImageTab={activeImageTab}
                      setActiveImageTab={setActiveImageTab}
                    />
                  )}

                  {/* Generated Script */}
                  {result.generatedContent?.script?.content && (
                    <div>
                      <div className='flex items-center justify-between mb-4'>
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          Script ({result.generatedContent.script.wordCount || 'N/A'} words)
                        </h4>
                        <button
                          onClick={() => openRegenerateModalWrapper(video, 'script')}
                          disabled={regeneratingItems[`${video.uniqueId}_script`]}
                          className="flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                          title="Regenerate Script Only"
                        >
                          {regeneratingItems[`${video.uniqueId}_script`] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4 mr-1" />
                          )}
                          Script
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
                  <DriveSaveButton 
                    video={video} 
                    isIndividual={true}
                    savingToDrive={savingToDrive}
                    batchSavingToDrive={batchSavingToDrive}
                    isGapiLoaded={isGapiLoaded}
                    saveToDrive={saveToDrive}
                    batchSaveToDrive={batchSaveToDrive}
                    processedResults={processedResults}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResultsView;