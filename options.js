const browser = window.browser || window.chrome;

document.addEventListener('DOMContentLoaded', async function() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInput = document.getElementById('fileInput');
    const statsDiv = document.getElementById('stats');

    // Load and display stats
    await loadStats();

    // Export data
    exportBtn.addEventListener('click', async function() {
        const data = await browser.storage.local.get(null);
        const noteData = {};
        
        Object.keys(data).forEach(key => {
            if (key.startsWith('note_')) {
                noteData[key] = data[key];
            }
        });

        if (Object.keys(noteData).length === 0) {
            showStatus('exportStatus', 'No notes to export', 'error');
            return;
        }

        const dataStr = JSON.stringify(noteData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `f95zone-notes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus('exportStatus', `✓ Exported ${Object.keys(noteData).length} notes`, 'success');
    });

    // Import data
    importBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            const validNotes = {};
            
            Object.keys(importData).forEach(key => {
                const noteKey = key.startsWith('comment_') ? key.replace('comment_', 'note_') : key;
                
                if (key.startsWith('note_') || key.startsWith('comment_')) {
                    if (typeof importData[key] === 'string') {
                        validNotes[noteKey] = {
                            text: importData[key],
                            version: null,
                            savedAt: new Date().toISOString()
                        };
                    } else if (importData[key] && typeof importData[key] === 'object') {
                        validNotes[noteKey] = {
                            text: importData[key].text || '',
                            version: importData[key].version || null,
                            savedAt: importData[key].savedAt || new Date().toISOString()
                        };
                    }
                }
            });

            if (Object.keys(validNotes).length === 0) {
                showStatus('importStatus', 'No valid notes found in file', 'error');
                return;
            }

            await browser.storage.local.set(validNotes);
            showStatus('importStatus', `✓ Successfully imported ${Object.keys(validNotes).length} notes`, 'success');
            await loadStats();
            
        } catch (error) {
            showStatus('importStatus', 'Invalid JSON file', 'error');
        }
        
        fileInput.value = '';
    });

    // Clear all data
    clearBtn.addEventListener('click', async function() {
        if (!confirm('Are you sure you want to delete ALL saved notes? This cannot be undone.')) return;
        
        const data = await browser.storage.local.get(null);
        const noteKeys = Object.keys(data).filter(key => key.startsWith('note_') || key.startsWith('comment_'));
        
        if (noteKeys.length === 0) {
            showStatus('clearStatus', 'No notes to clear', 'error');
            return;
        }

        await browser.storage.local.remove(noteKeys);
        showStatus('clearStatus', `✓ Cleared ${noteKeys.length} notes`, 'success');
        await loadStats();
    });

    async function loadStats() {
        const data = await browser.storage.local.get(null);
        const noteKeys = Object.keys(data).filter(key => key.startsWith('note_'));
        
        if (noteKeys.length === 0) {
            statsDiv.innerHTML = '<div class="stats-item">No notes saved yet</div>';
        } else {
            statsDiv.innerHTML = `
                <div class="stats-item">Total notes: <span class="stats-value">${noteKeys.length}</span></div>
            `;
        }
    }

    function showStatus(elementId, message, type) {
        const statusElement = document.getElementById(elementId);
        statusElement.textContent = message;
        statusElement.className = `status-message status-${type}`;
        statusElement.style.display = 'block';
        setTimeout(() => statusElement.style.display = 'none', 5000);
    }
});