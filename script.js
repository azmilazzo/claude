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
    let ttsEngineInitialized = false; // Flag to ensure TTS engine init logic runs once
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
        if (ttsEngineInitialized) {
            console.log("TTS init function called but an attempt (success or fail) was already made. Skipping duplicate run.");
            return;
        }
        ttsEngineInitialized = true; // Mark that an attempt is now in progress.

        if (typeof SherpaOnnx === 'undefined') {
            console.error("SherpaOnnx is not loaded. Ensure sherpa-onnx-wasm-main-tts.js is included and has loaded correctly.");
            displayAiMessage("Error: TTS library (SherpaOnnx) not loaded. This is expected if using placeholder files. Please ensure the actual Sherpa-ONNX JS file from Hugging Face is downloaded and correctly linked in index.html.", true);
            // Note: ttsEngineInitialized remains true, as an attempt was made.
            return;
        }
        // Note: The 'if (tts)' check for already initialized TTS instance is removed here
        // because ttsEngineInitialized flag now gates the entire function logic.
        // If tts is already set, it implies a successful previous run, which ttsEngineInitialized should reflect.

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

    function waitForSherpaOnnxAndInit() {
        const maxRetries = 200; // Increased to 200 for a ~20 second timeout (200 * 100ms)
        const retryInterval = 100; // milliseconds
        let currentRetry = 0;

        function tryInit() {
            if (typeof SherpaOnnx !== 'undefined') {
                console.log("SherpaOnnx object found via polling. Initializing TTS engine.");
                initTtsEngine(); // initTtsEngine will check ttsEngineInitialized flag
            } else if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`SherpaOnnx not ready (polling), retrying (${currentRetry}/${maxRetries})...`);
                setTimeout(tryInit, retryInterval);
            } else {
                console.error("SherpaOnnx object did not become available after polling. TTS will not function if Module.onRuntimeInitialized also fails or isn't used.");
                // Call initTtsEngine one last time to ensure error messages are displayed if SherpaOnnx is still not defined.
                // The ttsEngineInitialized flag will prevent duplicate execution of core logic.
                initTtsEngine();
            }
        }

        // Attempt to use Module.onRuntimeInitialized if available
        // This is a common pattern for Emscripten-compiled WebAssembly modules.
        if (typeof Module !== 'undefined' && typeof Module.onRuntimeInitialized === 'function') {
            // This condition implies Module.onRuntimeInitialized is already set by SherpaOnnx or another script.
            // This is less common for SherpaOnnx which usually expects *us* to define it.
            // If SherpaOnnx defines it, it might call its own internal init, then our hook (if it supports chaining).
            // Or it might expect us *not* to define it if it has its own.
            // For now, we'll log a warning and rely on our polling as the primary mechanism if this is pre-defined.
            console.warn('Module.onRuntimeInitialized is already defined. Polling will be the primary method for TTS initialization.');
             tryInit(); // Start polling as primary method
        } else if (typeof Module !== 'undefined' && typeof Module.onRuntimeInitialized === 'undefined') {
            console.log('Setting up Module.onRuntimeInitialized for SherpaOnnx.');
            Module.onRuntimeInitialized = function() {
                console.log('Module.onRuntimeInitialized has been called.');
                initTtsEngine(); // Call initTtsEngine directly
            };
            // Polling can still run as a fallback if onRuntimeInitialized doesn't fire for some reason
            // or if SherpaOnnx becomes available before onRuntimeInitialized.
            // However, the ttsEngineInitialized flag in initTtsEngine should prevent redundant actual initializations.
            // Let's start polling slightly delayed or not at all if we trust onRuntimeInitialized.
            // For max robustness, let's still poll, initTtsEngine will sort it out.
            setTimeout(tryInit, retryInterval * 5); // Start polling after a short delay, giving onRuntimeInitialized a chance
        } else {
            // Module object doesn't exist, so onRuntimeInitialized cannot be used. Rely solely on polling.
            console.log('Module object not found. Relying solely on polling for SherpaOnnx availability.');
            tryInit();
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

    function waitForSherpaOnnxAndInit() {
        const maxRetries = 50; // e.g., 50 * 100ms = 5 seconds
        const retryInterval = 100; // milliseconds
        let currentRetry = 0;

        function tryInit() {
            if (typeof SherpaOnnx !== 'undefined') {
                console.log("SherpaOnnx object found. Initializing TTS engine.");
                initTtsEngine();
            } else if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`SherpaOnnx not ready, retrying (${currentRetry}/${maxRetries})...`);
                setTimeout(tryInit, retryInterval);
            } else {
                console.error("SherpaOnnx object did not become available after multiple retries. TTS will not function.");
                // The existing error message in initTtsEngine will also be displayed if SherpaOnnx is still undefined there,
                // but this provides an earlier, specific timeout message.
                // We can also call displayAiMessage here if desired, though initTtsEngine already does.
                // For robustness, let initTtsEngine handle its own check and display message.
                // Just to be safe, in case initTtsEngine is called from elsewhere later.
                initTtsEngine(); // Call it one last time; it will display the error message.
            }
        }
        tryInit(); // Start the polling
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
    waitForSherpaOnnxAndInit(); // Wait for SherpaOnnx then initialize TTS
});
