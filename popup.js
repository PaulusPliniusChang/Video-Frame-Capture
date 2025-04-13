
document.getElementById('screenshot').addEventListener('click', () => {
    sendCommand('screenshot');
});

document.getElementById('startRecord').addEventListener('click', () => {
    sendCommand('start-recording');
});

document.getElementById('stopRecord').addEventListener('click', () => {
    sendCommand('stop-recording');
});

document.getElementById('customRecord').addEventListener('click', () => {
    sendCommand('custom-record');
});

function sendCommand(command) {
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {command: command});
    });
}

// receive status message
browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'status') {
        document.getElementById('status').textContent = message.text;
    }
});

let logLines = [];
const MAX_LOG_LINES = 256;

document.getElementById('threshold').addEventListener('change', (e) => {
    const threshold = parseFloat(e.target.value);
    browser.storage.local.set({ threshold: threshold });
    addLog(`threshold renewed to: ${threshold}`);
});

// initialize threshold
browser.storage.local.get('threshold', (result) => {
    document.getElementById('threshold').value = result.threshold || 0.9;
});

function addLog(text) {
    logLines.push(text);
    if (logLines.length > MAX_LOG_LINES) {
        logLines = logLines.slice(-MAX_LOG_LINES);
    }
    
    const logContainer = document.getElementById('log-container');
    logContainer.innerHTML = logLines.map(line => 
        `<div class="log-entry">${line}</div>`
    ).join('');
    logContainer.scrollTop = logContainer.scrollHeight;
}

// receive log messages
browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'log') {
        addLog(message.text);
    }
});