import { useState, useEffect } from 'react'; 
import { AlertCircle, X, Check } from 'lucide-react';
import ChannelInput from '../components/ChannelInput';
import VideoSelection from '../components/VideoSelection';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import TypeSelectionModal from '../components/TypeSelectionModal';
import RegenerateModal from '../components/RegenerateModal';
import { 
  downloadImage, 
  saveToDrive, 
  batchSaveToDrive, 
  openRegenerateModal, 
  regenerateContent,
  saveAllResultsLocally
} from '../utils/utilityFunctions';

const YouTubeChannelProcessor = () => {
  // State Management
  const [channelUrls, setChannelUrls] = useState(['']);
  const [channelsData, setChannelsData] = useState({});
  const [selectedVideos, setSelectedVideos] = useState([]);  
  const [processingQueue, setProcessingQueue] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [step, setStep] = useState('channels');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [currentVideoForType, setCurrentVideoForType] = useState(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [regeneratingItems, setRegeneratingItems] = useState({});
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateConfig, setRegenerateConfig] = useState({ 
    video: null, 
    additionalInstructions: '', 
    type: 'image'
  });
  const [downloadingImages, setDownloadingImages] = useState({});
  const [activeImageTab, setActiveImageTab] = useState({}); 
  const [savingToDrive, setSavingToDrive] = useState({}); 
  const [batchSavingToDrive, setBatchSavingToDrive] = useState(false); 
  
  // Environment variables
  const N8N_WEBHOOK_FETCH = import.meta.env.VITE_APP_N8N_WEBHOOK_FETCH;   
  const N8N_WEBHOOK_PROCESS_VIDEO = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS_VIDEO;
  const N8N_WEBHOOK_PROCESS_SCRIPT = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS_SCRIPT;
  const SUPADATA_API_KEY = import.meta.env.VITE_APP_SUPADATA_API_KEY; // Added for transcript support
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_DRIVE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;
  
  // Content types
  const contentTypes = [
    {
      id: 'LDL',
      name: 'LDL - Draw and Learn',
      icon: '📚',
      description: 'Educational drawing & learning content',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgLight: 'bg-blue-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `Write a 10-minute "Draw and Learn" YouTube Voice-Over script for kids aged 4-6 (Grade 1). The video features a drawing and coloring segment of a popular kid-friendly topic.

GOAL:
Teach some fun and simple lessons while we’re drawing [WHAT WE’RE DRAWING]!

MAIN_TOPIC: {MAIN_TOPIC}

🧠 NARRATION STRUCTURE
- Grade 1 level language: simple, warm, playful, clear.
- Grade 2 level narration: simple, no complicated twist
- Tone: casual, enthusiastic -  narration is like chatting with a friend about a fun show you both love.
- Voice-over only: No description of the image drawing & colors, no "step by step how to draw”
- Word count: 650-800 words max total (this is a very important words must be under 800).

🎬 [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw and Learn"
Mention what we’re drawing:
"Today we’re drawing [WHAT WE’RE DRAWING]!”  In this video it’s all about [X] & [Y].” 
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love drawing and smart stories, hit Subscribe so you don’t miss our next video!”

🧩 [0:30-2:30] - Start talking about the topic while we draw/color 
Introduce the main idea or topic that leads to the [WHAT WE’RE DRAWING]
“Let me tell you about”
Add a first interesting learning / lesson about [WHAT WE’RE DRAWING]
Keep it light, simple, warm and fun/playful, as if you’re telling a friend the gist.
🧩 [2:30-4:00] - Include a mini story or pretend scene
Describe one exciting mini story or funny pretend scene inspired by [WHAT WE’RE DRAWING].
Use casual phrases: “Guess what happens when…?”, “You won’t believe…”
Ask your audience: “What do you think XXX would do?” OR “What do you think happened next?”
✅ CTA #2 – Like: “If you think that’s XXX, give this video a big LIKE!”

🧩  [4:00-9:00] - Add a few fun/surprising facts
Drop one or two or more fun/surprising facts  about [WHAT WE’RE DRAWING]
One fact can be a number if relevant
Build anticipation: “But that’s not all…”
Keep it conversational, as if leaning in to spill the next secret.
"And Keep drawing and coloring with me, the final image will surprise/wow/xxx you!"

👋 [Closing | 9:00–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and learned [2 or 3 KEY LESSONS].”
✅ CTA #4 – Subscribe: “And If you love Smart stories and Art, hit Subscribe so you don’t miss our next video on Let’s Draw and LEARN!”
“See you next time, Friends—bye!” 
`
    },
    {
      id: 'LDPP',
      name: 'LDPP - Princess Peppa',
      icon: '👑',
      description: 'Princess Peppa Pig adventures',
      color: 'bg-pink-500',
      borderColor: 'border-pink-500',
      bgLight: 'bg-pink-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `Narration is inspired by a specific video episode; tease enough to excite viewers to watch the full episode.
Read the transcript for [VIDEO TITLE] (link: [VIDEO URL]) and write a script that follows this structure:

🧠 NARRATION STRUCTURE
- Grade 1 level language: simple, warm, playful, clear.
- Grade 2 level narration: simple, no complicated twist
- Tone: casual, enthusiastic -  narration is like chatting with a friend about a fun show you both love.
- Voice-over only: No detailed description of the drawing process & colors, no "how to draw”
- Word count: 650-800 words max total (this is a very important words must be under 800).


🎬 [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw Princess Pig"
Mention what we’re drawing:
"Today we’re drawing [WHAT WE’RE DRAWING]!”  In this video it’s all about [X] & [Y].” 
or “Today we’re drawing [WHAT WE’RE DRAWING] from the Video [Episode Title]…”  In this video it’s all about [X] & [Y].” 
or “Today our drawing is inspired by XXX's amazing video [VIDEO TITLE]! In this video it’s all about [X] & [Y].”  
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love drawing and fun stories, hit Subscribe so you don’t miss our next video!”

🧩 [Episode Tease + Story Setup | 0:45–3:00]
Summarize the setup (main idea or problem) that leads to the [DRAWING MOMENT]
“Let me tell you what happened in this video/story/drawing…”
Don’t spoil the ending—just enough context to build interest.
Keep it light, simple, warm and fun/playful, as if you’re telling a friend the gist.


💭 [Key Moment Teaser | 3:00–5:30]
Describe one exciting twist or funny beat from the story.
Use casual phrases: “Guess what happens when…?”, “You won’t believe it when…”
Ask your audience: “What do you think [character] will do next?” OR “What do you think happened next?”
✅ CTA #2 – Like: “If you think that’s XXX, give this video a big LIKE!”


🔁 [Second Tease | 5:30–8:00]
Drop a second surprise or clue that builds toward the drawing moment.
Build anticipation: “But that’s not all…”
Show how things begin to make sense.
Keep it conversational, as if leaning in to spill the next secret.


✅ [ Reveal + Resolution| 8:00–9:30]
Explain what actually happened and how it led to the drawing moment.
Tie back to the drawing:: “That’s the story of how this drawing happened!”
"And Keep drawing and coloring with me, the final image will surprise/wow/xxx you!"


👋 [Closing | 9:30–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #4 – Subscribe: “And If you love fun stories and art, hit Subscribe so you don’t miss our next video!”
“See you next time, Friends—bye!”
`
    },
    {
      id: 'LDST',
      name: 'LDST - Story Time',
      icon: '📖',
      description: 'Story-based drawing content',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      bgLight: 'bg-purple-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `TITLE: {TITLE}
MAIN_TOPIC: {MAIN_TOPIC} 

Imagine a Story inspired by the [MAIN TOPIC] of the Title, that leads to the [DRAWING MOMENT]

The [MAIN TOPIC] is also the [WHAT WE’RE DRAWING] and [DRAWING MOMENT]

🧠 NARRATION STRUCTURE
Grade 1 level language: simple, warm, playful, clear.
Grade 1 level narration: simple, no complicated twist
Tone: casual, enthusiastic -  narration is like chatting with a friend about a fun show you both love.
Voice-over only: No description of the image drawing & colors, no "step by step how to draw”
Word count: 650-800 words max total (this is a very important words must be under 800).

🎬 [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw a Story"
Mention what we’re drawing:
"Today we’re drawing [WHAT WE’RE DRAWING]!”  In this video it’s all about [X] & [Y].” 
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love drawing and fun stories, hit Subscribe so you don’t miss our next video!”

🧩 [Episode Tease + Story Setup | 0:45–3:00]
Summarize the setup (main idea or problem) that leads to the  [DRAWING MOMENT]
“Let me tell you what happened in this story…”
Don’t spoil the ending—just enough context to build interest.
Keep it light, simple, warm and fun/playful, as if you’re telling a friend the gist.


💭 [Key Moment Teaser | 3:00–5:30]
Describe one exciting twist or funny beat from the story.
Use casual phrases: “Guess what happens when…?”, “You won’t believe it when…”
Ask your audience: “What do you think [character] will do next?” OR “What do you think happened next?”
✅ CTA #2 – Like: “If you think that’s XXX, give this video a big LIKE!”


🔁 [Second Tease | 5:30–8:00]
Drop a second surprise or clue that builds toward the drawing moment.
Build anticipation: “But that’s not all…”
Show how things begin to make sense.
Keep it conversational, as if leaning in to spill the next secret.


✅ [ Reveal + Resolution| 8:00–9:30]
Explain what actually happened and how it led to the drawing moment.
Tie back to the drawing:: “That’s the story of how this drawing happened!”
"And Keep drawing and coloring with me, the final image will surprise/wow/xxx you!"


👋 [Closing | 9:30–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #4 – Subscribe: “And If you love fun stories and art, hit Subscribe so you don’t miss our next video on Let’s Draw XXX!”
“See you next time, Friends—bye!” 
`
    },
    {
      id: 'LDYT',
      name: 'LDYT - YouTubers',
      icon: '🎮',
      description: 'Drawing popular YouTubers',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      bgLight: 'bg-red-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `Narration is inspired by a specific video episode; tease enough to excite viewers to watch the full episode.
Read the transcript for [VIDEO TITLE] (link: [VIDEO URL]) and write a script that follows this structure:

🧠 NARRATION STRUCTURE
- Grade 1 level language: simple, warm, playful, clear.
- Grade 2 level narration: simple, no complicated twist
- Tone: casual, enthusiastic -  narration is like chatting with a friend about a fun show you both love.
- Voice-over only: No detailed description of the drawing process & colors, no "how to draw”
- Word count: 650-800 words max total (this is a very important words must be under 800).


🎬 [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw YouTubers"
Mention what we’re drawing:
"Today we’re drawing [WHAT WE’RE DRAWING]!”  In this video it’s all about [X] & [Y].” 
or “Today we’re drawing [WHAT WE’RE DRAWING] from the Video [Episode Title]…”  In this video it’s all about [X] & [Y].” 
or “Today our drawing is inspired by XXX's amazing video [VIDEO TITLE]! In this video it’s all about [X] & [Y].”  
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love drawing and fun stories, hit Subscribe so you don’t miss our next video!”

🧩 [Episode Tease + Story Setup | 0:45–3:00]
Summarize the setup (main idea or problem) that leads to the [DRAWING MOMENT]
“Let me tell you what happened in this video/story/drawing…”
Don’t spoil the ending—just enough context to build interest.
Keep it light, simple, warm and fun/playful, as if you’re telling a friend the gist.


💭 [Key Moment Teaser | 3:00–5:30]
Describe one exciting twist or funny beat from the story.
Use casual phrases: “Guess what happens when…?”, “You won’t believe it when…”
Ask your audience: “What do you think [character] will do next?” OR “What do you think happened next?”
✅ CTA #2 – Like: “If you think that’s XXX, give this video a big LIKE!”


🔁 [Second Tease | 5:30–8:00]
Drop a second surprise or clue that builds toward the drawing moment.
Build anticipation: “But that’s not all…”
Show how things begin to make sense.
Keep it conversational, as if leaning in to spill the next secret.


✅ [ Reveal + Resolution| 8:00–9:30]
Explain what actually happened and how it led to the drawing moment.
Tie back to the drawing:: “That’s the story of how this drawing happened!”
"And Keep drawing and coloring with me, the final image will surprise/wow/xxx you!"


👋 [Closing | 9:30–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #4 – Subscribe: “And If you love fun stories and art, hit Subscribe so you don’t miss our next video!”
“See you next time, Friends—bye!” 
`
    },
    {
      id: 'LDBM',
      name: 'LDBM - Mr Beast',
      icon: '💰',
      description: 'Mr Beast challenge drawings',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      bgLight: 'bg-green-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `Narration is inspired by a specific video episode; tease enough to excite viewers to watch the full episode.
Read the transcript for [VIDEO TITLE] (link: [VIDEO URL]) and write a script that follows this structure:

🧠 NARRATION STRUCTURE
- Grade 1 level language: simple, warm, playful, clear.
- Grade 2 level narration: simple, no complicated twist
- Tone: casual, enthusiastic -  narration is like chatting with a friend about a fun show you both love.
- Voice-over only: No detailed description of the drawing process & colors, no "how to draw”
- Word count: 650-800 words max total (this is a very important words must be under 800).


🎬 [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw MR BEAST"
Mention what we’re drawing:
"Today we’re drawing [WHAT WE’RE DRAWING]!”  In this video it’s all about [X] & [Y].” 
or “Today we’re drawing [WHAT WE’RE DRAWING] from the Video [Episode Title]…”  In this video it’s all about [X] & [Y].” 
or “Today our drawing is inspired by XXX's amazing video [VIDEO TITLE]! In this video it’s all about [X] & [Y].”  
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love drawing and fun stories, hit Subscribe so you don’t miss our next video!”

🧩 [Episode Tease + Story Setup | 0:45–3:00]
Summarize the setup (main idea or problem) that leads to the [DRAWING MOMENT]
“Let me tell you what happened in this video/story/drawing…”
Don’t spoil the ending—just enough context to build interest.
Keep it light, simple, warm and fun/playful, as if you’re telling a friend the gist.


💭 [Key Moment Teaser | 3:00–5:30]
Describe one exciting twist or funny beat from the story.
Use casual phrases: “Guess what happens when…?”, “You won’t believe it when…”
Ask your audience: “What do you think [character] will do next?” OR “What do you think happened next?”
✅ CTA #2 – Like: “If you think that’s XXX, give this video a big LIKE!”


🔁 [Second Tease | 5:30–8:00]
Drop a second surprise or clue that builds toward the drawing moment.
Build anticipation: “But that’s not all…”
Show how things begin to make sense.
Keep it conversational, as if leaning in to spill the next secret.


✅ [ Reveal + Resolution| 8:00–9:30]
Explain what actually happened and how it led to the drawing moment.
Tie back to the drawing:: “That’s the story of how this drawing happened!”
"And Keep drawing and coloring with me, the final image will surprise/wow/xxx you!"


👋 [Closing | 9:30–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #4 – Subscribe: “And If you love fun stories and art, hit Subscribe so you don’t miss our next video!”
“See you next time, Friends—bye!” 
`
    },
    {
      id: 'LDSO',
      name: 'LDSO - Sing Along',
      icon: '🎵',
      description: 'Musical drawing content',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      bgLight: 'bg-orange-50',
      imagePrompt: `Create a 16:9 cartoon-style illustration based on {TITLE}. Use bold colors, thick outlines, flat simple shapes, and a vibrant kid-friendly look for 6-year-olds. The image is for drawing practice, so keep it clean, clear, and without any text.`,
      scriptPrompt: `MAIN_TOPIC: {MAIN_TOPIC} 
TITLE: [Song Title]

🧠 NARRATION STRUCTURE
- Grade 1 level language: simple, warm, playful, clear.
- Grade 2 level narration: simple, no complicated twist
- Tone: casual, enthusiastic -
- Voice-over only: No description of the image drawing & colors, no "step by step how to draw”
- Word count: 650-800 words max total (this is a very important words must be under 800) including song Lyrics

🎬 1- [Intro | 0:00–0:45]
Start with: 
"Hi Friends it’s Mia here! Welcome back to Let’s Draw a SONG"
Mention what we’re drawing:
“Today we’re drawing [WHAT WE’RE DRAWING] from the SONG [Song Title]…”  In this video it’s all about [X] & [Y].” 
“Grab your crayons and paper—let’s draw together! Are you ready? Let’s go!” 
✅ CTA #1 – Subscribe: “And If you love Drawing and Singing, hit Subscribe so you don’t miss our next video!”
🎶 “Alright—now here comes [SONG TITLE]! Let’s draw and sing together!”

🎬 2- [SONG | 0:00–9:00]
Write a KID's song (target audience: 6–8 years old) about [WHAT WE’RE DRAWING] AND/OR with the TITLE [Song Title]
Style & Tone
Fun, cool, and catchy for kids—avoid babyish or overly simplistic wording.
Keep sentences short, rhythmic, and easy to sing.
Use a nursery rhyme–inspired melody structure (simple patterns, repetition, call-and-response), but age it up slightly so it feels exciting and not too young.
Use rhyme and rhythm naturally—think singalong quality.
Core Vocabulary
Must include: drawing, coloring, draw, color (at least one in each verse or chorus).
Use words kids easily know (avoid complicated vocabulary).
Structure & Storytelling
The lyrics should tell a story through the song
Start  with song title
Setup
Middle:  funny or lighthearted story
Resolution
Closing/Chorus: Wrap up with positivity, drawing and coloring
Musical Flow
Intro: Fun hook that sets the scene
Verses: Simple storytelling, each verse adds to the story/ adventure.
Chorus: Easy to repeat, catchy, singalong—mention “draw” or “color” here.
Bridge: A playful, slightly different melody (maybe call-and-response)
Final Chorus/Outro: Big, happy, colorful ending.
Additional Notes
Balance story + music so it feels like part song, part storytelling adventure.
Use repetition and predictable rhymes for memorability.
Keep it upbeat and positive—kids should feel like they’re part of the hospital adventure.
Must be 2min30 to 3min long
👋 3- [OUTRO | 9:30–10:00]
Congrats: "WOW you did Amazing!"
Recap: “Today we drew [WHAT WE DREW] and SangTogether.”
✅ CTA #4 – Subscribe: “And If you love Drawing and Singing, hit Subscribe so you don’t miss our next video on Let’s Draw a SONG!”
“See you next time, Friends—bye!” 
`
    }
  ];

  // Load Google APIs
  useEffect(() => {
    const loadGoogleAPI = () => {
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.onload = () => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          window.gapi.load('client', () => {
            window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            }).then(() => {
              setIsGapiLoaded(true);
            }).catch(error => {
              console.error('Google API initialization error:', error);
            });
          });
        };
        document.head.appendChild(gapiScript);
      };
      document.head.appendChild(gsiScript);
    };
    if (GOOGLE_API_KEY && GOOGLE_CLIENT_ID) {
      loadGoogleAPI();
    }
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

  const resetAll = () => {
    setChannelUrls(['']);
    setChannelsData({});
    setSelectedVideos([]);
    setProcessingQueue([]);
    setProcessedResults([]);
    setError('');
    setStep('channels');
  };

  const handleSaveAllLocally = () => {
    saveAllResultsLocally(processedResults, setError);
  };


  // Wrapper functions for utility functions
  const handleDownloadImage = (base64Data, filename) => {
    downloadImage(base64Data, filename, setDownloadingImages, setError);
  };

  const handleSaveToDrive = (video, isResave = false) => {
    saveToDrive(
      video, 
      isResave,
      setSavingToDrive,
      setProcessedResults,
      setError,
      isGapiLoaded,
      GOOGLE_CLIENT_ID
    );
  };

  const handleBatchSaveToDrive = () => {
    batchSaveToDrive(
      processedResults,
      setBatchSavingToDrive,
      handleSaveToDrive,
      setError
    );
  };

  const handleOpenRegenerateModal = (video, regenerationType = 'image') => {
    openRegenerateModal(
      video,
      regenerationType,
      setRegenerateConfig,
      setShowRegenerateModal
    );
  };

  const handleRegenerateContent = () => {
    regenerateContent(
      regenerateConfig,
      setRegeneratingItems,
      setShowRegenerateModal,
      setProcessedResults,
      setError,
      contentTypes,
      N8N_WEBHOOK_PROCESS_VIDEO,
      N8N_WEBHOOK_PROCESS_SCRIPT
    );
  };

  // Props for child components
  const sharedProps = {
    channelUrls, setChannelUrls,
    channelsData, setChannelsData,
    selectedVideos, setSelectedVideos,
    processingQueue, setProcessingQueue,
    processedResults, setProcessedResults,
    loading, setLoading,
    error, setError,
    step, setStep,
    showTypeModal, setShowTypeModal,
    currentVideoForType, setCurrentVideoForType,
    isGapiLoaded,
    expandedResults, setExpandedResults,
    regeneratingItems, setRegeneratingItems,
    showRegenerateModal, setShowRegenerateModal,
    regenerateConfig, setRegenerateConfig,
    downloadingImages, setDownloadingImages,
    activeImageTab, setActiveImageTab,
    savingToDrive, setSavingToDrive,
    batchSavingToDrive, setBatchSavingToDrive,
    contentTypes,
    N8N_WEBHOOK_FETCH,
    N8N_WEBHOOK_PROCESS_VIDEO,
    N8N_WEBHOOK_PROCESS_SCRIPT,
    SUPADATA_API_KEY,
    GOOGLE_CLIENT_ID,
    GOOGLE_API_KEY,
    resetAll,
    downloadImage: handleDownloadImage,
    saveToDrive: handleSaveToDrive,
    batchSaveToDrive: handleBatchSaveToDrive,
    openRegenerateModal: handleOpenRegenerateModal,
    regenerateContent: handleRegenerateContent,
    saveAllLocally: handleSaveAllLocally,
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <img
           className="bg-white rounded-2xl shadow-lg mb-6 h-52 w-full object-cover"
           src='/header.jpg'
           />
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Let's Draw Content Generator
            </h1>
            <p className="text-blue-600 text-sm">
              Proprietary AI Generated Content Platform
            </p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center max-w-4xl w-full">
                {['Channels', 'Selection', 'Processing', 'Results'].map((label, index) => {
                  const stepKey = label.toLowerCase();
                  const isActive = step === stepKey;
                  const isPast = ['channels', 'selection', 'processing', 'results'].indexOf(step) > index;
                  
                  return (
                    <div key={label} className="flex items-center flex-1">
                      <div className="flex items-center justify-center w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                          ${isActive ? 'bg-blue-600 text-white scale-110' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {isPast ? <Check className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={`ml-2 font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-500'}`}>
                          {label}
                        </span>
                      </div>
                      {index < 3 && (
                        <div className={`flex-1 h-1 mx-4 rounded ${isPast ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step Components */}
          {step === 'channels' && <ChannelInput {...sharedProps} />}
          {step === 'selection' && <VideoSelection {...sharedProps} />}
          {step === 'processing' && <ProcessingView {...sharedProps} />}
          {step === 'results' && <ResultsView {...sharedProps} />}

          {/* Modals */}
          {showTypeModal && <TypeSelectionModal {...sharedProps} />}
          {showRegenerateModal && <RegenerateModal {...sharedProps} regenerateContent={handleRegenerateContent} />}
        </div>
      </div>
    </div>
  );
};

export default YouTubeChannelProcessor;