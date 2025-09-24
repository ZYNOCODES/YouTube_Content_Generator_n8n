import { Loader2 } from 'lucide-react';

const DriveSaveButton = ({ 
  video, 
  isIndividual = true, 
  savingToDrive, 
  batchSavingToDrive,
  isGapiLoaded,
  saveToDrive,
  batchSaveToDrive,
  processedResults
}) => {
  const videoId = video.uniqueId;
  const isLoading = isIndividual ? savingToDrive[videoId] : batchSavingToDrive;
  const isSaved = video.savedToDrive;
  const needsResave = video.needsResave || video.hasUnsavedChanges;

  const handleSave = () => {
    if (saveToDrive) {
      saveToDrive(video, false);
    }
  };

  const handleResave = () => {
    if (saveToDrive) {
      saveToDrive(video, true);
    }
  };

  const handleBatchSave = () => {
    if (batchSaveToDrive) {
      batchSaveToDrive();
    }
  };

  // Show re-save button if content was regenerated after being saved
  if (isSaved && needsResave) {
    return (
      <div className="flex flex-col space-y-2">
        {/* Status indicator */}
        <div className="flex items-center justify-center bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-medium text-sm">
            {video.regeneratedContent === 'image' ? 'Images' : 'Script'} Updated - Re-save Available
          </span>
        </div>
        
        {/* Re-save button */}
        <button
          onClick={() => isIndividual ? handleResave() : handleBatchSave()}
          disabled={!isGapiLoaded || isLoading}
          className={`flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[180px] ${
            isLoading ? 'animate-pulse' : ''
          }`}
        >
          {isLoading ? (
            <>
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Re-saving...</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-20 rounded-xl animate-pulse" />
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">
                {isIndividual ? 'Re-save to Drive' : `Re-save Updated (${processedResults.filter(v => v.needsResave || v.hasUnsavedChanges).length})`}
              </span>
            </>
          )}
        </button>

        {/* Original folder link */}
        {video.driveFolder && (
          <div className="flex items-center justify-center bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Original in Drive</span>
            <a
              href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </a>
          </div>
        )}
      </div>
    );
  }

  // Standard save button for first-time saves
  if (isSaved && !needsResave) {
    return (
      <div className="flex items-center justify-center bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">Saved to Drive</span>
        {video.driveFolder && (
          <a
            href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open
          </a>
        )}
        {video.lastSavedAt && (
          <span className="ml-2 text-xs text-gray-500">
            ({new Date(video.lastSavedAt).toLocaleString()})
          </span>
        )}
      </div>
    );
  }

  // First-time save button
  return (
    <button
      onClick={() => isIndividual ? handleSave() : handleBatchSave()}
      disabled={!isGapiLoaded || isLoading}
      className={`flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[180px] ${
        isLoading ? 'animate-pulse' : ''
      }`}
    >
      {isLoading ? (
        <>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Saving...</span>
          </div>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span className="font-medium">
            {isIndividual ? 'Save to Drive' : `Save All (${processedResults.filter(v => !v.savedToDrive).length})`}
          </span>
        </>
      )}
    </button>
  );
};

export default DriveSaveButton;