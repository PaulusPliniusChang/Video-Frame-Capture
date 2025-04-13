document.addEventListener('DOMContentLoaded', () => {
    browser.storage.local.get(['threshold', 'savePath'], (result) => {
        document.getElementById('threshold').value = result.threshold || 0.9;
        document.getElementById('savePath').value = result.savePath || '';
    });
});

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const threshold = document.getElementById('threshold').value;
    const savePath = document.getElementById('savePath').value;
    
    browser.storage.local.set({
        threshold: threshold,
        savePath: savePath
    });
});