document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Element Selection
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const apiKeyInput = document.getElementById('api-key-input');
    const systemPromptTextarea = document.getElementById('system-prompt-textarea');
    const ttsEnabledCheckbox = document.getElementById('tts-enabled-checkbox');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    const DEFAULT_SYSTEM_PROMPT = "You are a friendly and helpful AI companion, like Replika. You are here to chat, offer support, and engage in interesting conversations.";
    const YOUR_SITE_URL = "https://your-github-username.github.io/your-repo-name/"; // Replace with actual site URL
    const X_TITLE = "AI Matrix Chat"; // Or your specific app title

    // TTS Configuration
    let tts; // Will hold the WebAssembly TTS engine
    let audioContext; // For playing raw audio data
    const ttsModelConfig = {
        model: './en_US-amy-low.onnx',
        lexicon: './lexicon.txt',
        tokens: './tokens.txt',
        modelConfig: './en_US-amy-low.onnx.json', // Added model config
        // Sherpa-ONNX specific parameters (refer to its documentation)
        numThreads: 1,
        debug: false,
        provider: 'wasm', // or 'webgl' if supported and preferred
        // Speaker ID for multi-speaker models, 0 is often the default
        // For "amy" voice, this might be explicit or implicit in the model.
        // sid: 0 
    };


    // 2. Settings Panel Functionality
    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.toggle('settings-panel-visible');
    });

    saveSettingsButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const systemPrompt = systemPromptTextarea.value.trim();
        const ttsEnabled = ttsEnabledCheckbox.checked;

        if (apiKey) {
            localStorage.setItem('openRouterApiKey', apiKey);
        } else {
            localStorage.removeItem('openRouterApiKey');
        }
        localStorage.setItem('systemPrompt', systemPrompt);
        localStorage.setItem('ttsEnabled', ttsEnabled);

        settingsPanel.classList.remove('settings-panel-visible');
        // alert('Settings saved!');
    });

    // 3. Load Settings on Page Load
    function loadSettings() {
        const savedApiKey = localStorage.getItem('openRouterApiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }

        const savedSystemPrompt = localStorage.getItem('systemPrompt');
        if (savedSystemPrompt) {
            systemPromptTextarea.value = savedSystemPrompt;
        } else {
            systemPromptTextarea.value = DEFAULT_SYSTEM_PROMPT;
        }

        const savedTtsEnabled = localStorage.getItem('ttsEnabled');
        ttsEnabledCheckbox.checked = savedTtsEnabled === 'true';
    }

    // 4. Chat Message Display
    function displayUserMessage(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('user-message');
        messageDiv.textContent = messageText;
        chatMessagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function displayAiMessage(messageText, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('ai-message');
        if (isError) {
            messageDiv.style.color = 'orange';
            messageDiv.style.fontWeight = 'bold';
        }
        messageDiv.textContent = messageText;
        chatMessagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // 5. Helper function for TTS state
    function isTtsEnabled() {
        return localStorage.getItem('ttsEnabled') === 'true';
    }

    // 6. TTS Engine Initialization
    async function initTtsEngine() {
        if (typeof SherpaOnnx === 'undefined') {
            console.error("SherpaOnnx is not loaded. Ensure sherpa-onnx-wasm-main-tts.js is included and has loaded correctly.");
            displayAiMessage("Error: TTS library (SherpaOnnx) not loaded. This is expected if using placeholder files. Please ensure the actual Sherpa-ONNX JS file from Hugging Face is downloaded and correctly linked in index.html.", true);
            return;
        }
        if (tts) {
            console.log("TTS Engine already initialized.");
            return;
        }

        try {
            console.log("Initializing TTS Engine with config:", ttsModelConfig);
            // The SherpaOnnx.OnlineTts constructor might take a configuration object directly.
            // This is based on common patterns in their examples.
            // The exact structure might vary based on the version of sherpa-onnx-wasm-main.js
            const config = {
                models: [{
                    model: ttsModelConfig.model,
                    lexicon: ttsModelConfig.lexicon,
                    tokens: ttsModelConfig.tokens,
                    // modelConfig: ttsModelConfig.modelConfig, // some versions might need this nested
                    // The speaker ID (sid) is often part of the generate() call,
                    // but check if it's needed at initialization for the specific model.
                }],
                numThreads: ttsModelConfig.numThreads,
                debug: ttsModelConfig.debug,
                provider: ttsModelConfig.provider,
            };
            
            // It's also possible the model configuration (like en_US-amy-low.onnx.json)
            // needs to be fetched and parsed to extract parameters like sampleRate.
            // For simplicity, assuming the library handles it or uses a default.
            // If not, fetch and parse ttsModelConfig.modelConfig here.

            tts = new SherpaOnnx.OnlineTts(config);
            console.log("TTS Engine Initialized successfully.");

            // Initialize AudioContext for playing raw audio data
            // It's best to create AudioContext after a user interaction, but for now, try here.
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext created.");
            } catch (e) {
                console.error("Error creating AudioContext:", e);
                displayAiMessage("Error: Could not initialize audio playback.", true);
                tts = null; // Prevent TTS usage if audio context fails
            }

        } catch (err) {
            console.error("Error initializing TTS engine:", err);
            displayAiMessage(`Error: Could not initialize TTS engine. ${err.message || err}. Check console.`, true);
            tts = null; // Ensure tts is null if initialization fails
        }
    }

    // 7. Play TTS Audio
    async function playTTS(text) {
        if (!isTtsEnabled()) return;

        if (!tts) {
            console.error("TTS engine not initialized or initialization failed. Attempting to re-initialize.");
            // Optionally, try to re-initialize, or guide the user.
            await initTtsEngine(); 
            if (!tts) {
                 displayAiMessage("TTS engine is not ready. Please try again later or check settings.", true);
                 return;
            }
        }
        if (!audioContext) {
            console.error("AudioContext not available. Cannot play TTS.");
            displayAiMessage("Audio playback system is not ready. Cannot play TTS.", true);
            return;
        }
        if (!text.trim()) {
            console.log("TTS: No text to speak.");
            return;
        }

        try {
            console.log(`TTS: Generating audio for: "${text}"`);
            // Speaker ID (sid) might be required here. For 'amy' model, it's often 0 or implicit.
            // The specific API for generate() might vary.
            // It expects an object with `text` and `sid` (speaker ID).
            // The `speed` parameter is also common.
            const audioResult = await tts.generate({ 
                text: text, 
                sid: 0, // Assuming speaker ID 0 for Amy, adjust if needed
                speed: 1.0 // Default speed
            });

            if (!audioResult || !audioResult.samples || audioResult.samples.length === 0) {
                console.error("TTS: No audio samples returned from generate().");
                displayAiMessage("TTS Error: Could not generate audio samples.", true);
                return;
            }

            console.log(`TTS: Received ${audioResult.samples.length} samples. Sample rate: ${audioResult.sampleRate}`);

            const audioBuffer = audioContext.createBuffer(
                1, // number of channels
                audioResult.samples.length,
                audioResult.sampleRate
            );
            audioBuffer.getChannelData(0).set(audioResult.samples);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            console.log("TTS: Playback started.");

            source.onended = () => {
                console.log("TTS: Playback finished.");
            };

        } catch (err) {
            console.error("Error generating or playing TTS audio:", err);
            displayAiMessage(`TTS Error: ${err.message || "Could not generate speech."}. Check console.`, true);
        }
    }


    // 8. OpenRouter API Integration
    async function getAiResponse(userMessageText) {
        const apiKey = localStorage.getItem('openRouterApiKey');
        if (!apiKey) {
            displayAiMessage("API Key not set. Please configure it in settings.", true);
            return;
        }

        const systemPrompt = localStorage.getItem('systemPrompt') || DEFAULT_SYSTEM_PROMPT;
        // For simplicity, let's assume the history is not explicitly passed for now
        // In a more advanced setup, you would accumulate message history.
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageText }
        ];

        const apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': YOUR_SITE_URL,
                    'X-Title': X_TITLE
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat-v3-0324:free", // Or your preferred model
                    messages: messages
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error:', data);
                const errorMsg = data?.error?.message || `Error: ${response.status} ${response.statusText}`;
                displayAiMessage(`Error fetching AI response: ${errorMsg}`, true);
                return;
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                const aiMessageText = data.choices[0].message.content.trim();
                displayAiMessage(aiMessageText);

                if (isTtsEnabled()) {
                    playTTS(aiMessageText);
                }
            } else {
                console.error('Invalid API response structure:', data);
                displayAiMessage("Received an unexpected response from the AI. Check console.", true);
            }

        } catch (error) {
            console.error('Fetch API Error:', error);
            displayAiMessage("Error fetching AI response. Check console for details.", true);
        }
    }

    // 9. Message Sending Flow
    function handleSendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            displayUserMessage(messageText);
            messageInput.value = '';
            getAiResponse(messageText);
        }
    }

    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    });

    // Initial actions
    loadSettings();
    initTtsEngine(); // Initialize TTS engine on page load
});

