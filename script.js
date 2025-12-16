let berkasList = [];
let editIndex = -1;

// Load data dari localStorage saat halaman dimuat
window.onload = function() {
    loadFromStorage();
    renderTable();
    updateStats();
    updateClock();
    setInterval(updateClock, 1000);
};

// Update jam
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
}

// Load data dari localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('berkasList');
    if (saved) {
        berkasList = JSON.parse(saved);
    }
}

// Save data ke localStorage
function saveToStorage() {
    localStorage.setItem('berkasList', JSON.stringify(berkasList));
}

// Toggle form
function toggleForm() {
    const form = document.getElementById('formContainer');
    const isActive = form.classList.contains('active');
    
    if (isActive) {
        form.classList.remove('active');
    } else {
        form.classList.add('active');
        editIndex = -1;
        document.getElementById('formTitle').textContent = 'Tambah Berkas Baru';
        document.getElementById('berkasForm').reset();
    }
}

// Cancel form
function cancelForm() {
    document.getElementById('formContainer').classList.remove('active');
    document.getElementById('berkasForm').reset();
    editIndex = -1;
}

// Save berkas
function saveBerkas(event) {
    event.preventDefault();
    
    const berkas = {
        nomor: document.getElementById('nomor').value,
        tanggal: document.getElementById('tanggal').value,
        direktur: document.getElementById('direktur').value,
        pt: document.getElementById('pt').value,
        desa: document.getElementById('desa').value,
        kecamatan: document.getElementById('kecamatan').value,
        luas: document.getElementById('luas').value,
        peruntukan: document.getElementById('peruntukan').value
    };

    if (editIndex >= 0) {
        berkasList[editIndex] = berkas;
        showNotification('Berkas berhasil diupdate!', 'success');
    } else {
        berkasList.push(berkas);
        showNotification('Berkas berhasil ditambahkan!', 'success');
    }

    saveToStorage();
    renderTable();
    updateStats();
    cancelForm();
}

// Edit berkas
function editBerkas(index) {
    editIndex = index;
    const berkas = berkasList[index];
    
    document.getElementById('nomor').value = berkas.nomor;
    document.getElementById('tanggal').value = berkas.tanggal;
    document.getElementById('direktur').value = berkas.direktur;
    document.getElementById('pt').value = berkas.pt;
    document.getElementById('desa').value = berkas.desa;
    document.getElementById('kecamatan').value = berkas.kecamatan;
    document.getElementById('luas').value = berkas.luas;
    document.getElementById('peruntukan').value = berkas.peruntukan;
    
    document.getElementById('formTitle').textContent = 'Edit Berkas';
    document.getElementById('formContainer').classList.add('active');
}

// Delete berkas
function deleteBerkas(index) {
    if (confirm('Apakah Anda yakin ingin menghapus berkas ini?')) {
        berkasList.splice(index, 1);
        saveToStorage();
        renderTable();
        updateStats();
        showNotification('Berkas berhasil dihapus!', 'success');
    }
}

// Search berkas
function searchBerkas() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredList = berkasList.filter(berkas => {
        return Object.values(berkas).some(value => 
            value.toString().toLowerCase().includes(searchTerm)
        );
    });
    renderTable(filteredList);
}

// Render table
function renderTable(list = berkasList) {
    const tbody = document.getElementById('tableBody');
    
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3>Tidak ada data ditemukan</h3>
                    <p>Coba dengan kata kunci lain atau tambah data baru</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map((berkas, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${berkas.nomor}</td>
            <td>${formatDate(berkas.tanggal)}</td>
            <td>${berkas.direktur}</td>
            <td>${berkas.pt}</td>
            <td>${berkas.desa}</td>
            <td>${berkas.kecamatan}</td>
            <td>${berkas.luas}</td>
            <td>${berkas.peruntukan}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-edit" onclick="editBerkas(${berkasList.indexOf(berkas)})">Edit</button>
                    <button class="btn btn-small btn-delete" onclick="deleteBerkas(${berkasList.indexOf(berkas)})">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Update stats
function updateStats() {
    document.getElementById('totalBerkas').textContent = berkasList.length;
    
    const totalLuas = berkasList.reduce((sum, berkas) => {
        const luas = parseFloat(berkas.luas.replace(/[^0-9.-]/g, '')) || 0;
        return sum + luas;
    }, 0);
    
    document.getElementById('totalLuas').textContent = totalLuas.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    });
}

// Import Excel
function importExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Map Excel columns to our format
            jsonData.forEach(row => {
                const berkas = {
                    nomor: row['Nomor'] || row['nomor'] || '',
                    tanggal: formatExcelDate(row['Tanggal'] || row['tanggal']),
                    direktur: row['Direktur'] || row['direktur'] || '',
                    pt: row['PT'] || row['pt'] || '',
                    desa: row['Desa'] || row['desa'] || row['DESA'] || '',
                    kecamatan: row['Kecamatan'] || row['kecamatan'] || '',
                    luas: String(row['Luas'] || row['luas'] || '0'),
                    peruntukan: row['Peruntukan'] || row['peruntukan'] || ''
                };
                berkasList.push(berkas);
            });

            saveToStorage();
            renderTable();
            updateStats();
            showNotification(`Berhasil import ${jsonData.length} data dari Excel!`, 'success');
        } catch (error) {
            showNotification('Gagal import Excel. Pastikan format file benar!', 'error');
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// Format Excel date
function formatExcelDate(excelDate) {
    if (!excelDate) return new Date().toISOString().split('T')[0];
    
    // If already a string date
    if (typeof excelDate === 'string') {
        return excelDate.split('T')[0];
    }
    
    // Excel date number
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
}

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}