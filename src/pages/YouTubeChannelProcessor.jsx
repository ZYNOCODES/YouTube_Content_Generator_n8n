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
    prompt: '', 
    type: 'image' // 'image', 'script'
  });
  const [downloadingImages, setDownloadingImages] = useState({});
  
  // Environment variables (replace with your actual webhook URLs)
  const N8N_WEBHOOK_FETCH = import.meta.env.VITE_APP_N8N_WEBHOOK_FETCH;
  const N8N_WEBHOOK_PROCESS = import.meta.env.VITE_APP_N8N_WEBHOOK_PROCESS;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_DRIVE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;
  const N8N_WEBHOOK_REGENERATE_IMAGE = import.meta.env.VITE_APP_N8N_WEBHOOK_REGENERATE_IMAGE;
  const N8N_WEBHOOK_REGENERATE_SCRIPT = import.meta.env.VITE_APP_N8N_WEBHOOK_REGENERATE_SCRIPT;

  // Updated content types to match workflow prompts
  const contentTypes = [
    {
      id: 'LDL',
      name: 'LDL - Draw and Learn',
      icon: '📚',
      description: 'Educational drawing & learning content',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgLight: 'bg-blue-50',
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
      imagePrompt: `Create a vibrant, fully colored cartoon-style illustration at exactly 1792x1024 px.
- Style: bold black outlines, simple rounded shapes, friendly character design suitable for children aged 4–6.
- Palette: limit to 3–5 harmonious main colors plus neutrals (avoid many different hues). Use vivid but soft tones so the image remains calm and readable.
- Color balance: ensure the main subject occupies ~60% visual weight with slightly warmer/more saturated colors; background ~40% with softer desaturated tones for contrast.
- Composition: main subject clearly centered or slightly offset, large and readable at thumbnail scale.
- Background: simple, minimal elements (large shapes, soft gradients, gentle patterns) so it doesn't compete with the subject.
- Lighting & texture: soft lighting, subtle textures only where helpful (paper/crayon/flat cell-shading).
- Accessibility: strong contrast between subject and background; avoid color pairings that are low-contrast for children.
- Script-aware: use the associated scriptPrompt's tone (cheerful/educational) to select mood colors — e.g., sunny yellows/sky blues for upbeat lessons; calm greens/soft purples for soothing topics.
- Constraints: do NOT place any on-image text unless the title explicitly requests it; avoid photographic detail; avoid more than 5 main colors.`,
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
    setRegenerateConfig({ video, prompt: '', type: regenerationType });
    setShowRegenerateModal(true);
  };

  const regenerateContent = async () => {
    const { video, prompt, type } = regenerateConfig;
    if (!video) return;

    const regenerateId = `${video.uniqueId}_${type}`;
    setRegeneratingItems(prev => ({ ...prev, [regenerateId]: true }));
    setShowRegenerateModal(false);

    try {
      let response;
      
      if (type === 'image') {
        // Find the content type for the enhanced prompt
        const contentType = contentTypes.find(ct => ct.id === video.selectedType);
        const enhancedPrompt = prompt ? 
          `${contentType.imagePrompt}\n\nAdditional instructions: ${prompt}` : 
          contentType.imagePrompt;

        response = await fetch(N8N_WEBHOOK_REGENERATE_IMAGE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoTitle: video.title,
            videoId: video.id,
            selectedType: video.selectedType,
            imagePrompt: enhancedPrompt,
            originalVideo: video
          })
        });
      } else if (type === 'script') {
        // Find the content type for the script prompt
        const contentType = contentTypes.find(ct => ct.id === video.selectedType);
        const scriptContent = video.result.generatedContent.script.content;

        //regeneration based on prev scriptContent
        const fullScriptPrompt = prompt ? 
          `${scriptContent}\n\nAdditional instructions: ${prompt}\n\nVideo Title: ${video.title}\n\nRespect the base prompt structure: ${contentType.scriptPrompt}` : 
          `Refine the following script:\n\n${scriptContent}\n\nVideo Title: ${video.title}\n\nRespect the base prompt structure: ${contentType.scriptPrompt}`;

        response = await fetch(N8N_WEBHOOK_REGENERATE_SCRIPT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoTitle: video.title,
            videoId: video.id,
            selectedType: video.selectedType,
            scriptPrompt: fullScriptPrompt,
            originalVideo: video
          })
        });
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success) {
        setProcessedResults(prev => prev.map(v => {
          if (v.uniqueId === video.uniqueId) {
            const updatedVideo = { ...v };
            
            if (type === 'image' && result.data?.generatedContent?.image) {
              updatedVideo.result.generatedContent.image = result.data.generatedContent.image;
            } else if (type === 'script' && result.data?.generatedContent?.script) {
              updatedVideo.result.generatedContent.script = result.data.generatedContent.script;
            }
            
            updatedVideo.lastRegenerated = new Date().toISOString();
            updatedVideo.lastRegeneratedType = type;
            
            return updatedVideo;
          }
          return v;
        }));
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

  // Processing Functions
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

        const response = await fetch(N8N_WEBHOOK_PROCESS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVideo: video,
            selectedType: video.selectedType,
            selectedPrompt: video.selectedPrompt,
            selectedScriptPrompt: video.selectedScriptPrompt
          })
        }, {
          timeout: 300000, // 5 minutes timeout
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.success) {
          const processedVideo = {
            ...video,
            result: result.data,
            status: 'completed',
            processedAt: new Date().toISOString()
          };
          
          setProcessedResults(prev => [...prev, processedVideo]);
          setProcessingQueue(prev => prev.map(v => 
            v.uniqueId === video.uniqueId ? { ...v, status: 'completed' } : v
          ));
        } else {
          throw new Error(result.message || 'Failed to process video');
        }
      } catch (err) {
        console.error(`Failed to process video ${video.title}:`, err);
        setProcessingQueue(prev => prev.map(v => 
          v.uniqueId === video.uniqueId ? { ...v, status: 'error', error: err.message } : v
        ));
      }
    }

    setStep('results');
  };

  // Save to Drive Function
  const saveToDrive = async (video) => {
    if (!video.result || !isGapiLoaded) return;

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
      const folderName = `${new Date().toISOString().slice(0, 10)}_${video.selectedType}_${videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50)}`;
      
      // Create main folder
      const folder = await window.gapi.client.drive.files.create({
        resource: { 
          name: folderName, 
          mimeType: 'application/vnd.google-apps.folder' 
        }
      });
      
      const folderId = folder.result.id;

      // Save script as text file
      if (video.result?.generatedContent?.script?.content) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
          'name': 'Script.txt',
          'parents': [folderId],
          'mimeType': 'text/plain'
        };

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: text/plain\r\n\r\n' +
          video.result.generatedContent.script.content +
          close_delim;

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + tokenResponse.access_token,
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
          },
          body: multipartRequestBody
        });
      }

      // Save image URL as text file
      if (video.result?.generatedContent?.image?.url) {
        try {
          // Download the image
          const imageResponse = await fetch(video.result.generatedContent.image.url, {
            method: "GET",
            mode: 'cors', // Explicitly set CORS mode
            cache: 'no-cache',
            headers: {
              'Accept': 'image/png,image/jpeg,image/*,*/*'
            }
          });
          
          if (!imageResponse.ok) throw new Error('Failed to download image');
          const imageBlob = await imageResponse.blob();
          
          // Prepare metadata
          const metadata = {
            'name': 'Image.png',
            'parents': [folderId],
            'mimeType': 'image/png'
          };

          // Create FormData for multipart upload
          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', imageBlob, 'Image.png');

          // Upload to Google Drive
          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + tokenResponse.access_token,
            },
            body: formData
          });
        } catch (err) {
          console.error('Error saving image to Drive:', err);
          // Fallback to saving URL if image download fails
          const boundary = '-------314159265358979323846';
          const delimiter = "\r\n--" + boundary + "\r\n";
          const close_delim = "\r\n--" + boundary + "--";

          const metadata = {
            'name': 'image_url.txt',
            'parents': [folderId],
            'mimeType': 'text/plain'
          };

          const imageInfo = `Image URL: ${video.result.generatedContent.image.url}`;

          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/plain\r\n\r\n' +
            imageInfo +
            close_delim;

          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + tokenResponse.access_token,
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            body: multipartRequestBody
          });
        }
      }

      setProcessedResults(prev => prev.map(v => {
        if (v.uniqueId === video.uniqueId) {
          return { ...v, savedToDrive: true, driveFolder: folderId };
        }
        return v;
      }));

    } catch (error) {
      console.error('Error saving to Drive:', error);
      setError(`Failed to save to Drive: ${error.message}`);
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
            {/* <p className="text-sm text-blue-600 mt-1">
              ✨ Now with separate image and script regeneration
            </p> */}
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
                      <p className="text-xs text-gray-500 italic line-clamp-2">{type.prompt}</p>
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
                          {/* Separate regeneration buttons */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openRegenerateModal(video, 'image')}
                              disabled={regeneratingItems[`${video.uniqueId}_image`]}
                              className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                              title="Regenerate Image Only"
                            >
                              {regeneratingItems[`${video.uniqueId}_image`] ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Image className="w-4 h-4 mr-1" />
                              )}
                              Image
                            </button>
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
                          {result.generatedContent?.image && (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <Image className="w-5 h-5 mr-2" />
                                  Generated Images
                                </h4>
                              </div>
                              
                              {/* Colored Image */}
                              {result.generatedContent.image.url && (
                                <div className="mb-4">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    🎨 Colored Version
                                  </h5>
                                  <div className="relative">
                                    <img
                                      src={result.generatedContent.image?.url}
                                      alt="Colored image"
                                      className="w-full rounded-lg border-2 border-gray-200 shadow-md"
                                    />
                                    <button
                                      onClick={() => {
                                        // Download from URL
                                        const link = document.createElement('a');
                                        link.href = result.generatedContent.image.url;
                                        link.target = '_blank';
                                        link.rel = 'noopener noreferrer';
                                        link.download = `${video.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30)}_colored_image.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      disabled={downloadingImages[`colored_image.png_${Date.now()}`]}
                                      className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download Colored
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Generated Script */}
                          {result.generatedContent?.script?.content && (
                            <div>
                              <h4 className="font-semibold text-gray-900 flex items-center mb-4">
                                <FileText className="w-5 h-5 mr-2" />
                                Script ({result.generatedContent.script.wordCount || 'N/A'} words)
                              </h4>
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
                          {!video.savedToDrive ? (
                            <button
                              onClick={() => saveToDrive(video)}
                              disabled={!isGapiLoaded}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                              <Save className="w-5 h-5 mr-2" />
                              Save to Google Drive
                            </button>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Saved to Drive</span>
                              {video.driveFolder && (
                                <a
                                  href={`https://drive.google.com/drive/folders/${video.driveFolder}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-3 flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Open Folder
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Batch Save Option */}
              {processedResults.length > 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Batch Operations</h3>
                      <p className="text-sm text-gray-600">Save all generated content to Google Drive</p>
                    </div>
                    <button
                      onClick={() => processedResults.forEach(video => !video.savedToDrive && saveToDrive(video))}
                      disabled={!isGapiLoaded || processedResults.every(v => v.savedToDrive)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save All to Drive
                    </button>
                  </div>
                </div>
              )}
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
                        Regenerate {regenerateConfig.type === 'image' ? 'Image' : 'Script'}
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
                      value={regenerateConfig.prompt}
                      onChange={(e) => setRegenerateConfig(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder={regenerateConfig.type === 'image' ? 
                        `Add specific instructions for image regeneration...
                    Examples:
                    - Make the outlines bolder
                    - Add more vibrant colors
                    - Include specific elements from the video
                    - Adjust the composition` :
                        `Add specific instructions for script regeneration...
                    Examples:
                    - Add more educational content
                    - Include a specific lesson
                    - Make it more interactive
                    - Focus on a particular age group`}
                      className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      {regenerateConfig.type === 'image' ? <Image className="w-4 h-4 mr-2 text-purple-600" /> :
                       regenerateConfig.type === 'script' ? <FileText className="w-4 h-4 mr-2 text-orange-600" /> :
                       <RefreshCw className="w-4 h-4 mr-2 text-blue-600" />}
                      Current Settings
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Type:</span> {regenerateConfig.video?.typeName}</p>
                      <p><span className="font-medium">Regenerating:</span> {
                        regenerateConfig.type === 'image' ? 'Image Only' : 'Script Only'
                      }</p>
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
                        regenerateConfig.type === 'script' ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' :
                        'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {regenerateConfig.type === 'image' ? <Image className="w-4 h-4 mr-2" /> :
                       regenerateConfig.type === 'script' ? <FileText className="w-4 h-4 mr-2" /> :
                       <RefreshCw className="w-4 h-4 mr-2" />}
                      Regenerate {regenerateConfig.type === 'image' ? 'Image' : 'Script'}
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