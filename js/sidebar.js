export class SidebarManager {
    constructor(sidebarElement, entriesListElement) {
        this.sidebar = sidebarElement;
        this.entriesList = entriesListElement;
        this.entries = [];
        this.selectedEntryId = null;
        this.onEntrySelect = null;
        this.onEntryDelete = null;
        this.onEntryExport = null;
    }

    toggle() {
        this.sidebar.classList.toggle('hidden');
    }

    show() {
        this.sidebar.classList.remove('hidden');
    }

    hide() {
        this.sidebar.classList.add('hidden');
    }

    isVisible() {
        return !this.sidebar.classList.contains('hidden');
    }

    setEntries(entries) {
        this.entries = entries;
        this.render();
    }

    setSelectedEntry(entryId) {
        this.selectedEntryId = entryId;
        this.updateSelection();
    }

    render() {
        while (this.entriesList.firstChild) {
            this.entriesList.removeChild(this.entriesList.firstChild);
        }

        this.entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            this.entriesList.appendChild(entryElement);
        });
    }

    createEntryElement(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'entry-item';
        entryDiv.dataset.entryId = entry.id;
        entryDiv.title = 'Click to select this entry';

        if (entry.id === this.selectedEntryId) {
            entryDiv.classList.add('selected');
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'entry-content';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'entry-header';

        const previewDiv = document.createElement('div');
        previewDiv.className = 'entry-preview';
        previewDiv.textContent = entry.previewText || 'Empty entry';
        headerDiv.appendChild(previewDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'entry-actions';

        const exportBtn = document.createElement('button');
        exportBtn.className = 'entry-action-btn export';
        const exportIcon = document.createElement('i');
        exportIcon.className = 'ti ti-download';
        exportBtn.appendChild(exportIcon);
        exportBtn.title = 'Export entry as PDF';
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onEntryExport) {
                this.onEntryExport(entry);
            }
        });
        actionsDiv.appendChild(exportBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'entry-action-btn delete';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'ti ti-trash';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.title = 'Delete entry';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this entry?')) {
                if (this.onEntryDelete) {
                    this.onEntryDelete(entry);
                }
            }
        });
        actionsDiv.appendChild(deleteBtn);

        headerDiv.appendChild(actionsDiv);
        contentDiv.appendChild(headerDiv);

        const dateDiv = document.createElement('div');
        dateDiv.className = 'entry-date';
        dateDiv.textContent = entry.date;
        contentDiv.appendChild(dateDiv);

        entryDiv.appendChild(contentDiv);

        entryDiv.addEventListener('click', () => {
            if (this.onEntrySelect) {
                this.onEntrySelect(entry);
            }
        });

        return entryDiv;
    }

    updateSelection() {
        const allEntries = this.entriesList.querySelectorAll('.entry-item');
        allEntries.forEach(entryEl => {
            entryEl.classList.remove('selected');
        });

        if (this.selectedEntryId) {
            const selectedElement = this.entriesList.querySelector(`[data-entry-id="${this.selectedEntryId}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    updateEntry(entry) {
        const index = this.entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
            this.entries[index] = entry;
            this.render();
        }
    }

    addEntry(entry) {
        this.entries.unshift(entry);
        this.render();
    }

    removeEntry(entryId) {
        this.entries = this.entries.filter(e => e.id !== entryId);
        this.render();
    }

    onSelectEntry(callback) {
        this.onEntrySelect = callback;
    }

    onDeleteEntry(callback) {
        this.onEntryDelete = callback;
    }

    onExportEntry(callback) {
        this.onEntryExport = callback;
    }

    getSelectedEntryId() {
        return this.selectedEntryId;
    }
}
