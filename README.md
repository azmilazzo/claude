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
    *   `sherpa-onnx-wasm-main-tts.js` (Main JavaScript loader for TTS)
    *   `sherpa-onnx-wasm-main-tts.wasm` (Primary WASM for TTS)
    *   `sherpa-onnx-wasm-main-tts.data` (Data for the TTS WASM)
    *   `sherpa-onnx-wasm-main.wasm` (This is often a separate core WASM. Download all relevant `.wasm` files from the k2-fsa TTS directory if unsure.)
    *   Voice model files:
        *   `en_US-amy-low.onnx`
        *   `en_US-amy-low.onnx.json`
    *   `lexicon.txt`
    *   `tokens.txt`

    **Note:** The exact filenames for the Sherpa-ONNX core WebAssembly modules can sometimes vary or include additional files. Please ensure you download all necessary `.js`, `.wasm`, and `.data` files listed in the k2-fsa Hugging Face TTS space for the version you are using.

3.  **Place these downloaded files into the root directory** of this project, replacing the existing placeholder files with the same names.

    **Warning:** Without these actual files, the TTS functionality will fail, and you may see errors in the browser console or chat window related to TTS initialization.

    **Important Note on Errors:** If you see an error in your browser's console like `SherpaOnnx is not loaded` or `TTS library not loaded` when the page loads, it typically means the main Sherpa-ONNX JavaScript library (`sherpa-onnx-wasm-main-tts.js`) was not found or did not execute correctly. This is **expected** if you are using the placeholder files currently in this repository. You must replace these placeholders with the actual files downloaded from the k2-fsa Hugging Face space for TTS functionality to be enabled.

### Uploading the Files to Your GitHub Repository

Once you have downloaded the Sherpa-ONNX and voice model files to your computer, you need to add them to the root directory of your GitHub repository. Here are a few common ways to do this:

**Method 1: Using the Git Command Line**

1.  Navigate to your local repository's root directory in your terminal or command prompt.
2.  Place all the downloaded Sherpa-ONNX and voice model files (e.g., `sherpa-onnx-wasm-main-tts.js`, `en_US-amy-low.onnx`, etc.) into this root directory.
3.  Use the following Git commands to add, commit, and push the files:
    ```bash
    # Add all new/modified files in the current directory
    git add .
    # Or, to add specific files:
    # git add sherpa-onnx-wasm-main-tts.js en_US-amy-low.onnx ...

    # Commit the changes with a descriptive message
    git commit -m "Add Piper TTS model and Sherpa-ONNX files"

    # Push the changes to your GitHub repository
    git push
    ```
    *Note: For very large files (typically over 50-100MB), Git Large File Storage (LFS) is often recommended. However, the Piper voice models and Sherpa-ONNX WebAssembly files are usually manageable with standard Git operations.*

**Method 2: Using GitHub Desktop**

1.  Ensure you have [GitHub Desktop](https://desktop.github.com/) installed and your repository cloned.
2.  Place all the downloaded Sherpa-ONNX and voice model files into the root directory of your local repository.
3.  Open GitHub Desktop. It should automatically detect the new files.
4.  Enter a commit message in the summary field (e.g., "Add Piper TTS assets").
5.  Click "Commit to main" (or your current branch).
6.  Click the "Push origin" button to upload the changes to your GitHub repository.

**Method 3: Using the GitHub Web Interface**

1.  Navigate to your repository on [GitHub.com](https://github.com/).
2.  Click on the "Add file" button located above the file list.
3.  Select "Upload files" from the dropdown menu.
4.  You can now drag and drop the downloaded files directly into the interface, or click "choose your files" to select them using your system's file browser.
5.  Once the files are uploaded, scroll down and enter a commit message (e.g., "Upload TTS model files").
6.  Click "Commit changes."
    *Note: This method is convenient for a few files at a time. For many files or larger files, using the Git command line or GitHub Desktop is generally more efficient.*

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
*   The JavaScript console error `SherpaOnnx is not loaded` (or similar, indicating the TTS library failed to load) will appear if placeholder TTS files are used instead of the actual Sherpa-ONNX library downloaded from Hugging Face.

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
