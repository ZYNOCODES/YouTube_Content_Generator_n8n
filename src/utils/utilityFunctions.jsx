// Download image function
export const downloadImage = async (base64Data, filename, setDownloadingImages, setError) => {
  try {
    setDownloadingImages(prev => ({ ...prev, [filename]: true }));
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    setError(`Failed to download image: ${error.message}`);
  } finally {
    setDownloadingImages(prev => ({ ...prev, [filename]: false }));
  }
};

// Save to Drive Function
export const saveToDrive = async (
  video, 
  isResave = false,
  setSavingToDrive,
  setProcessedResults,
  setError,
  isGapiLoaded,
  GOOGLE_CLIENT_ID
) => {
  if (!video.result || !isGapiLoaded) return;

  const videoId = video.uniqueId;
  setSavingToDrive(prev => ({ ...prev, [videoId]: true }));

  try {
    const tokenResponse = await new Promise((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) reject(response);
          else resolve(response);
        }
      });
      tokenClient.requestAccessToken();
    });

    if (!tokenResponse.access_token) throw new Error('No access token received');

    window.gapi.client.setToken({ access_token: tokenResponse.access_token });

    const videoTitle = video.title || 'Unknown Video';
    const sanitizedTitle = videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
    
    let folderId;
    let folderName;

    if (isResave && video.driveFolder) {
      // For re-saves, use existing folder and update files
      folderId = video.driveFolder;
      folderName = `Updated_${new Date().toISOString().slice(0, 10)}_${video.selectedType}_${sanitizedTitle}`;
    } else {
      // Create new folder for first-time saves
      folderName = `${new Date().toISOString().slice(0, 10)}_${video.selectedType}_${sanitizedTitle}`;
      const folder = await window.gapi.client.drive.files.create({
        resource: { 
          name: folderName, 
          mimeType: 'application/vnd.google-apps.folder' 
        }
      });
      folderId = folder.result.id;
    }
    
    const uploadPromises = [];

    // Save script as text file
    if (video.result?.generatedContent?.script?.content) {
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      // Add timestamp if it's a regenerated script
      const scriptContent = video.lastRegeneratedType === 'script' ? 
        `[Updated: ${new Date(video.lastRegenerated).toLocaleString()}]\n\n${video.result.generatedContent.script.content}` :
        video.result.generatedContent.script.content;

      const scriptFileName = isResave && video.lastRegeneratedType === 'script' ? 
        `Script_Updated_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')}.txt` : 
        'Script.txt';

      const metadata = {
        'name': scriptFileName,
        'parents': [folderId],
        'mimeType': 'text/plain'
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n' +
        scriptContent +
        close_delim;

      uploadPromises.push(
        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + tokenResponse.access_token,
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
          },
          body: multipartRequestBody
        })
      );
    }

    // Helper function to upload image
    const uploadImage = async (base64Data, fileName) => {
      const imageBlob = new Blob([
        new Uint8Array(
          atob(base64Data)
            .split('')
            .map(char => char.charCodeAt(0))
        )
      ], { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify({
        'name': fileName,
        'parents': [folderId],
        'mimeType': 'image/png'
      })], { type: 'application/json' }));
      formData.append('file', imageBlob, fileName);

      return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + tokenResponse.access_token,
        },
        body: formData
      });
    };

    // Save colored image
    if (video.result?.generatedContent?.images?.colored?.base64) {
      const coloredFileName = isResave && video.lastRegeneratedType === 'image' ? 
        `Colored_Image_Updated_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')}.png` : 
        'Colored_Image.png';
      
      uploadPromises.push(uploadImage(
        video.result.generatedContent.images.colored.base64,
        coloredFileName
      ));
    }

    // Save black and white image
    if (video.result?.generatedContent?.images?.blackAndWhite?.base64) {
      const bwFileName = isResave && video.lastRegeneratedType === 'image' ? 
        `BlackAndWhite_Image_Updated_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')}.png` : 
        'BlackAndWhite_Image.png';
      
      uploadPromises.push(uploadImage(
        video.result.generatedContent.images.blackAndWhite.base64,
        bwFileName
      ));
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Update the processed results
    setProcessedResults(prev => prev.map(v => {
      if (v.uniqueId === video.uniqueId) {
        return { 
          ...v, 
          savedToDrive: true, 
          driveFolder: folderId,
          needsResave: false, // Clear the re-save flag
          hasUnsavedChanges: false, // Clear unsaved changes flag
          lastSavedAt: new Date().toISOString()
        };
      }
      return v;
    }));

  } catch (error) {
    console.error('Error saving to Drive:', error);
    setError(`Failed to save to Drive: ${error.message}`);
  } finally {
    setSavingToDrive(prev => ({ ...prev, [videoId]: false }));
  }
};

// Enhanced Batch Save Function
export const batchSaveToDrive = async (
  processedResults,
  setBatchSavingToDrive,
  saveToDrive,
  setError
) => {
  const videosToSave = processedResults.filter(v => !v.savedToDrive);
  const videosToResave = processedResults.filter(v => v.savedToDrive && (v.needsResave || v.hasUnsavedChanges));
  
  const allVideosToProcess = [...videosToSave, ...videosToResave];
  
  if (allVideosToProcess.length === 0) return;

  setBatchSavingToDrive(true);
  
  try {
    // Process videos sequentially to avoid overwhelming the API
    for (const video of allVideosToProcess) {
      const isResave = videosToResave.includes(video);
      await saveToDrive(video, isResave);
      // Small delay between saves
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Batch save error:', error);
    setError(`Batch save failed: ${error.message}`);
  } finally {
    setBatchSavingToDrive(false);
  }
};

// Regeneration Functions
export const openRegenerateModal = (
  video, 
  regenerationType = 'image',
  setRegenerateConfig,
  setShowRegenerateModal
) => {
  setRegenerateConfig({ 
    video, 
    additionalInstructions: '', 
    type: regenerationType 
  });
  setShowRegenerateModal(true);
};

export const regenerateContent = async (
  regenerateConfig,
  setRegeneratingItems,
  setShowRegenerateModal,
  setProcessedResults,
  setError,
  contentTypes,
  N8N_WEBHOOK_PROCESS_VIDEO,
  N8N_WEBHOOK_PROCESS_SCRIPT
) => {
  const { video, additionalInstructions, type } = regenerateConfig;
  if (!video) return;

  const regenerateId = `${video.uniqueId}_${type}`;
  setRegeneratingItems(prev => ({ ...prev, [regenerateId]: true }));
  setShowRegenerateModal(false);

  try {
    let response;
    
    if (type === 'image') {
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

// Save All Results Locally Function
export const saveAllResultsLocally = async (processedResults, setError) => {
  if (!processedResults || processedResults.length === 0) {
    setError('No results to save');
    return;
  }

  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const mainFolderName = `YouTube_Content_Export_${timestamp}`;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let i = 0; i < processedResults.length; i++) {
      const video = processedResults[i];
      const videoFolder = zip.folder(`video_${i + 1}_${video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`);

      if (video.result?.generatedContent?.script?.content) {
        videoFolder.file('script.txt', video.result.generatedContent.script.content);
      }

      if (video.result?.generatedContent?.images?.colored?.base64) {
        const coloredBase64 = video.result.generatedContent.images.colored.base64;
        videoFolder.file('image_colored.png', coloredBase64, { base64: true });
      }

      if (video.result?.generatedContent?.images?.blackAndWhite?.base64) {
        const bwBase64 = video.result.generatedContent.images.blackAndWhite.base64;
        videoFolder.file('image_blackandwhite.png', bwBase64, { base64: true });
      }

      // const promptsData = {
      //   imagePrompt: video.selectedPrompt || '',
      //   scriptPrompt: video.selectedScriptPrompt || ''
      // };
      // videoFolder.file('prompts.txt', 
      //   `IMAGE PROMPT:\n${promptsData.imagePrompt}\n\n` +
      //   `SCRIPT PROMPT:\n${promptsData.scriptPrompt}`
      // );
    }

    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mainFolderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Successfully exported ${processedResults.length} videos to ${mainFolderName}.zip`);

  } catch (error) {
    console.error('Error saving results locally:', error);
    setError(`Failed to save results locally: ${error.message}`);
    throw error;
  }
};
