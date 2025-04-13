//listen
let visitedUrls = new Set();

// listen for changes in storage

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (visitedUrls.has(tab.url)) {
            // send message to content script that the URL has been visited
            browser.tabs.sendMessage(tabId, {
                type: 'urlVisited',
                message: 'this page has already been visited'
            });
            
            // show notification and change tab icon and title
            browser.notifications.create({
                type: 'basic',
                iconUrl: browser.runtime.getURL('icons/icon48.png'),
                title: 'notice',
                message: 'his page has already been visited'
            });
            
            // change tab icon and title
            browser.pageAction.setIcon({
                tabId: tabId,
                path: {
                    "16": "icons/visited16.png",
                    "32": "icons/visited32.png"
                }
            });
            
            // change tab title
            browser.tabs.executeScript(tabId, {
                code: `
                    if (!document.title.startsWith('【accessed】')) {
                        document.title = '【accessed】' + document.title;
                    }
                `
            });
        }
    }
});

// listen for commands
browser.commands.onCommand.addListener((command) => {
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {command: command});
    });
});

// saveFrame
// functions dealing with visited urls
async function loadVisitedUrls() {
    try {
        const result = await browser.storage.local.get('savePath');
        const basePath = result.savePath || '';
        const csvPath = (basePath.replace(/\//g, '\\').trim() + '\\visited_urls.csv').replace(/\\+/g, '\\');
        
        const response = await fetch(`file://${csvPath}`);
        const text = await response.text();
        const urls = text.split('\n').map(line => line.trim()).filter(url => url);
        
        visitedUrls = new Set(urls);
    } catch (error) {
        console.log('failure in loading access records:', error);
        visitedUrls = new Set();
    }
}

async function saveVisitedUrls() {
    try {
        const result = await browser.storage.local.get('savePath');
        const basePath = result.savePath || '';
        const csvPath = (basePath.replace(/\//g, '\\').trim() + '\\visited_urls.csv').replace(/\\+/g, '\\');
        
        const content = Array.from(visitedUrls).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        await browser.downloads.download({
            url: url,
            filename: csvPath,
            saveAs: false,
            conflictAction: 'overwrite'
        });
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('failure in saving access records:', error);
    }
}

// change tab icon and title
browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'saveFrame') {
        const blob = dataURLtoBlob(message.dataUrl);
        const url = URL.createObjectURL(blob);
        
        browser.storage.local.get('savePath', (result) => {
            let basePath = result.savePath || '';
            basePath = basePath.replace(/\//g, '\\').trim();
            if (basePath && !basePath.endsWith('\\')) {
                basePath += '\\';
            }
            
            const filename = basePath + message.filename;
            
            browser.downloads.download({
                url: url,
                filename: filename,
                saveAs: false,
                conflictAction: 'uniquify'
            }).then(() => {
                // saved successfully
                browser.runtime.sendMessage({
                    type: 'log',
                    text: `saved successfully: ${filename}`
                });
                URL.revokeObjectURL(url);
            }).catch((error) => {
                // failed to save
                browser.runtime.sendMessage({
                    type: 'log',
                    text: `failed to save: ${error.message}`
                });
                URL.revokeObjectURL(url);
            });
        });
        
        // record visited urls
        browser.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            visitedUrls.add(tabs[0].url);
            await saveVisitedUrls();
        });
    }
});


loadVisitedUrls();


setInterval(saveVisitedUrls, 5 * 60 * 1000);

// change dataUrl to blob
function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}