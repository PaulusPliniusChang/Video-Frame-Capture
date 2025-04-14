// Reserved browser shortcuts to check conflicts
const BROWSER_SHORTCUTS = [
    'Ctrl+T', 'Ctrl+N', 'Ctrl+W', 'Ctrl+Shift+T', 'Ctrl+Tab', 'Ctrl+Shift+Tab',
    'Alt+Left', 'Alt+Right', 'Ctrl+L', 'Ctrl+K', 'Ctrl+F', 'F5'
];

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    browser.storage.local.get(['threshold', 'savePath', 'shortcuts'], (result) => {
        document.getElementById('threshold').value = result.threshold || 0.9;
        document.getElementById('savePath').value = result.savePath || '';
        
        // Load shortcuts
        const shortcuts = result.shortcuts || {
            'screenshot': 'Ctrl+Shift+S',
            'start-recording': 'Ctrl+Shift+R',
            'stop-recording': 'Ctrl+Shift+X',
            'custom-record': 'Ctrl+Shift+C'
        };
        
        Object.entries(shortcuts).forEach(([command, shortcut]) => {
            document.getElementById(`shortcut-${command}`).value = shortcut;
        });
    });
});

// Handle shortcut recording
let isRecording = false;
document.querySelectorAll('.record-shortcut').forEach(button => {
    button.addEventListener('click', (e) => {
        if (isRecording) return;
        
        const command = e.target.dataset.command;
        const input = document.getElementById(`shortcut-${command}`);
        const errorDiv = document.getElementById(`error-${command}`);
        
        isRecording = true;
        input.value = 'Press shortcut...';
        button.textContent = 'Recording...';
        
        const handleKeyDown = (e) => {
            e.preventDefault();
            
            const keys = [];
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');
            if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
                keys.push(e.key.toUpperCase());
            }
            
            const shortcut = keys.join('+');
            
            // Check for browser shortcuts conflict
            if (BROWSER_SHORTCUTS.includes(shortcut)) {
                errorDiv.textContent = 'This shortcut is reserved by browser!';
                errorDiv.style.display = 'block';
                input.value = '';
                return;
            }
            
            input.value = shortcut;
            errorDiv.style.display = 'none';
            
            // Clean up
            document.removeEventListener('keydown', handleKeyDown);
            isRecording = false;
            button.textContent = 'Record';
        };
        
        document.addEventListener('keydown', handleKeyDown);
    });
});

// Save settings
document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const shortcuts = {};
    ['screenshot', 'start-recording', 'stop-recording', 'custom-record'].forEach(command => {
        shortcuts[command] = document.getElementById(`shortcut-${command}`).value;
    });
    
    // Update commands
    for (const [command, shortcut] of Object.entries(shortcuts)) {
        try {
            await browser.commands.update({
                name: command,
                shortcut: shortcut
            });
        } catch (error) {
            console.error(`Failed to update shortcut for ${command}:`, error);
            document.getElementById(`error-${command}`).textContent = error.message;
            document.getElementById(`error-${command}`).style.display = 'block';
            return;
        }
    }
    
    // Save all settings
    await browser.storage.local.set({
        threshold: document.getElementById('threshold').value,
        savePath: document.getElementById('savePath').value,
        shortcuts: shortcuts
    });
    
    // Show success message
    alert('Settings saved successfully!');
});