import { useState, useEffect } from 'react'; 
import { 
  Play, Loader2, AlertCircle, Eye, Clock, Image, FileText, 
  CheckCircle, Save, ExternalLink, Plus, X, RefreshCw,
  ChevronDown, ChevronUp, Trash2, Check, Search, Link2, Download
} from 'lucide-react';

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
    type: 'image' // 'image', 'script'
  });
  const [downloadingImages, setDownloadingImages] = useState({});
  const [activeImageTab, setActiveImageTab] = useState({}); 
  const [savingToDrive, setSavingToDrive] = useState({}); 
  const [batchSavingToDrive, setBatchSavingToDrive] = useState(false); 
  
  // Environment variables
  const N8N_WEBHOOK_FETCH = import.meta.env.VITE_APP_N8N_WEBHOOK_FETCH;   
  const N8N_WEBHOOK_PROCESS_VIDEO = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS_VIDEO;
  const N8N_WEBHOOK_PROCESS_SCRIPT = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS_SCRIPT;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_DRIVE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;

  // Content types - Content removed as requested, will be added separately
  const contentTypes = [
    {
      id: 'LDL',
      name: 'LDL - Draw and Learn',
      icon: '📚',
      description: 'Educational drawing & learning content',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgLight: 'bg-blue-50',
      imagePrompt: `Create a vibrant cartoon-style educational coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold black outlines (2-3px), flat vector shapes, friendly cartoon aesthetic. Clean, uncluttered composition with rounded, simple forms. No gradients or textures.

Color & Contrast: Limited palette of 4-6 harmonious colors plus black outlines. Vivid yet soft child-safe tones with high contrast between areas. Main subject uses warmer colors (60% visual weight), background uses softer tones (40%).

Layout: Main subject centered, occupying 60-70% of canvas. Large, readable shapes that work at thumbnail size. Minimal background with simple patterns or soft shapes. Generous white space for balance.

Educational Content: Based on {TITLE}, must visually teach a clear learning concept (letters, numbers, shapes, colors, counting, etc.). Include visual teaching cues and props. Use positive, smiling characters in safe, age-appropriate scenes. One clear learning focus per image.

Technical: Print-ready quality, scalable edges, strong contrast for line-art conversion. Works with crayons, markers, or digital coloring. No text unless explicitly requested in title.`,
      scriptPrompt: `Write a 10-minute "Draw and Learn" YouTube script for kids aged 4-6. The video features a drawing and coloring segment of a popular kid-friendly topic.

GOAL: Teach something fun and simple while a character, animal, or object is being drawn and colored.

SCRIPT MUST INCLUDE:
- Total word count between 700 and 800 words this is critical make sure you are respecting it.
- Mention "drawing and coloring" 2-3 times (e.g., "It's so fun to draw and color this...")
- Do NOT describe the step-by-step drawing process
- Begin with a cheerful welcome
- Include a small story or pretend play moment
- Include simple facts or lessons about the topic
- Include 1 funny or surprising fact or number
- Include at least 2-3 engaging questions for the audience ("What color would YOU choose?")
- Tone must be cheerful, playful, and warm - like a Grade 1 teacher
- Use positive reinforcement throughout
- Use age-appropriate, clear and simple language for 4-6-year-olds grade 1
- Include 3 genuine, integrated CTA for subscribing at: inside the first 60 seconds, middle, and end

EXAMPLE FLOW:
[0:00-0:30] - Warm Welcome + What we're drawing today + Fun hook
[0:30-2:30] - Start talking about the topic while we draw/color
[2:30-4:00] - Include a mini story or pretend scene
[4:00-6:30] - Add a few facts + a surprising/funny moment
[6:30-8:30] - More fun details, wrap up the lesson
[8:30-10:00] - Final thoughts + recap + warm goodbye

EXTRA TIP:
Imagine it being read by a warm, fun narrator while we watch a hand drawing and coloring something bright and familiar!

IMPORTANT ADDITION :
- Do **not** include these instructions in the script text.
- Respect the prompt structure.
- Output only the script text.
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
      imagePrompt: `Create a Princess Peppa adventure coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold black outlines (2-3px), flat vector cartoon style with rounded, friendly shapes. Clean coloring-book aesthetic, no gradients or complex textures.

Color Strategy: 4-6 harmonious colors plus black outlines, vivid but soft tones. High contrast between adjacent areas. Main subject warmer/saturated colors (60% visual weight), background softer/desaturated (40%).

Composition: Main subject centered, occupying 60-70% of canvas. Large, identifiable shapes readable at thumbnail size. Minimal background with simple patterns or large soft shapes. Generous white space.

Princess Peppa Content: Based on {TITLE}, show child-appropriate princess adventure scene. Friendly, smiling expressions with playful, non-threatening action. Include recognizable simple props (crowns, balloons, castle elements). Avoid any scary or inappropriate elements.

Technical Requirements: Exactly 1920x1080px landscape, clean edges, high contrast for printing and line-art conversion. No text unless explicitly requested in title.`,
    scriptPrompt: `NARRATION STRUCTURE (Total word count between 700 and 800 words this is critical make sure you are respecting it)
- Voice-over only (no "how to draw")—your narration is like chatting with a friend about a fun show you both love.
- Grade 1 level language: simple, warm, playful, clear.
- Tone: casual, enthusiastic—like "Hey, did you see that part?!"

[Intro | 0:00-0:45]
Start with: "Hi friends it's Mia here! Welcome back to Let's Draw a Story, today..."
Mention what we're drawing: "Today we're drawing [character/scene] from [Episode Title]..."
Set up the tease: "I can't believe what happened in this video—let me tell you..."
CTA #1 – Subscribe: "If you love drawing and stories, hit Subscribe so you don't miss the next one!"

[Episode Tease | 0:45-3:00]
Summarize the setup of the episode leading to this moment.
Keep it light and fun, as if you’re telling a friend the gist.
Don’t spoil the ending—just enough context to build interest.

[Key Moment Teaser | 3:00-5:30]
Describe one exciting twist or funny beat from the episode.
Ask your audience: "What do you think [character] will do next?"
CTA #2 – Like: "If you think that's wild, give this video a big thumbs up!"

[Second Tease | 5:30-8:00]
Drop another tantalizing clue—a second twist or hint.
Build anticipation: “But that’s not all…”
Keep it conversational, as if leaning in to spill the next secret.

[Soft Reveal + Call-Out | 8:00-9:30]
Reveal just enough: "Here's the fun part I can share..."
Tie back to the drawing: “And that’s exactly what inspired this picture!”
CTA #3 – Watch the full episode
“To see what really happens next, check the link in the description and go watch [Episode Title]!”

[Closing | 9:30-10:00]
Recap briefly: “Today we sketched [scene] and teased [big twist].”
Invite them back: “Can’t wait to draw with you again!”
CTA #4 – Subscribe / Watch:
“Don’t forget to subscribe—and click that episode link below. See you next time on Let’s Draw a Story!”

IMPORTANT ADDITION :
- Keep the Grade-1 language and voice-over style.
- Do **not** include these instructions in the script text.
- Respect the prompt structure.
- Output only the script text.
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
      imagePrompt: `Create a story-based cartoon coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold black outlines (2-3px), flat rounded shapes, clean uncluttered layout. Cartoon coloring-book aesthetic without gradients or photorealism.

Color Strategy: 4-6 harmonious colors plus black outlines. Vivid yet soft tones with strong contrast between adjacent areas. Main subject warmer/saturated (60% visual weight), background softer/desaturated (40%).

Composition: Main subject occupies 60-70% of canvas, centered or slightly offset. Large, simple shapes readable at thumbnail scale. Minimal background elements that support the story context.

Story Content: Based on {TITLE}, illustrate one clear story moment or scene. Include 1-2 narrative clues (props or action poses) so children can infer and continue the story. Positive, expressive faces avoiding ambiguous or frightening expressions. Clear focal point emphasizing the story beat.

Technical: Exactly 1920x1080px, print-ready with clean line-art. High contrast for coloring clarity. No text unless title requests it.`,
      scriptPrompt: `NARRATION STRUCTURE (Total word count between 700 and 800 words this is critical make sure you are respecting it)
- Voice-over only (no "how to draw")—your narration is like chatting with a friend about a fun show you both love.
- Grade 1 level language: simple, warm, playful, clear.
- Tone: casual, enthusiastic—like "Hey, did you see that part?!"

[Intro | 0:00-0:45]
Start with: "Hi friends it's Mia here! Welcome back to Let's Draw a Story, today..."
Mention what we're drawing: "Today we're drawing [character/scene] from [Episode Title]..."
Set up the tease: "I can't believe what happened in this video—let me tell you..."
CTA #1 – Subscribe: "If you love drawing and stories, hit Subscribe so you don't miss the next one!"

[Episode Tease | 0:45-3:00]
Summarize the setup of the episode leading to this moment.
Keep it light and fun, as if you’re telling a friend the gist.
Don’t spoil the ending—just enough context to build interest.

[Key Moment Teaser | 3:00-5:30]
Describe one exciting twist or funny beat from the episode.
Ask your audience: "What do you think [character] will do next?"
CTA #2 – Like: "If you think that's wild, give this video a big thumbs up!"

[Second Tease | 5:30-8:00]
Drop another tantalizing clue—a second twist or hint.
Build anticipation: “But that’s not all…”
Keep it conversational, as if leaning in to spill the next secret.

[Soft Reveal + Call-Out | 8:00-9:30]
Reveal just enough: "Here's the fun part I can share..."
Tie back to the drawing: “And that’s exactly what inspired this picture!”
CTA #3 – Watch the full episode
“To see what really happens next, check the link in the description and go watch [Episode Title]!”

[Closing | 9:30-10:00]
Recap briefly: “Today we sketched [scene] and teased [big twist].”
Invite them back: “Can’t wait to draw with you again!”
CTA #4 – Subscribe / Watch:
“Don’t forget to subscribe—and click that episode link below. See you next time on Let’s Draw a Story!”

IMPORTANT ADDITION :
- Keep the Grade-1 language and voice-over style.
- Do **not** include these instructions in the script text.
- Respect the prompt structure.
- Output only the script text.
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
      imagePrompt: `Create a YouTuber-inspired cartoon coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold black outlines (2-3px), flat simple shapes, friendly cartoon aesthetic. Stylized, child-appropriate design avoiding photographic texture.

Color Strategy: 4-6 harmonious colors plus black outlines. Soft, readable tones with high contrast for easy coloring clarity.

Composition: Main subject 60-70% of canvas, centered or slightly offset. Clean background with minimal supporting elements.

YouTuber Content: Based on {TITLE}, depict child-friendly, stylized character doing harmless activity (gaming, drawing, holding props). Emphasize friendly expression and simplified, non-realistic features appropriate for kids. Respectful depiction suitable for children, avoiding controversial content.

Technical: Exactly 1920x1080px, clean edges, high contrast for printing. No text unless explicitly requested in title.`,
      scriptPrompt: `Read the transcript for [VIDEO TITLE] (link: [VIDEO URL]) and write a 700–800-word voiceover script for a drawing & coloring video on Let’s Draw Youtubers, suitable for 6-year-olds. Don’t describe how to draw—focus on the story. Structure and requirements:
1. Intro (0:00-0:45)
Begin: "Hi friends, it's Mia here! Welcome back to Let's Draw Youtubers. Today we're drawing [WHAT WE'RE DRAWING]—and you can find the video link in the description below!"
Point out a fun or mysterious detail in the drawing or video transcript
CTA #1 – Subscribe: "If you love drawing and fun stories, hit Subscribe so you don't miss our next video!"

2. Story Setup (0:45-3:00)
Introduce the main idea or problem that leads to the drawing moment using simple, warm, playful language.
Keep sentences short and clear.

3. First Twist or Guess (3:00-5:30)
Add a funny misunderstanding or surprise.
Ask the audience a simple question (“What do you think happened next?”).  
✅ CTA #2 – Like: “If you think that’s what really happened, give this video a big thumbs up!”

4. Second Twist or Clue (5:30-8:00)
Introduce a second surprise that builds toward the drawing moment.
Show how things begin to make sense.

5. Reveal + Resolution (8:00-9:30)
Explain what actually happened and how it led to the drawing moment.
Add a sweet or silly ending line: “And that’s the story of how this drawing happened!”

6. Closing (9:30-10:00)
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #3 – Subscribe: “If you love fun challenges and art, hit Subscribe so you don’t miss our next video on Let’s Draw Youtuberst!”
Add one final warm goodbye.

Tone & Style
  - Grade-1 level language: simple, clear, playful, warm.
  - Total word count between 700 and 800 words this is critical make sure you are respecting it.
  - Include three CTAs at specified points.
  - Mention “video link in the description” in the intro.

IMPORTANT ADDITION :
- Maintain the three CTAs at their spots.
- Do **not** include these instructions in the script text.
- Respect the prompt structure.
- Output only the script text.
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
      imagePrompt: `Create a Mr Beast challenge cartoon coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold outlines (2-3px), flat rounded shapes, playful cartoon aesthetic. Clean composition avoiding photorealism.

Color Strategy: 4-6 harmonious colors plus black outlines, vivid but soft tones with high contrast.

Composition: Main subject occupies 60-70% of canvas, clearly centered. Minimal background with large simple shapes suggesting challenge environment.

Mr Beast Challenge Content: Based on {TITLE}, represent kid-safe, simplified challenge scene (team games, treasure hunt, friendly obstacle course). Show smiling participants, friendly competition, clear non-dangerous props (flags, cones, foam objects). Avoid realistic stunts or anything encouraging risky behavior. Stylized, child-appropriate depiction.

Technical: Exactly 1920x1080px, high-contrast, print-ready line art. No text unless requested.`,
      scriptPrompt: `Read the transcript for [VIDEO TITLE] (link: [VIDEO URL]) and write a 700–800-word voiceover script for a drawing & coloring video on Let’s Draw Mr Beast, suitable for 6-year-olds. Don’t describe how to draw—focus on the story. Structure and requirements:

1. Intro (0:00-0:45)
Begin: "Hi friends, it's Mia here! Welcome back to Let's Draw Mr Beast. Today we're drawing [WHAT WE'RE DRAWING]—and you can find the Mr Beast video link in the description below!"
Point out a fun or mysterious detail in the drawing.
CTA #1 – Subscribe: "If you love drawing and fun stories, hit Subscribe so you don't miss our next video!"

2. Story Setup (0:45-3:00)
Introduce the main idea or problem that leads to the drawing moment using simple, warm, playful language.
Keep sentences short and clear.

3. First Twist or Guess (3:00-5:30)
Add a funny misunderstanding or surprise.
Ask the audience a simple question (“What do you think happened next?”).
✅ CTA #2 – Like: “If you think that’s what really happened, give this video a big thumbs up!”

4. Second Twist or Clue (5:30-8:00)
Introduce a second surprise or clue that builds toward the drawing moment.
Show how things begin to make sense.

5. Reveal + Resolution (8:00-9:30)
Explain what actually happened and how it led to the drawing moment.
Add a sweet or silly ending line: “And that’s the story of how this drawing happened!”

6. Closing (9:30-10:00)
Recap: “Today we drew [WHAT WE DREW] and learned [KEY LESSON].”
✅ CTA #3 – Subscribe: “If you love fun adventures and art, hit Subscribe so you don’t miss our next video on Let’s Draw Mr Beast!”
Add one final warm goodbye.

Tone & Style
  - Grade-1 level language: simple, clear, playful, warm.
  - Total word count between 700 and 800 words this is critical make sure you are respecting it.
  - Include three CTAs at specified points.
  - Mention “video link in the description” in the intro.

IMPORTANT ADDITION :
- Maintain the three CTAs at their spots.
- Do **not** include these instructions in the script text.
- Respect the prompt structure.
- Output only the script text.
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
      imagePrompt: `Create a musical cartoon coloring page at 1920x1080 pixels (landscape) for children aged 4-8.

Visual Style: Bold line art (2-3px), flat shapes, rounded friendly forms. Cartoon coloring-book aesthetic avoiding gradients and photographic detail.

Color Strategy: 4-6 harmonious colors plus black outlines, vivid but soothing tones with strong contrast.

Composition: Main subject centered, occupying 60-70% of canvas with large readable shapes. Background may include simple musical motifs (notes, waves, instruments) as large, easy-to-color shapes.

Musical Content: Based on {TITLE}, depict cheerful, child-appropriate musical scene (singing animals, kids with instruments, dancing musical elements). Emphasize joyful expressions, clear oversized simple props (guitar, drum, microphone). Avoid crowded scenes, keep elements large with easy-to-fill color areas.

Technical: Exactly 1920x1080px, clean edges, high contrast for printing and line-art conversion. No text unless title explicitly requests it.`,
      scriptPrompt: `SUNO CHILDREN'S DRAWING SONG - PROMPT TEMPLATE

Title: Let's Draw [Character or Object Name]
Genre: Children's Pop / Educational
Mood: [Joyful, Magical, Calm, Playful]
Tempo: 100 BPM (adjust to 90-120 depending on energy)
Key: C Major (or G/F Major - good for kids)
Duration: ~4 minutes
Vocal Style: Female voice, cheerful and warm - like a friendly cartoon teacher. Includes spoken intro + singing verses.
Visual Reference (optional but helpful):
Describe the character, setting, and what the audience sees while listening (e.g. a smiling cartoon moon surrounded by clouds).

Prompt Body:
A playful and educational kids’ drawing-and-sing-along song, hosted by a cheerful character named Mia. She welcomes children at the start and guides them through drawing a fun object (like a star or rainbow) using simple steps and rhyming lyrics. The music features cheerful piano, light percussion, and sparkly effects. The lyrics encourage creativity and use repetition for easy follow-along. Target age: 3–7 years old.

Lyrics:
🎤 [Intro – Spoken | 0:00–0:25]
 Hi friends, it’s Mia here! Welcome back to Let’s Draw a Song!
 Today we’re drawing a [friendly/silly/cute] [object name] from the classic nursery rhyme “[SONG TITLE]!”
 This song is all about [X & Y – e.g. shapes and sparkle] — and I can’t wait to show you why this [object] is so fun to draw.
 Grab your crayons and paper — let’s draw together!
 If you love drawing and singing, hit Subscribe so you don’t miss the next one!
 Did you know “[SONG TITLE]” was first published in [YEAR]? That’s over [N] years ago, and it’s still a favorite today!
 🎶 Alright — here comes “[SONG TITLE]!” Let’s draw and sing together!
🎵 [Verse 1]
 Let’s draw [OBJECT NAME] big and bright,
 Start with shapes that feel just right!
 Draw a [shape detail], then one more,
 You’re doing great — let’s add some more!
 Line by line, nice and slow,
 Watch our drawing start to grow!
🎵 [Chorus]
 [SONG TITLE], let’s draw and sing,
 See what joy a shape can bring!
 Colors swirling, bright and fun,
 Drawing stars for everyone!
 Twinkle, sparkle, near and far,
 Now we’ve made our shining star!
🎵 [Verse 2]
 Add some arms or shiny glow,
 Dots and lines in rows that flow.
 Maybe give it smiling eyes,
 Make it wave up in the skies!
 With each step, your drawing grows,
 Imagination always shows!
🎵 [Chorus] (repeat with variation)
🎵 [Bridge]
 Gold or purple, red or blue,
 Any color works for you!
 Fill it in with crayon cheer,
 Happy artists drawing here!
 Drawing’s fun for all to do,
 And we love to sing with you!
🎵 [Outro Verse]
 Now we’re done — give a cheer,
 You made magic, loud and clear!
 Wave hello to what you drew,
 It’s a star made just by you!
 Let’s keep drawing, don’t delay —
 We’ll be back another day!
🎵 [Final Chorus]
 [SONG TITLE], shine so bright,
 Thanks for drawing light tonight!
 Grab your crayons, sing once more,
 We’ve got lots of fun in store!
 [SONG TITLE], you’re our guide — 
 Let’s keep drawing side by side!

Arrangement Tips:
  - Use cheerful piano as main rhythm
  - Add glockenspiel, triangle, or sparkle sounds on "twinkle"/"shine" lines
  - Keep tempo steady for step-by-step drawing sync
  - Support melody with soft bass or ukulele if needed
  - Chorus can repeat with light variation in lyrics for memory building
  - Total word count between 700 and 800 words this is critical make sure you are respecting it.

IMPORTANT ADDITION :
- Total word count between 700 and 800 words this is critical make sure you are respecting it.
- Keep the song structure and the spoken intro; ensure language is simple and suitable for 3–7 year olds.
- Do **not** include these instructions in the lyrics or script text.
- Respect the prompt structure.
- Output only the script text.
`
    }
  ];

  // Regeneration Functions
  const openRegenerateModal = (video, regenerationType = 'image') => {
    setRegenerateConfig({ 
      video, 
      additionalInstructions: '', 
      type: regenerationType 
    });
    setShowRegenerateModal(true);
  };

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
            
            // KEY MODIFICATION: Mark as needing re-save and track what was regenerated
            updatedVideo.lastRegenerated = new Date().toISOString();
            updatedVideo.lastRegeneratedType = type;
            updatedVideo.needsResave = true; // New flag to indicate content needs re-saving
            updatedVideo.regeneratedContent = type; // Track what type of content was regenerated
            
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

  // Extract Channel ID from URL
  const extractChannelId = (url) => {
    if (url.includes('youtube.com/channel/')) {
      return url.split('channel/')[1].split(/[?&/]/)[0];
    } else if (url.includes('youtube.com/c/')) {
      return url;
    } else if (url.includes('youtube.com/@')) {
      return url;
    } else if (url.includes('youtube.com/user/')) {
      return url;
    } else if (url.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return url;
    }
    return url;
  };

  // Channel Management Functions
  const addChannelInput = () => {
    setChannelUrls([...channelUrls, '']);
  };

  const removeChannelInput = (index) => {
    const newChannelUrls = channelUrls.filter((_, i) => i !== index);
    setChannelUrls(newChannelUrls.length > 0 ? newChannelUrls : ['']);
  };

  const updateChannelUrl = (index, value) => {
    const newChannelUrls = [...channelUrls];
    newChannelUrls[index] = value;
    setChannelUrls(newChannelUrls);
  };

  const validateChannelUrls = () => {
    const validUrls = channelUrls.filter(url => url.trim());
    const uniqueUrls = [...new Set(validUrls.map(url => url.trim()))];
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid YouTube Channel URL');
      return false;
    }
    
    if (uniqueUrls.length !== validUrls.length) {
      setError('Duplicate channel URLs detected. Please remove duplicates.');
      return false;
    }
    
    return uniqueUrls;
  };

  const fetchAllChannels = async () => {
    const uniqueUrls = validateChannelUrls();
    if (!uniqueUrls) return;

    setError('');
    const newChannelsData = {};

    for (const channelUrl of uniqueUrls) {
      const channelIdentifier = extractChannelId(channelUrl);
      setLoading(prev => ({ ...prev, [channelIdentifier]: true }));
      
      try {
        // Updated to use N8N_WEBHOOK_FETCH
        const response = await fetch(N8N_WEBHOOK_FETCH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelUrl: channelUrl })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.success && data.videos && data.videos.length > 0) {
          newChannelsData[channelIdentifier] = {
            channelUrl,
            channelId: channelIdentifier,
            videos: data.videos,
            fetchedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error(`Failed to fetch channel ${channelUrl}:`, err);
        newChannelsData[channelIdentifier] = {
          channelUrl,
          channelId: channelIdentifier,
          error: err.message,
          videos: []
        };
      } finally {
        setLoading(prev => ({ ...prev, [channelIdentifier]: false }));
      }
    }

    setChannelsData(newChannelsData);
    if (Object.values(newChannelsData).some(channel => channel.videos?.length > 0)) {
      setStep('selection');
    }
  };

  // Video Selection Functions
  const handleVideoSelect = (video, channelId) => {
    setCurrentVideoForType({ ...video, channelId });
    setShowTypeModal(true);
  };

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

  const removeSelectedVideo = (uniqueId) => {
    setSelectedVideos(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  const deleteProcessedVideo = (uniqueId) => {
    setProcessedResults(prev => prev.filter(v => v.uniqueId !== uniqueId));
  };

  // Updated Processing Function to use both video and script endpoints
  const processAllVideos = async () => {
    if (selectedVideos.length === 0) {
      setError('Please select at least one video to process');
      return;
    }

    setStep('processing');
    setProcessingQueue([...selectedVideos]);
    setProcessedResults([]);

    for (const video of selectedVideos) {
      try {
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'processing' } : v
        ));

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

        // Step 1: Process images using N8N_WEBHOOK_PROCESS_VIDEO
        const imageResponse = await fetch(N8N_WEBHOOK_PROCESS_VIDEO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedPrompt: video.selectedPrompt,
          }),
          signal: controller.signal
        });

        if (!imageResponse.ok) throw new Error(`Image processing failed! status: ${imageResponse.status}`);
        
        const imageResult = await imageResponse.json();

        // Step 2: Process script using N8N_WEBHOOK_PROCESS_SCRIPT
        const scriptResponse = await fetch(N8N_WEBHOOK_PROCESS_SCRIPT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedScriptPrompt: video.selectedScriptPrompt
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!scriptResponse.ok) throw new Error(`Script processing failed! status: ${scriptResponse.status}`);
        
        const scriptResult = await scriptResponse.json();

        // Combine both results
        if (imageResult.success && scriptResult.success && imageResult.data && scriptResult.data) {
          const processedVideo = {
            ...video,
            result: {
              generatedContent: {
                images: imageResult.data.generatedContent?.images || null,
                script: scriptResult.data.generatedContent?.script || null
              },
              processingInfo: {
                ...imageResult.data.processingInfo,
                scriptProcessing: scriptResult.data.processingInfo
              },
              video: imageResult.data.video || {
                title: video.title,
                id: video.id,
                type: video.selectedType
              }
            },
            status: 'completed',
            processedAt: new Date().toISOString()
          };
                    
          setProcessedResults(prev => [...prev, processedVideo]);
          setProcessingQueue(prev => prev.map(v => 
            v.uniqueId === video.uniqueId ? { ...v, status: 'completed' } : v
          ));
        } else {
          throw new Error('Failed to process video - invalid response structure from one or both services');
        }
      } catch (err) {
        console.error(`Failed to process video ${video.title}:`, err);
        
        let errorMessage = err.message;
        if (err.name === 'AbortError') {
          errorMessage = 'Processing timeout (10 minutes) - the workflow may still be running in the background';
        }
        
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'error', error: errorMessage } : v
        ));
        
        // Add to processed results even with error for visibility
        setProcessedResults(prev => [...prev, {
          ...video,
          status: 'error',
          error: errorMessage,
          processedAt: new Date().toISOString()
        }]);
      }
    }

    setStep('results');
  };

  // Download image function
  const downloadImage = async (base64Data, filename) => {
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
  const saveToDrive = async (video, isResave = false) => {
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
  const batchSaveToDrive = async () => {
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

  // Utility Functions
  const formatViewCount = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views?.toString() || '0';
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetAll = () => {
    setChannelUrls(['']);
    setChannelsData({});
    setSelectedVideos([]);
    setProcessingQueue([]);
    setProcessedResults([]);
    setError('');
    setStep('channels');
  }; 

  // Modern Image Slider Component
  const ImageSlider = ({ video, result, regeneratingItems }) => {
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

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Generated Images
          </h4>
          <button
            onClick={() => openRegenerateModal(video, 'image')}
            disabled={regeneratingItems[`${video.uniqueId}_image`]}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            title="Regenerate Images Only"
          >
            {regeneratingItems[`${video.uniqueId}_image`] ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Image className="w-4 h-4 mr-1" />
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
                    onClick={() => downloadImage(
                      image.base64,
                      `${video.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30)}_${image.id}.png`
                    )}
                    disabled={downloadingImages[`${video.title}_${image.id}.png`]}
                    className={`flex items-center px-4 py-2 bg-gradient-to-r ${image.gradient} text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {downloadingImages[`${video.title}_${image.id}.png`] ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
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

  const DriveSaveButton = ({ video, isIndividual = true }) => {
    const videoId = video.uniqueId;
    const isLoading = isIndividual ? savingToDrive[videoId] : batchSavingToDrive;
    const isSaved = video.savedToDrive;
    const needsResave = video.needsResave || video.hasUnsavedChanges;

    // Show re-save button if content was regenerated after being saved
    if (isSaved && needsResave) {
      return (
        <div className="flex flex-col space-y-2">
          {/* Status indicator */}
          <div className="flex items-center justify-center bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">
              {video.regeneratedContent === 'image' ? 'Images' : 'Script'} Updated - Re-save Available
            </span>
          </div>
          
          {/* Re-save button */}
          <button
            onClick={() => isIndividual ? saveToDrive(video, true) : batchSaveToDrive()}
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
                <RefreshCw className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {isIndividual ? 'Re-save to Drive' : `Re-save Updated (${processedResults.filter(v => v.needsResave || v.hasUnsavedChanges).length})`}
                </span>
              </>
            )}
          </button>

          {/* Original folder link */}
          {video.driveFolder && (
            <div className="flex items-center justify-center bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Original in Drive</span>
              <a
                href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
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
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">Saved to Drive</span>
          {video.driveFolder && (
            <a
              href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
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
        onClick={() => isIndividual ? saveToDrive(video, false) : batchSaveToDrive()}
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
            {/* <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-20 rounded-xl animate-pulse" /> */}
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            <span className="font-medium">
              {isIndividual ? 'Save to Drive' : `Save All (${processedResults.filter(v => !v.savedToDrive).length})`}
            </span>
          </>
        )}
      </button>
    );
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              YouTube Content Generator
            </h1>
            <p className="text-gray-600">
              Generate coloring images with scripts from YouTube videos
            </p>
            <p className="text-sm text-blue-600 mt-1">
              ✨ Integrated with N8N Workflows
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

          {/* Step 1: Channel Input */}
          {step === 'channels' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center">
                <Link2 className="w-6 h-6 mr-3 text-blue-600" />
                Enter YouTube Channel URLs
              </h2>
              
              <div className="space-y-4 mb-6 max-w-2xl mx-auto">
                {channelUrls.map((channelUrl, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={channelUrl}
                        onChange={(e) => updateChannelUrl(index, e.target.value)}
                        placeholder="e.g., https://youtube.com/@channelname or https://youtube.com/channel/UCxxxxxx"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        disabled={loading[extractChannelId(channelUrl)]}
                      />
                    </div>
                    {channelUrls.length > 1 && (
                      <button
                        onClick={() => removeChannelInput(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {loading[extractChannelId(channelUrl)] && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={addChannelInput}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Channel
                </button>
                
                <button
                  onClick={fetchAllChannels}
                  disabled={Object.values(loading).some(l => l)}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.values(loading).some(l => l) ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Fetching Videos...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Fetch All Channels
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Video Selection */}
          {step === 'selection' && (
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Select Videos to Process</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('channels')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={processAllVideos}
                      disabled={selectedVideos.length === 0}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Process {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>

                {/* Selected Videos Summary */}
                {selectedVideos.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Selected Videos:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideos.map((video) => (
                        <div key={video.uniqueId} className="bg-white rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm">
                          <span className="text-xl">{video.typeIcon}</span>
                          <span className="text-sm font-medium text-gray-700 max-w-xs truncate">{video.title}</span>
                          <button
                            onClick={() => removeSelectedVideo(video.uniqueId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Channel Videos */}
              {Object.entries(channelsData).map(([channelId, channelData]) => (
                <div key={channelId} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Channel: {channelData.channelUrl}
                    {channelData.error && (
                      <span className="ml-3 text-sm text-red-500">Error: {channelData.error}</span>
                    )}
                  </h3>
                  {channelData.videos.length > 0 &&
                    <p className="text-gray-600 mb-4">
                      {`${channelData.videos.length} videos found`}
                    </p>
                  }
                  {channelData.videos && channelData.videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {channelData.videos.map((video) => {
                        const isSelected = selectedVideos.some(v => v.id === video.id && v.channelId === channelId);
                        
                        return (
                          <div key={video.id} className={`border-2 rounded-lg p-4 transition-all hover:shadow-md
                            ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <div className="flex space-x-4">
                              <img
                                src={video.thumbnail || '/api/placeholder/120/90'}
                                alt={video.title}
                                className="w-32 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{video.title}</h4>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {formatViewCount(video.viewCount)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDuration(video.duration)}
                                  </span>
                                  <span className="text-blue-600 font-semibold">
                                    VPH: {video.vph}
                                  </span>
                                </div>
                                {!isSelected ? (
                                  <button
                                    onClick={() => handleVideoSelect(video, channelId)}
                                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Select Type
                                  </button>
                                ) : (
                                  <div className="flex items-center text-green-600 font-medium text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No videos found for this channel</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Type Selection Modal */}
          {showTypeModal && (
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
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
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
          )}

          {/* Step 4: Results */}
          {step === 'results' && (
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
                            <ImageSlider video={video} result={result} regeneratingItems={regeneratingItems}/>
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
                                  onClick={() => openRegenerateModal(video, 'script')}
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
                          <DriveSaveButton video={video} isIndividual={true} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Enhanced Regenerate Modal */}
          {showRegenerateModal && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeChannelProcessor;