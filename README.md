# Matrix AI Chat with Piper TTS

## Overview

Matrix AI Chat is a web-based chat application that allows users to interact with an AI model through a sleek, Matrix-inspired interface. It features AI responses powered by OpenRouter.ai and includes Text-to-Speech (TTS) functionality for AI replies using Piper TTS (specifically the "Amy" voice) via the Sherpa-ONNX WebAssembly engine.

This is a client-side only application, meaning it runs entirely in your web browser. It can be easily hosted on platforms like GitHub Pages.

## Features

*   **Matrix-Themed UI:** Immersive and visually distinct chat interface.
*   **AI Chat:** Engage in conversations with an AI model from OpenRouter.ai.
    *   Currently configured to use the `deepseek/deepseek-chat-v3-0324:free` model.
*   **Text-to-Speech (TTS):** AI replies are spoken aloud using Piper TTS (Amy voice by default) through the Sherpa-ONNX WebAssembly engine.
*   **Settings Panel:**
    *   **OpenRouter API Key:** Securely store your API key in LocalStorage.
    *   **Customizable System Prompt:** Tailor the AI's personality and behavior. Comes with a default prompt and is stored in LocalStorage.
    *   **TTS Toggle:** Enable or disable voice replies.
*   **Client-Side Operation:** No backend server needed, runs entirely in the browser.

## Setup and Usage

### 1. Getting an OpenRouter API Key

To use the chat functionality, you need an API key from OpenRouter.ai.
1.  Go to [https://openrouter.ai/](https://openrouter.ai/) and sign up or log in.
2.  Navigate to your account settings to find your API key.
3.  Copy this key.
4.  Open the Matrix AI Chat application, click the settings icon (⚙), paste your API key into the "OpenRouter API Key" field, and click "Save Settings."

### 2. Piper TTS Setup (IMPORTANT - Manual Download Required)

The application uses Piper TTS via the Sherpa-ONNX WebAssembly engine for text-to-speech. The repository currently contains **placeholder files** for the TTS engine and voice model. **TTS will not work until you replace these placeholders with the actual files.**

1.  **Download the necessary files** from the official Sherpa-ONNX WebAssembly TTS Hugging Face space:
    *   [https://huggingface.co/spaces/k2-fsa/web-assembly-tts-sherpa-onnx-en/tree/main](https://huggingface.co/spaces/k2-fsa/web-assembly-tts-sherpa-onnx-en/tree/main)

2.  From the "Files" section of the Hugging Face space, download the following files:
    *   `sherpa-onnx-wasm-main.js`
    *   `sherpa-onnx-wasm-main.wasm`
    *   `sherpa-onnx-wasm-main.data`
    *   `en_US-amy-low.onnx` (This is the Amy voice model)
    *   `en_US-amy-low.onnx.json` (Configuration for the Amy voice model)
    *   `lexicon.txt`
    *   `tokens.txt`

3.  **Place these downloaded files into the root directory** of this project, replacing the existing placeholder files with the same names.

    **Warning:** Without these actual files, the TTS functionality will fail, and you may see errors in the browser console or chat window related to TTS initialization.

### 3. Running the Application

*   **Local:** Simply open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge).
*   **GitHub Pages (or similar static hosting):** If you've cloned or forked this repository, you can host it on GitHub Pages. The application will then be accessible via a URL like `https://your-username.github.io/your-repo-name/`.
*   **Using the Settings Panel:**
    *   Click the settings icon (⚙) in the top right corner to open the panel.
    *   Enter your OpenRouter API Key.
    *   Customize the System Prompt if desired.
    *   Toggle TTS on or off.
    *   Click "Save Settings."

### 4. OpenRouter API Headers (Optional Customization)

If you are hosting this application on your own website and want your site to be properly attributed in OpenRouter's rankings or logs, you might want to customize the `HTTP-Referer` and `X-Title` headers. These are located in the `script.js` file within the `getAiResponse` function.

The current placeholder values are:
*   `HTTP-Referer`: `"https://your-github-username.github.io/your-repo-name/"`
*   `X-Title`: `"AI Matrix Chat"`

You can change these to match your site's URL and desired application title.

## Known Issues/Limitations

*   TTS functionality is highly dependent on the correct setup of Sherpa-ONNX files.
*   Initial TTS model loading might take a few moments.
*   Performance may vary based on browser and device.
*   The CSS style for `#message-input-area` in `style.css` might be unused or intended for a future HTML structure, as no element currently uses this ID.

## Technologies Used

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   OpenRouter.ai API
*   Piper TTS
*   Sherpa-ONNX (WebAssembly)

## License

This project is licensed under the MIT License.
(You may want to include the full MIT License text here if you create a `LICENSE` file.)
