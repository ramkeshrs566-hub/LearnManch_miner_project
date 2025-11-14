// books.js
// IndexedDB wrapper and UI logic

const DB_NAME = '';
const STORE_NAME = 'books';
let db = null;

/* ---------- IndexedDB helpers ---------- */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains(STORE_NAME)) {
                idb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = e => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = e => reject(e.target.error);
    });
}

function addBookToDB(record) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function getAllBooksFromDB() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function getBookById(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(Number(id));
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function deleteBookFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(Number(id));
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
    });
}

/* ---------- UI & App Logic ---------- */
const form = document.getElementById('bookForm');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const categoryInput = document.getElementById('category');
const fileInput = document.getElementById('fileInput');
const booksList = document.getElementById('booksList');
const searchBox = document.getElementById('searchBox');
const filterCategory = document.getElementById('filterCategory');
const clearFormBtn = document.getElementById('clearForm');

async function init() {
    await openDB();
    renderBooks();
    attachListeners();
}

function attachListeners() {
    form.addEventListener('submit', onFormSubmit);
    searchBox.addEventListener('input', renderBooks);
    filterCategory.addEventListener('change', renderBooks);
    clearFormBtn.addEventListener('click', () => form.reset());
}

async function onFormSubmit(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
        alert('Please choose a file.');
        return;
    }

    // Read file as blob (it's already a File which is Blob)
    const record = {
        title: titleInput.value.trim() || file.name,
        author: authorInput.value.trim() || 'Unknown',
        category: categoryInput.value,
        filename: file.name,
        fileType: file.type || '',
        uploadedAt: Date.now(),
        fileBlob: file // store File object (Blob) directly in IndexedDB
    };

    try {
        await addBookToDB(record);
        form.reset();
        renderBooks();
        alert('Book uploaded to local library successfully!');
    } catch (err) {
        console.error(err);
        alert('Failed to save book: ' + err);
    }
}

function makeCardElement(book) {
    const card = document.createElement('div');
    card.className = 'book-card';

    const top = document.createElement('div');
    top.className = 'book-top';
    const thumb = document.createElement('div');
    thumb.className = 'book-thumb';
    // use first letter of title or extension icon
    const ext = (book.filename || '').split('.').pop().toUpperCase();
    thumb.textContent = ext === 'PDF' ? 'PDF' : (ext || 'BK');

    const meta = document.createElement('div');
    meta.className = 'book-meta';
    const h3 = document.createElement('h3');
    h3.textContent = book.title;
    const p = document.createElement('p');
    p.textContent = `${book.author} • ${book.category}`;

    meta.appendChild(h3);
    meta.appendChild(p);
    top.appendChild(thumb);
    top.appendChild(meta);

    const info = document.createElement('div');
    info.style.fontSize = '12px';
    info.style.color = '#9ed9ff';
    const date = new Date(book.uploadedAt);
    info.textContent = `File: ${book.filename} • Uploaded: ${date.toLocaleString()}`;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn view';
    viewBtn.textContent = 'View';
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn';
    downloadBtn.textContent = 'Download';
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete';
    delBtn.textContent = 'Delete';

    viewBtn.addEventListener('click', async() => {
        const rec = await getBookById(book.id);
        if (!rec) return alert('Book not found');
        const blob = rec.fileBlob;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // revoke later (browser frees when tab closed)
        setTimeout(() => URL.revokeObjectURL(url), 60 _000);
    });

    downloadBtn.addEventListener('click', async() => {
        const rec = await getBookById(book.id);
        if (!rec) return alert('Book not found');
        const blob = rec.fileBlob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = rec.filename || 'book';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    });

    delBtn.addEventListener('click', async() => {
        if (!confirm('Delete this book from your local library?')) return;
        await deleteBookFromDB(book.id);
        renderBooks();
    });

    actions.appendChild(viewBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(delBtn);

    card.appendChild(top);
    card.appendChild(info);
    card.appendChild(actions);

    return card;
}

async function renderBooks() {
    booksList.innerHTML = '';
    try {
        const all = await getAllBooksFromDB();
        const q = (searchBox.value || '').trim().toLowerCase();
        const cat = filterCategory.value;

        let filtered = all.filter(b => {
            const matchQ = q === '' ||
                (b.title && b.title.toLowerCase().includes(q)) ||
                (b.author && b.author.toLowerCase().includes(q)) ||
                (b.filename && b.filename.toLowerCase().includes(q));
            const matchCat = cat === 'all' || b.category === cat;
            return matchQ && matchCat;
        });

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = 'No books found. Upload a book to get started.';
            booksList.appendChild(empty);
            return;
        }

        // sort by newest first
        filtered.sort((a, b) => b.uploadedAt - a.uploadedAt);

        filtered.forEach(b => {
            const card = makeCardElement(b);
            booksList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        booksList.innerHTML = '<div class="empty">Could not load books — check console for errors.</div>';
    }
}

// init app
init();