// Global state
const state = {
    isRecording: false,
    lastFrame: null,
    savedFramesCount: 0,
    originalPlaybackRate: 1.0,
    similarityThreshold: 0.9,
    processingWorker: null
};

//  Web Worker for image similarity calculation
const workerBlob = new Blob([`
    function calculateDifference(data1, data2) {
        const sampleSize = 100;
        const step = Math.floor(data1.length / 4 / sampleSize);
        let diffCount = 0;
        
        for (let i = 0; i < data1.length; i += step * 4) {
            const diff = Math.abs(data1[i] - data2[i]) + 
                        Math.abs(data1[i + 1] - data2[i + 1]) + 
                        Math.abs(data1[i + 2] - data2[i + 2]);
            if (diff > 30) {
                diffCount++;
            }
        }
        
        return 1 - (diffCount / sampleSize);
    }

    self.onmessage = function(e) {
        const { data1, data2 } = e.data;
        const similarity = calculateDifference(data1, data2);
        self.postMessage({ similarity });
    };
`], { type: 'application/javascript' });

const workerUrl = URL.createObjectURL(workerBlob);

// queue for saving frames
const saveQueue = {
    queue: [],
    processing: false,
    
    async add(frame) {
        this.queue.push(frame);
        if (!this.processing) {
            this.processing = true;
            await this.process();
        }
    },
    
    async process() {
        while (this.queue.length > 0) {
            const frame = this.queue.shift();
            try {
                await this._saveFrame(frame);
            } catch (error) {
                console.error('failed:', error);
            }
        }
        this.processing = false;
    },
    
    async _saveFrame(frame) {
        const title = getLargestText().replace(/[^\w\s]/gi, '');
        const timestamp = Date.now();
        const filename = `${timestamp}_${title}.jpg`;
        
        await browser.runtime.sendMessage({
            type: 'saveFrame',
            dataUrl: frame.dataUrl,
            filename: filename
        });
        
        state.savedFramesCount++;
        await browser.runtime.sendMessage({
            type: 'log',
            text: `saved: ${filename}`
        });
    }
};

// initialize Web Worker
function initWorker() {
    if (state.processingWorker) {
        state.processingWorker.terminate();
    }
    state.processingWorker = new Worker(workerUrl);
}

// calculate similarity between two frames
function calculateSimilarity(frame1, frame2) {
    return new Promise((resolve) => {
        const messageHandler = (e) => {
            state.processingWorker.removeEventListener('message', messageHandler);
            resolve(e.data.similarity);
        };
        state.processingWorker.addEventListener('message', messageHandler);
        
        state.processingWorker.postMessage({
            data1: frame1.imageData,
            data2: frame2.imageData
        });
    });
}

// start recording the video content
function startRecording() {
    const video = getLargestVideo();
    if (!video || state.isRecording) return;

    initWorker();
    state.isRecording = true;
    state.savedFramesCount = 0;
    state.originalPlaybackRate = video.playbackRate;
    video.playbackRate = 1.0;
    state.lastFrame = null;

    browser.runtime.sendMessage({
        type: 'log',
        text: 'recording...'
    });

    let frameCount = 0;
    let lastProcessTime = 0;
    const processInterval = 1000 / 30; // 30fps

    const processFrame = async (frame) => {
        try {
            if (!state.lastFrame) {
                await saveQueue.add(frame);
                state.lastFrame = frame;
            } else {
                const similarity = await calculateSimilarity(state.lastFrame, frame);
                if (similarity < state.similarityThreshold) {
                    await saveQueue.add(frame);
                    state.lastFrame = frame;
                }
            }
        } catch (error) {
            console.error('failure in processing frames:', error);
        }
    };

    const captureLoop = async (timestamp) => {
        if (!state.isRecording) return;

        const elapsed = timestamp - lastProcessTime;
        if (elapsed >= processInterval) {
            const frame = captureFrame(video);
            frameCount++;
            lastProcessTime = timestamp;
            await processFrame(frame);

            if (frameCount % 30 === 0) {
                browser.runtime.sendMessage({
                    type: 'log',
                    text: `processed ${frameCount} frames，has saved ${state.savedFramesCount} frames`
                });
            }
        }

        requestAnimationFrame(captureLoop);
    };

    requestAnimationFrame(captureLoop);
}

// attain the largest video element
function getLargestVideo() {
    const videos = Array.from(document.getElementsByTagName('video'));
    return videos.reduce((largest, current) => {
        const currentArea = current.offsetWidth * current.offsetHeight;
        const largestArea = largest ? largest.offsetWidth * largest.offsetHeight : 0;
        return currentArea > largestArea ? current : largest;
    }, null);
}

// frame capture function
function captureFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        width: canvas.width,
        height: canvas.height
    };
}

// record stop function
function stopRecording() {
    if (!state.isRecording) return;
    
    state.isRecording = false;
    
    const video = getLargestVideo();
    if (video) {
        video.playbackRate = state.originalPlaybackRate;
    }

    if (state.processingWorker) {
        state.processingWorker.terminate();
        state.processingWorker = null;
    }

    browser.runtime.sendMessage({
        type: 'log',
        text: `Finished. ${state.savedFramesCount} images saved`
    });

    state.lastFrame = null;
    state.savedFramesCount = 0;
}

// message listener
browser.runtime.onMessage.addListener((message) => {
    const video = getLargestVideo();
    if (!video && message.command !== 'custom-record') return;

    switch (message.command) {
        case 'screenshot':
            const frame = captureFrame(video);
            saveQueue.add(frame);
            break;
        case 'start-recording':
            startRecording();
            break;
        case 'stop-recording':
            stopRecording();
            break;
    }
});

// get the largest text element on the page
function getLargestText() {
    const elements = document.getElementsByTagName('*');
    let largestElement = null;
    let maxFontSize = 0;

    for (const element of elements) {
        const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
        const text = element.textContent.trim();
        if (fontSize > maxFontSize && text.length > 0) {
            maxFontSize = fontSize;
            largestElement = element;
        }
    }

    return largestElement ? largestElement.textContent.trim().substring(0, 20) : document.title;
}

// initialize
browser.storage.local.get('threshold', (result) => {
    state.similarityThreshold = result.threshold || 0.9;
});

// listen for changes in storage
browser.storage.local.onChanged.addListener((changes) => {
    if (changes.threshold) {
        state.similarityThreshold = changes.threshold.newValue;
    }
});