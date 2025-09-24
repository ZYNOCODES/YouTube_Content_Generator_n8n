import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ProcessingView = ({
  processingQueue,
  setStep
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Processing Videos</h2>
      
      <div className="space-y-4 max-w-4xl mx-auto">
        {processingQueue.map((video) => (
          <div key={video.uniqueId} className="border-2 rounded-lg p-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{video.typeIcon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{video.title}</h4>
                  <p className="text-sm text-gray-600">Type: {video.typeName}</p>
                </div>
              </div>
              <div className="flex items-center">
                {video.status === 'processing' && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                    <span className="text-blue-600">Processing...</span>
                  </>
                )}
                {video.status === 'completed' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-600">Completed</span>
                  </>
                )}
                {video.status === 'error' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-600">Error</span>
                  </>
                )}
                {!video.status && (
                  <span className="text-gray-500">Waiting...</span>
                )}
              </div>
            </div>
            {video.error && (
              <p className="text-sm text-red-600 mt-2">{video.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        {processingQueue.every(v => v.status === 'completed' || v.status === 'error') && (
          <button
            onClick={() => setStep('results')}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
          >
            View Results →
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcessingView;