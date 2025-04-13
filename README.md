# Video Frame Capture

## Introduction
Video Frame Capture is a browser extension developed by PaulusPliniusChang in 2025, released under the MIT Open Source License. Version 1.0 of this tool allows users to capture frames from videos on web pages. It provides various capture modes, including single screenshots, continuous recording, and custom recording. Additionally, it can detect and mark visited pages and save frame capture records.

## Features
1. **Frame Capture**:
    - **Screenshot**: Capture a single frame from the largest video on the page.
    - **Recording**: Continuously capture frames from the video, saving only frames that meet the similarity threshold.
    - **Custom Recording**: Support for custom recording modes.
2. **Page Visitation Detection**: Mark visited pages with a special icon and title, and display a notification.
3. **Configuration Options**:
    - **Similarity Threshold**: Adjust the similarity threshold for frame capture.
    - **Save Path**: Set the directory for saving captured frames.
4. **Logging**: Display operation logs in the popup window, including capture status and frame saving information.

## Installation
1. Clone or download the project repository.
2. Open your browser and go to the extensions management page.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the project directory.

## Usage
### Popup Window
- **Similarity Threshold**: Adjust the similarity threshold for frame capture. A higher threshold captures more frames.
- **Screenshot**: Capture a single frame from the video.
- **Start Recording**: Begin continuous frame capture.
- **Stop Recording**: Stop the ongoing frame capture.
- **Custom Recording**: Initiate custom recording.
- **Log**: Displays operation logs, including capture status and frame saving information.

### Options Page
- **Similarity Threshold**: Set the default similarity threshold for frame capture.
- **Save Path**: Specify the directory for saving captured frames.

### Keyboard Shortcuts
- **Ctrl+Shift+S**: Take a screenshot.
- **Ctrl+Shift+R**: Start recording.
- **Ctrl+Shift+X**: Stop recording.
- **Ctrl+Shift+C**: Initiate custom recording.

## Code Structure
- **popup.html** and **popup.js**: Define the user interface and functionality of the popup window.
- **background.js**: Handles background tasks, such as page visitation detection and frame saving.
- **content.js**: Runs in the context of web pages, responsible for video frame capture and processing.
- **options.html** and **options.js**: Provide the user interface and functionality for the options page.
- **manifest.json**: Defines the metadata and permissions of the browser extension.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
If you have any questions or suggestions, please feel free to contact the author.
