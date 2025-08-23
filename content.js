// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeExtension();
});

// Also run immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

function initializeExtension() {
    // Detect page type
    if (window.location.href.includes('/sam/latest_alpha/')) {
        initializeUpdatesPage();
    } else if (window.location.href.includes('/threads/')) {
        initializeGamePage();
    }
}

function initializeUpdatesPage() {
    // Find the main container for updates page
    const container = document.getElementById('latest-page_items-wrap_inner');
    
    if (!container) {
        console.log('Updates container not found, retrying...');
        setTimeout(initializeExtension, 1000);
        return;
    }

    // Process existing game tiles
    processExistingTiles();

    // Set up observer for dynamically loaded content
    setupMutationObserver(container);
}

function initializeGamePage() {
    // Find the block container for game page
    const blockContainer = document.querySelector('.block-container.lbContainer');
    
    if (!blockContainer) {
        console.log('Game page container not found, retrying...');
        setTimeout(initializeExtension, 1000);
        return;
    }

    // Extract thread ID from URL or data attribute
    const threadId = extractThreadId();
    if (!threadId) {
        console.log('Could not extract thread ID');
        return;
    }

    // Add note section before the block container
    addGamePageNoteSection(blockContainer, threadId);
}

function extractThreadId() {
    // Try to get thread ID from URL (e.g., /threads/game-name.12345/)
    const urlMatch = window.location.href.match(/\/threads\/.*\.(\d+)\//);
    if (urlMatch) {
        return urlMatch[1];
    }

    // Try to get from data attribute
    const blockContainer = document.querySelector('.block-container.lbContainer');
    if (blockContainer) {
        const dataLbId = blockContainer.getAttribute('data-lb-id');
        if (dataLbId && dataLbId.startsWith('thread-')) {
            return dataLbId.replace('thread-', '');
        }
    }

    // Fallback: try to find thread ID in page
    const threadIdMatch = document.body.innerHTML.match(/thread[_-](\d+)/i);
    if (threadIdMatch) {
        return threadIdMatch[1];
    }

    return null;
}

function addGamePageNoteSection(blockContainer, threadId) {
    // Check if note section already exists
    if (document.getElementById(`game-note-section-${threadId}`)) {
        return;
    }

    // Create note section container
    const noteSection = document.createElement('div');
    noteSection.className = 'game-note-section';
    noteSection.id = `game-note-section-${threadId}`;
    noteSection.innerHTML = `
        <div class="game-note-header">
            <h3>My note</h3>
        </div>
        <div class="note-display" id="note-display-${threadId}" style="display: none;">
            <div class="note-text" id="note-text-${threadId}"></div>
            <div class="note-buttons">
                <button class="edit-note-btn" data-thread-id="${threadId}">Edit</button>
                <button class="delete-note-btn" data-thread-id="${threadId}">Delete</button>
            </div>
        </div>
        <div class="note-edit" id="note-edit-${threadId}">
            <textarea class="note-input" id="note-input-${threadId}" placeholder="Add your personal note (visable only to you)..." rows="4"></textarea>
            <div class="note-buttons">
                <button class="save-note-btn" data-thread-id="${threadId}">Save</button>
                <button class="cancel-note-btn" data-thread-id="${threadId}">Cancel</button>
            </div>
        </div>
        <div class="note-empty" id="note-empty-${threadId}">
            <button class="add-note-btn" data-thread-id="${threadId}">+ Add Note</button>
        </div>
    `;

    // Insert note section before the block container
    blockContainer.parentNode.insertBefore(noteSection, blockContainer);

    // Add event listeners
    setupNoteEventListeners(noteSection, threadId);
    
    // Load existing note
    loadNote(threadId);
}

function processExistingTiles() {
    const gameTiles = document.querySelectorAll('.resource-tile');
    gameTiles.forEach(tile => {
        if (!document.getElementById(`wrapper-${tile.getAttribute('data-thread-id')}`)) {
            addNoteSection(tile);
        }
    });
}

function setupMutationObserver(container) {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node is a game tile
                    if (node.classList && node.classList.contains('resource-tile')) {
                        addNoteSection(node);
                    }
                    // Or if it contains game tiles
                    const tiles = node.querySelectorAll('.resource-tile');
                    tiles.forEach(tile => {
                        if (!document.getElementById(`wrapper-${tile.getAttribute('data-thread-id')}`)) {
                            addNoteSection(tile);
                        }
                    });
                }
            });
        });
    });

    observer.observe(container, {
        childList: true,
        subtree: true
    });
}

function addNoteSection(gameTile) {
    const threadId = gameTile.getAttribute('data-thread-id');
    if (!threadId) return;

    // Check if note section already exists
    if (document.getElementById(`note-section-${threadId}`)) {
        return;
    }

    // Create a wrapper div to contain both the game tile and note section
    const wrapper = document.createElement('div');
    wrapper.className = 'game-tile-wrapper';
    wrapper.id = `wrapper-${threadId}`;

    // Insert wrapper before the game tile
    gameTile.parentNode.insertBefore(wrapper, gameTile);
    
    // Move the game tile into the wrapper
    wrapper.appendChild(gameTile);

    // Create note section container
    const noteSection = document.createElement('div');
    noteSection.className = 'note-section';
    noteSection.id = `note-section-${threadId}`;
    noteSection.innerHTML = `
        <div class="note-display" id="note-display-${threadId}" style="display: none;">
            <div class="note-text" id="note-text-${threadId}"></div>
            <div class="note-buttons">
                <button class="edit-note-btn" data-thread-id="${threadId}">Edit</button>
                <button class="delete-note-btn" data-thread-id="${threadId}">Delete</button>
            </div>
        </div>
        <div class="note-edit" id="note-edit-${threadId}">
            <textarea class="note-input" id="note-input-${threadId}" placeholder="Add your personal note (visable only to you)..." rows="3"></textarea>
            <div class="note-buttons">
                <button class="save-note-btn" data-thread-id="${threadId}">Save</button>
                <button class="cancel-note-btn" data-thread-id="${threadId}">Cancel</button>
            </div>
        </div>
        <div class="note-empty" id="note-empty-${threadId}">
            <button class="add-note-btn" data-thread-id="${threadId}">+ Add Note</button>
        </div>
    `;

    // Append the note section to the wrapper (below the game tile)
    wrapper.appendChild(noteSection);

    // Add event listeners
    setupNoteEventListeners(noteSection, threadId);
    
    // Load existing note
    loadNote(threadId);
}

function setupNoteEventListeners(noteSection, threadId) {
    const addBtn = noteSection.querySelector('.add-note-btn');
    const editBtn = noteSection.querySelector('.edit-note-btn');
    const deleteBtn = noteSection.querySelector('.delete-note-btn');
    const saveBtn = noteSection.querySelector('.save-note-btn');
    const cancelBtn = noteSection.querySelector('.cancel-note-btn');
    const textarea = noteSection.querySelector('.note-input');

    // Add note
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showEditMode(threadId);
    });

    // Edit note
    editBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showEditMode(threadId);
    });

    // Delete note
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Delete this note?')) {
            // Clear the textarea immediately
            textarea.value = '';
            // Remove the note from storage entirely
            chrome.storage.local.remove([`note_${threadId}`]);
            // Update the display
            updateNoteDisplay(threadId, '');
        }
    });

    // Save note
    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const note = textarea.value.trim();
        saveNote(threadId, note);
        updateNoteDisplay(threadId, note);
    });

    // Cancel edit
    cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loadNote(threadId);
    });

    // Handle Ctrl+Enter to save
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            const note = textarea.value.trim();
            saveNote(threadId, note);
            updateNoteDisplay(threadId, note);
        }
        // Handle Escape to cancel
        if (e.key === 'Escape') {
            e.preventDefault();
            loadNote(threadId);
        }
    });
}

function showEditMode(threadId) {
    const noteDisplay = document.getElementById(`note-display-${threadId}`);
    const noteEdit = document.getElementById(`note-edit-${threadId}`);
    const noteEmpty = document.getElementById(`note-empty-${threadId}`);
    const textarea = document.getElementById(`note-input-${threadId}`);

    noteDisplay.style.display = 'none';
    noteEmpty.style.display = 'none';
    noteEdit.style.display = 'block';
    
    // Focus the textarea
    setTimeout(() => textarea.focus(), 50);
}

function updateNoteDisplay(threadId, note) {
    const noteDisplay = document.getElementById(`note-display-${threadId}`);
    const noteEdit = document.getElementById(`note-edit-${threadId}`);
    const noteEmpty = document.getElementById(`note-empty-${threadId}`);
    const noteText = document.getElementById(`note-text-${threadId}`);

    noteEdit.style.display = 'none';

    if (note) {
        noteText.textContent = note;
        noteDisplay.style.display = 'block';
        noteEmpty.style.display = 'none';
    } else {
        noteDisplay.style.display = 'none';
        noteEmpty.style.display = 'block';
    }
}

function saveNote(threadId, note) {
    if (note.trim() === '') {
        // If note is empty, remove the key entirely
        chrome.storage.local.remove([`note_${threadId}`]);
    } else {
        // Save the note
        chrome.storage.local.set({
            [`note_${threadId}`]: note
        });
    }
}

function loadNote(threadId) {
    chrome.storage.local.get([`note_${threadId}`], function(result) {
        const note = result[`note_${threadId}`] || '';
        const textarea = document.getElementById(`note-input-${threadId}`);
        if (textarea) {
            textarea.value = note;
        }
        updateNoteDisplay(threadId, note);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('Game Notes Extension loaded');