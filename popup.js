document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInput = document.getElementById('fileInput');
    const statusMessage = document.getElementById('statusMessage');

    // Export data
    exportBtn.addEventListener('click', function() {
        chrome.storage.local.get(null, function(data) {
            // Filter only note data
            const noteData = {};
            Object.keys(data).forEach(key => {
                if (key.startsWith('note_')) {
                    noteData[key] = data[key];
                }
            });

            if (Object.keys(noteData).length === 0) {
                showStatus('No notes to export', 'error');
                return;
            }

            const dataStr = JSON.stringify(noteData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `f95zone-notes-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            showStatus(`Exported ${Object.keys(noteData).length} notes`, 'success');
        });
    });

    // Import data
    importBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate that it's note data (support both old 'comment_' and new 'note_' keys)
                const validNotes = {};
                Object.keys(importData).forEach(key => {
                    if ((key.startsWith('note_') || key.startsWith('comment_')) && typeof importData[key] === 'string') {
                        // Convert old comment_ keys to note_ keys
                        const noteKey = key.startsWith('comment_') ? key.replace('comment_', 'note_') : key;
                        validNotes[noteKey] = importData[key];
                    }
                });

                if (Object.keys(validNotes).length === 0) {
                    showStatus('No valid notes found in file', 'error');
                    return;
                }

                chrome.storage.local.set(validNotes, function() {
                    if (chrome.runtime.lastError) {
                        showStatus('Error importing data', 'error');
                    } else {
                        showStatus(`Imported ${Object.keys(validNotes).length} notes`, 'success');
                    }
                });

            } catch (error) {
                showStatus('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        fileInput.value = '';
    });

    // Clear all data
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete ALL saved notes? This cannot be undone.')) {
            chrome.storage.local.get(null, function(data) {
                // Clear both old comment_ keys and new note_ keys for backward compatibility
                const noteKeys = Object.keys(data).filter(key => key.startsWith('note_') || key.startsWith('comment_'));
                
                if (noteKeys.length === 0) {
                    showStatus('No notes to clear', 'error');
                    return;
                }

                chrome.storage.local.remove(noteKeys, function() {
                    if (chrome.runtime.lastError) {
                        showStatus('Error clearing data', 'error');
                    } else {
                        showStatus(`Cleared ${noteKeys.length} notes`, 'success');
                    }
                });
            });
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message status-${type}`;
        statusMessage.style.display = 'block';
        
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
});