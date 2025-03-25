document.addEventListener("DOMContentLoaded", function () {

    let selectedOrderId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];
    let filteredOrders = []; // Data hasil filter
    let pesananColorMap = {}; 
    let usedColorsInPage = new Set();
    let showDoneOrders = false;

    // Define reference data objects
    let adminList = {};
    let desainerList = {};
    let kurirList = {};
    let penjahitList = {};
    let qcList = {};
    let typeProdukList = {};
    let produkList = {};

    // Add these variables at the top with other declarations
    const predefinedColors = [
        { h: 0, s: 70, l: 80 },    // Red-ish
        { h: 30, s: 70, l: 80 },   // Orange-ish
        { h: 60, s: 70, l: 80 },   // Yellow-ish
        { h: 120, s: 70, l: 80 },  // Green-ish
        { h: 180, s: 70, l: 80 },  // Cyan-ish
        { h: 210, s: 70, l: 80 },  // Light Blue-ish
        { h: 240, s: 70, l: 80 },  // Blue-ish
        { h: 270, s: 70, l: 80 },  // Purple-ish
        { h: 300, s: 70, l: 80 },  // Pink-ish
        { h: 330, s: 70, l: 80 }   // Magenta-ish
    ];

    function generateRandomColor(seed) {
        // Clear used colors when starting a new page
        if (usedColorsInPage.size >= predefinedColors.length) {
            usedColorsInPage.clear();
        }

        // Get index based on seed
        const index = Math.abs(hashCode(seed)) % predefinedColors.length;
        let color;
        let attempts = 0;
        let currentIndex = index;

        // Find first unused color
        while (attempts < predefinedColors.length) {
            color = `hsl(${predefinedColors[currentIndex].h}, ${predefinedColors[currentIndex].s}%, ${predefinedColors[currentIndex].l}%)`;
            
            if (!usedColorsInPage.has(color)) {
                usedColorsInPage.add(color);
                return color;
            }

            currentIndex = (currentIndex + 1) % predefinedColors.length;
            attempts++;
        }

        // If all colors are used (shouldn't happen with 10 predefined colors and 10 items per page)
        return `hsl(${predefinedColors[index].h}, ${predefinedColors[index].s}%, ${predefinedColors[index].l}%)`;
    }

    // Keep the existing hashCode function
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    // Initialize the page
    initApp();

    async function initApp() {
        try {
            // First load reference data
            await fetchReferenceData();
            // Then fetch orders
            await fetchOrders();
            // Add event listeners for filter and search
            setupFilterAndSearch();

            setupPaginationControls();
            // Setup PDF and Excel buttons
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    
    

    async function fetchOrders() {
        try {
            const response = await fetch("http://100.117.80.112:5000/api/get_table_design");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Data orders:", data); // Cek di console

            if (data.status === "success") {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination(allOrders);
            } else {
                console.error("Gagal mengambil data:", data.message);
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }

    // Modify the paginateOrders function
    function paginateOrders(orders) {
        // Only filter out SELESAI PRINT orders if we're not searching and showDoneOrders is false
        let ordersToDisplay = orders;
        if (!showDoneOrders && filteredOrders.length === 0) {
            ordersToDisplay = orders.filter(order => order.status_print !== "SELESAI PRINT");
        }

        // Sort orders by id_input in descending order
        const sortedOrders = [...ordersToDisplay].sort((a, b) => {
            const idA = parseInt(a.id_input?.replace(/\D/g, '') || 0);
            const idB = parseInt(b.id_input?.replace(/\D/g, '') || 0);
            return idB - idA;  // Descending order
        });

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedOrders.slice(startIndex, endIndex);
    }

    // Add toggle function
    function toggleDoneOrders() {
        showDoneOrders = !showDoneOrders;
        const toggleBtn = document.getElementById("toggleDoneBtn");
        toggleBtn.innerHTML = showDoneOrders ? 
            '<i class="fas fa-eye-slash"></i> Hide Completed Orders' : 
            '<i class="fas fa-eye"></i> Show Completed Orders';
        
        const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
        renderOrdersTable(paginateOrders(ordersToUse));
        updatePagination();
    }

    function updateTableDisplay() {
        // Determine which dataset to use
        const dataToDisplay = filteredOrders.length > 0 ? filteredOrders : allOrders;
        
        // Paginate the data
        const paginatedData = paginateOrders(dataToDisplay);
        
        // Render the table
        renderOrdersTable(paginatedData);
        
        // Update pagination
        updatePagination(dataToDisplay);
    }
    
    function updatePagination() {
        // Get current dataset (filtered or all orders)
        const currentData = filteredOrders.length > 0 ? filteredOrders : allOrders;
        
        // Get unfinished orders
        const unfinishedOrders = currentData.filter(order => order.status_print !== "SELESAI PRINT");
        const totalUnfinished = unfinishedOrders.length;
        
        // Calculate total pages based on unfinished orders count
        const totalPages = Math.ceil(totalUnfinished / itemsPerPage);

        // Ensure current page is valid
        if (currentPage > totalPages) {
            currentPage = totalPages || 1;
            updateTableDisplay();
        }

        const pageInfo = document.getElementById("pageInfo");
        const prevButton = document.getElementById("prevPage");
        const nextButton = document.getElementById("nextPage");
        const firstButton = document.getElementById("firstPage");
        const lastButton = document.getElementById("lastPage");
    
        // Update page info text
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}, ada ${totalUnfinished} pesanan 'BELUM SELESAI'`;
        
        // Update button states
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
        firstButton.disabled = currentPage <= 1;
        lastButton.disabled = currentPage >= totalPages;
    }

    function setupPaginationControls() {
        // Tombol First Page
        document.getElementById("firstPage").addEventListener("click", function() {
            currentPage = 1;
            updateTableDisplay();
        });
    
        // Tombol Last Page
        document.getElementById("lastPage").addEventListener("click", function() {
            const totalPages = Math.ceil((filteredOrders.length || allOrders.length) / itemsPerPage);
            currentPage = totalPages;
            updateTableDisplay();
        });
    
        // Tombol Previous Page
        document.getElementById("prevPage").addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage = Math.min(totalPages, currentPage - 1); // Menambah 1 halaman
                updateTableDisplay();
            }
        });
    
        // Tombol Next Page
        document.getElementById("nextPage").addEventListener("click", function() {
            const totalPages = Math.ceil((filteredOrders.length || allOrders.length) / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage = Math.min(totalPages, currentPage + 1); // Menambah 1 halaman
                updateTableDisplay();
            }
        });
    
        // Input Halaman Manual
        const pageInput = document.getElementById("pageInput");
        document.getElementById("goPage").addEventListener("click", function() {
            const totalPages = Math.ceil((filteredOrders.length || allOrders.length) / itemsPerPage);
            const pageNum = parseInt(pageInput.value, 10);
    
            if (pageNum >= 1 && pageNum <= totalPages) {
                currentPage = pageNum;
                updateTableDisplay();
            } else {
                alert(`Halaman tidak valid. Masukkan nomor antara 1 hingga ${totalPages}.`);
            }
        });
    
        // Tekan Enter pada Input Halaman
        pageInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                document.getElementById("goPage").click();
            }
        });

    }
    
    // Panggil fungsi setup kontrol pagination saat dokumen siap
    // setupPaginationControls();
    

    function setupFilterAndSearch() {
       // Add null checks before adding event listeners
       const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        const filterStatus = document.getElementById("filterStatus");
        const tanggalInput = document.getElementById("tanggal");
        const refreshButton = document.getElementById("refreshButton");
        // Add toggle button for DONE orders
        const controlsContainer = document.querySelector(".controls-container") || document.querySelector(".table-controls");
        if (controlsContainer) {
            const toggleButton = document.createElement("button");
            toggleButton.id = "toggleDoneBtn";
            toggleButton.className = "btn btn-outline-secondary ms-2";
            toggleButton.innerHTML = '<i class="fas fa-eye"></i> Show Completed Orders';
            toggleButton.onclick = toggleDoneOrders;
            controlsContainer.appendChild(toggleButton);
        }

        if (searchButton && searchInput) {
            searchButton.addEventListener("click", function() {
                performAdvancedSearch(searchInput.value);
            });
            
            searchInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    performAdvancedSearch(this.value);
                }
            });
        }
        
        if (filterStatus) {
            filterStatus.addEventListener("change", function() {
                filterOrdersByStatus(this.value);
            });
        }

        if (tanggalInput) {
            tanggalInput.addEventListener("change", function() {
                const selectedDate = this.value;
                filterOrdersByDate(selectedDate);
            });
        }
        
        if (refreshButton) {
            refreshButton.addEventListener("click", fetchOrders);
        }
        
        // Refresh button
        refreshButton.addEventListener("click", fetchOrders);
        
        // Pagination controls
        document.getElementById("prevPage").addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage--;
                const dataToPaginate = filteredOrders.length > 0 ? filteredOrders : allOrders;
                renderOrdersTable(paginateOrders(dataToPaginate));
                updatePagination();
            }
        });
    }
    

        // Fungsi untuk mendeteksi tombol Enter pada input pencarian
    function handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            const searchTerm = event.target.value;
            performAdvancedSearch(searchTerm);
        }
    }

    function resetSearch() {
        filteredOrders = [];
        currentPage = 1;
        updateTableDisplay();
        showResultPopup("Menampilkan semua data");
    }

    function performAdvancedSearch(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            resetSearch();
            return;
        }

        const searchTermLower = searchTerm.toLowerCase().trim();

        // Advanced search across multiple fields
        filteredOrders = allOrders.filter(order => {
            // Check if any field matches the search term
            const matchesSearch = Object.values(order).some(value => {
                if (value === null || value === undefined) return false;
                const stringValue = String(value).toLowerCase();
                return stringValue.includes(searchTermLower);
            }) || 
            // Check in reference lists
            (adminList[order.id_admin] && adminList[order.id_admin].toLowerCase().includes(searchTermLower)) ||
            (desainerList[order.id_desainer] && desainerList[order.id_desainer].toLowerCase().includes(searchTermLower)) ||
            (typeProdukList[order.id_type] && typeProdukList[order.id_type].toLowerCase().includes(searchTermLower)) ||
            (produkList[order.id_produk] && produkList[order.id_produk].toLowerCase().includes(searchTermLower));

            // Return true if the order matches search, regardless of its status
            return matchesSearch;
        });

        // Reset to first page after search
        currentPage = 1;
        // Use the filtered orders directly without additional filtering
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination();

        // Show search results
        showResultPopup(`Ditemukan ${filteredOrders.length} hasil pencarian.`);
    }


    // Handle date selection
    const tanggalInput = document.getElementById("tanggal");
    tanggalInput.addEventListener("change", function() {
        const selectedDate = this.value;
        
        // Tampilkan tanggal yang dipilih di console (bisa diganti aksi lain)
        console.log("Tanggal yang dipilih:", selectedDate);

        // Add null check before updating tanggalOutput
        const output = document.getElementById("tanggalOutput");
        if (output) {
            output.textContent = "Tanggal terpilih: " + new Date(selectedDate).toLocaleDateString();
        }

        // Bisa tambahkan aksi filtering berdasarkan tanggal
        filterOrdersByDate(selectedDate);
    });

    function filterOrdersByDate(selectedDate) {
        if (!selectedDate) {
            filteredOrders = allOrders; // Reset ke semua data
            updateTableDisplay();
            return;
        }

        // Filter data berdasarkan tanggal deadline
        filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.deadline).toISOString().split('T')[0];
            return orderDate === selectedDate;
        });

        currentPage = 1;
        updateTableDisplay();

        // Tampilkan pesan hasil filter
        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan dengan deadline: ${formatTanggal(selectedDate)}`);
    }



    // Replace the direct event listener attachment with a check
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeyPress);
    }


    function filterOrdersByStatus(status) {
        if (!status) {
            filteredOrders = allOrders; // Reset ke semua data
            renderOrdersTable(paginateOrders(allOrders));
            updatePagination();
            return;
        }
    
        // Filter berdasarkan status_print
        filteredOrders = allOrders.filter(order => 
            order.status_print === status
        );
    
        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination(filteredOrders);
    
        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan dengan status: ${status}`);
    }

    // Also modify the sort select event listener
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            const sortValue = this.value;
            sortOrders(sortValue);
        });
    }
    
    function sortOrders(sortValue) {
        if (!sortValue) return;
    
        const [field, direction] = sortValue.split("_");
        const fieldMap = {
            id: "id_input",
            deadline: "deadline",
            qty: "qty"
        };
        const validField = fieldMap[field] || field;
    
        const dataToSort = filteredOrders.length > 0 ? filteredOrders : allOrders;
    
        const sortedOrders = [...dataToSort].sort((a, b) => {
            if (a[validField] < b[validField]) return direction === "asc" ? -1 : 1;
            if (a[validField] > b[validField]) return direction === "asc" ? 1 : -1;
            return 0;
        });
        renderOrdersTable(paginateOrders(sortedOrders));
        updatePagination();
    }


    function highlightDeadline(dateString) {
        if (!dateString) return "-";
    
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset jam agar hanya tanggal yang diperhitungkan
    
        const deadlineDate = new Date(dateString);
        deadlineDate.setHours(0, 0, 0, 0);
    
        const timeDiff = deadlineDate - today;
        const oneDay = 24 * 60 * 60 * 1000; // Jumlah milidetik dalam sehari
    
        let backgroundColor = "#fff"; // Default warna putih
        let textColor = "#000"; // Default warna hitam
    
        if (timeDiff === 0) {
            // Jika deadline hari ini
            backgroundColor = "#ff4d4d"; // Merah
            textColor = "#fff";
        } else if (timeDiff === oneDay) {
            // Jika deadline besok
            backgroundColor = "#ffcc00"; // Kuning
            textColor = "#000";
        } else if (timeDiff > oneDay) {
            // Jika deadline masih jauh
            backgroundColor = "#28a745"; // Hijau
            textColor = "#fff";
        }
    
        return `<span style="background-color: ${backgroundColor}; color: ${textColor}; padding: 5px; border-radius: 5px;">${formatTanggal(dateString)}</span>`;
    }
    
    
    

    function formatTanggal(dateString) {
        if (!dateString) return "-";
        
        const dateObj = new Date(dateString);
        if (isNaN(dateObj)) return dateString;
    
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
    
        return `${day}-${month}-${year}`;
    }


        


    function setupImageUploadListeners() {
        // Add bulk upload button to the table header
        const tableHeader = document.querySelector('thead tr');
        if (tableHeader) {
            const uploadCell = tableHeader.querySelector('th:nth-child(9)'); // Adjust index based on your table
            if (uploadCell) {
                const bulkUploadBtn = document.createElement('button');
                bulkUploadBtn.className = 'btn btn-sm btn-primary ml-2 bulk-upload-btn';
                bulkUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload All';
                bulkUploadBtn.style.display = 'none';
                uploadCell.appendChild(bulkUploadBtn);
            }
        }
    
        // Function to check for pending uploads
        function checkPendingUploads() {
            const pendingCells = document.querySelectorAll('.image-upload-cell[data-pending-file]');
            const bulkUploadBtn = document.querySelector('.bulk-upload-btn');
            if (bulkUploadBtn) {
                bulkUploadBtn.style.display = pendingCells.length > 0 ? 'inline-block' : 'none';
            }
        }
    
        // Modify existing preview function to update bulk upload button
        const originalShowImagePreview = showImagePreview;
        window.showImagePreview = async function(file, id_input) {
            await originalShowImagePreview(file, id_input);
            checkPendingUploads();
        }
    
        // Add bulk upload modal HTML
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="bulkUploadModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Upload All Images</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="pending-uploads-container"></div>
                            <div class="upload-progress mt-3" style="display: none;">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary confirm-bulk-upload">Upload All</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    
        // Add bulk upload functionality
        document.querySelector('.bulk-upload-btn')?.addEventListener('click', async () => {
            const pendingCells = document.querySelectorAll('.image-upload-cell[data-pending-file]');
            const container = document.querySelector('.pending-uploads-container');
            container.innerHTML = '';
    
            pendingCells.forEach(cell => {
                const id_input = cell.dataset.id;
                const preview = cell.querySelector('.image-preview').src;
                container.insertAdjacentHTML('beforeend', `
                    <div class="pending-item mb-3">
                        <div class="d-flex align-items-center">
                            <img src="${preview}" style="width: 50px; height: 50px; object-fit: contain;">
                            <span class="ms-3">ID: ${id_input}</span>
                            <div class="upload-status ms-auto"></div>
                        </div>
                    </div>
                `);
            });
    
            const bulkUploadModal = new bootstrap.Modal(document.getElementById('bulkUploadModal'));
            bulkUploadModal.show();
        });
    
        // Handle bulk upload confirmation
document.querySelector('.confirm-bulk-upload')?.addEventListener('click', async () => {
    const pendingCells = document.querySelectorAll('.image-upload-cell[data-pending-file]');
    const progressBar = document.querySelector('.upload-progress');
    const progressBarInner = progressBar.querySelector('.progress-bar');
    const confirmButton = document.querySelector('.confirm-bulk-upload');
    
    try {
        // Disable the confirm button and show loading state
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        progressBar.style.display = 'block';
        
        let completed = 0;
        const totalCells = pendingCells.length;
        const results = [];

        // Process all cells in parallel with Promise.all
        await Promise.all(Array.from(pendingCells).map(async (cell) => {
            const id_input = cell.dataset.id;
            const statusDiv = document.querySelector(`.pending-item:nth-child(${completed + 1}) .upload-status`);
            
            try {
                const fileData = JSON.parse(cell.dataset.pendingFile);
                const previewImg = cell.querySelector('.image-preview');
                const file = await fetch(previewImg.src)
                    .then(res => res.blob())
                    .then(blob => new File([blob], fileData.name || 'image.png', { type: fileData.type || 'image/png' }));

                // Upload the file
                const formData = new FormData();
                formData.append('layout_file', file);
                formData.append('id_input', id_input);

                const response = await fetch('http://100.117.80.112:5000/api/update-layout', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    statusDiv.innerHTML = '<span class="text-success">✓ Success</span>';
                    results.push({ success: true, id_input, url: result.layout_url });
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                statusDiv.innerHTML = '<span class="text-danger">✗ Failed</span>';
                results.push({ success: false, id_input, error });
            }

            completed++;
            progressBarInner.style.width = `${(completed / totalCells) * 100}%`;
        }));

        // Update UI for successful uploads without page refresh
        results.forEach(result => {
            if (result.success) {
                const cell = document.querySelector(`.image-upload-cell[data-id="${result.id_input}"]`);
                if (!cell) return;

                const btnGroup = cell.querySelector('.btn-group');
                let existingViewBtn = btnGroup.querySelector('.view-link-btn');
                
                if (existingViewBtn) {
                    existingViewBtn.href = result.url;
                } else {
                    const newBtn = document.createElement('a');
                    newBtn.href = result.url;
                    newBtn.target = '_blank';
                    newBtn.className = 'btn btn-success view-link-btn';
                    newBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
                    btnGroup.appendChild(newBtn);
                }

                // Clean up UI elements
                const previewContainer = cell.querySelector('.preview-container');
                const submitBtn = cell.querySelector('.submit-image-btn');
                const fileInput = cell.querySelector('.layout-file');
                
                if (previewContainer) previewContainer.style.display = 'none';
                if (submitBtn) submitBtn.style.display = 'none';
                if (fileInput) fileInput.value = '';
                delete cell.dataset.pendingFile;
            }
        });

        // Show final status
        const successCount = results.filter(r => r.success).length;
        showResultPopup(`Successfully uploaded ${successCount} of ${totalCells} images`);

        // Close modal after all operations are complete
        setTimeout(() => {
            document.querySelector('.bulk-upload-btn').style.display = 'none';
            bootstrap.Modal.getInstance(document.getElementById('bulkUploadModal')).hide();
        }, 1500);

    } catch (error) {
        console.error('Bulk upload error:', error);
        showResultPopup('Error during bulk upload', true);
    } finally {
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Upload All';
    }
});
    
        // Clear any existing focus first
        const clearAllFocus = () => {
            document.querySelectorAll('.image-upload-cell[data-focused="true"]').forEach(cell => {
                cell.removeAttribute('data-focused');
            }, { passive: true });
        };
        
        // Focus handler to enable paste on the cell - with exclusive focusing
        document.querySelectorAll('.image-upload-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                // First clear focus from all cells
                clearAllFocus();
                // Then set focus on current cell
                cell.setAttribute('data-focused', 'true');
                // Prevent event from bubbling to document
                e.stopPropagation();
            });
        }, { passive: true });
        
        // Global paste handler for the entire document
        document.addEventListener('paste', async (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const focusedCell = document.querySelector('.image-upload-cell[data-focused="true"]');
                    if (focusedCell) {
                        e.preventDefault();
                        const id_input = focusedCell.dataset.id;
                        await showImagePreview(file, id_input);
                        // Store the file in the cell's data for later use
                        focusedCell.dataset.pendingFile = JSON.stringify({
                            name: file.name,
                            type: file.type,
                            lastModified: file.lastModified
                        });
                    }
                    break;
                }
            }
        }, { passive: true });
    
        // Click outside to remove focus attribute
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.image-upload-cell')) {
                clearAllFocus();
            }
        }, { passive: true });
    
        // File input change handler
        document.querySelectorAll('.layout-file').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const cell = e.target.closest('.image-upload-cell');
                    const id_input = cell.dataset.id;
                    await showImagePreview(file, id_input);
                    // Store the file in the cell's data
                    cell.dataset.pendingFile = JSON.stringify({
                        name: file.name,
                        type: file.type,
                        lastModified: file.lastModified
                    });
                }
            });
        }, { passive: true });
    
        // Upload button click handler
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                // Clear other focuses first
                clearAllFocus();
                // Set focus on this cell
                const cell = btn.closest('.image-upload-cell');
                cell.setAttribute('data-focused', 'true');
                
                const fileInput = document.getElementById(`file-${e.target.dataset.id}`);
                fileInput.click();
                
                // Stop propagation
                e.stopPropagation();
            });
        }, { passive: true });
    
        // Paste button click handler
        document.querySelectorAll('.paste-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                // Clear other focuses first
                clearAllFocus();
                
                const cell = e.target.closest('.image-upload-cell');
                cell.setAttribute('data-focused', 'true');
                
                // Prompt user to paste
                showResultPopup('Press Ctrl+V to paste image from clipboard', false, 2000);
                
                // Stop propagation
                e.stopPropagation();
            });
        }, { passive: true });
    
        // FIX: Improved Submit button click handler
        // Replace the submit button event listener with this improved version
        // Replace the submit button event listener with this improved version
        document.querySelectorAll('.submit-image-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                // Prevent default behavior
                e.preventDefault();
                e.stopPropagation();
                
                // Ensure we're not inside a form that could submit
                const cell = this.closest('.image-upload-cell');
                const id_input = cell.dataset.id;
                
                // Disable the button during upload
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                
                try {
                    const fileInput = document.getElementById(`file-${id_input}`);
                    let file = null;

                    if (fileInput && fileInput.files[0]) {
                        file = fileInput.files[0];
                    } else if (cell.dataset.pendingFile) {
                        const previewImg = cell.querySelector('.image-preview');
                        if (previewImg && previewImg.src) {
                            file = await fetch(previewImg.src)
                                .then(res => res.blob())
                                .then(blob => new File([blob], 'pasted-image.png', { type: 'image/png' }));
                        }
                    }

                    if (!file) {
                        showResultPopup('No file selected', true);
                        return;
                    }

                    const formData = new FormData();
                    formData.append('layout_file', file);
                    formData.append('id_input', id_input);

                    const response = await fetch('http://100.117.80.112:5000/api/update-layout', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();
                    
                    if (result.status === 'success') {
                        // Update UI without refresh
                        const btnGroup = cell.querySelector('.btn-group');
                        let viewLinkBtn = btnGroup.querySelector('.view-link-btn');
                        
                        if (viewLinkBtn) {
                            viewLinkBtn.href = result.layout_url;
                        } else {
                            const newBtn = document.createElement('a');
                            newBtn.href = result.layout_url;
                            newBtn.target = '_blank';
                            newBtn.className = 'btn btn-success view-link-btn';
                            newBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
                            btnGroup.appendChild(newBtn);
                        }

                        // Clean up UI
                        const previewContainer = cell.querySelector('.preview-container');
                        if (previewContainer) previewContainer.style.display = 'none';
                        if (fileInput) fileInput.value = '';
                        delete cell.dataset.pendingFile;
                        this.style.display = 'none';

                        // Show success message
                        showResultPopup('Layout berhasil diupload');
                    } else {
                        throw new Error(result.message || 'Upload failed');
                    }

                } catch (error) {
                    console.error('Upload failed:', error);
                    showResultPopup('Upload failed: ' + error.message, true);
                } finally {
                    // Reset button state
                    this.disabled = false;
                    this.innerHTML = 'Submit';
                }

                return false; // Ensure no form submission
            });
        });

                 // Add preview link button handler
        document.querySelectorAll('.preview-link-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cell = e.target.closest('.image-upload-cell');
                const previewContainer = cell.querySelector('.preview-container');
                const previewImage = cell.querySelector('.image-preview');
                const hideBtn = cell.querySelector('.hide-preview-btn');
                const cancelBtn = cell.querySelector('.cancel-preview');
                let imageUrl = btn.dataset.url;

                // Handle Google Drive links
                if (imageUrl.includes('drive.google.com')) {
                    // Convert share link to direct image link
                    const fileId = imageUrl.match(/[-\w]{25,}/);
                    if (fileId) {
                        imageUrl = `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
                    }
                }

                // Show loading state
                previewImage.src = ''; // Clear current image
                previewContainer.style.display = 'block';
                previewImage.style.opacity = '0.5';
                // Hide the cancel button for preview mode
                if (cancelBtn) cancelBtn.style.display = 'none';
                
                try {
                    // Load the image with CORS headers
                    await new Promise((resolve, reject) => {
                        previewImage.crossOrigin = "anonymous";
                        previewImage.onload = resolve;
                        previewImage.onerror = reject;
                        previewImage.src = imageUrl;
                    });
                    
                    // Show hide button and hide preview button
                    btn.style.display = 'none';
                    hideBtn.style.display = 'inline-block';
                    previewImage.style.opacity = '1';
                } catch (error) {
                    console.error('Preview error:', error);
                    showResultPopup('Failed to load image preview. The image might be restricted.', true);
                    previewContainer.style.display = 'none';
                }
            });
        });

        // Add hide preview button handler
        document.querySelectorAll('.hide-preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cell = e.target.closest('.image-upload-cell');
                const previewContainer = cell.querySelector('.preview-container');
                const previewBtn = cell.querySelector('.preview-link-btn');
                const cancelBtn = cell.querySelector('.cancel-preview');
                
                previewContainer.style.display = 'none';
                btn.style.display = 'none';
                previewBtn.style.display = 'inline-block';
                // Reset cancel button display for upload mode
                if (cancelBtn) cancelBtn.style.display = 'block';
            });
        }); 
    
        // Cancel preview button handler
        document.querySelectorAll('.cancel-preview').forEach(btn => {
            btn.addEventListener('click', e => {
                const cell = e.target.closest('.image-upload-cell');
                const fileInput = cell.querySelector('.layout-file');
                const submitBtn = cell.querySelector('.submit-image-btn');
                
                cell.querySelector('.preview-container').style.display = 'none';
                submitBtn.style.display = 'none';
                fileInput.value = '';
                
                // Stop propagation
                e.stopPropagation();
            });
        }, { passive: true });
        
        // Initialize multi-select feature
        initMultiSelectFeature();
    }
    
    // Update the renderOrdersTable function to include better visual indicators
    function renderOrdersTable(orders) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";
    
        // Move orderedKeys inside the function
        const orderedKeys = [
            "id_input", "id_pesanan", "platform", "qty", "id_designer", "layout_link",
            "deadline", "status_print", "timestamp", "id_produk", "id_type"
        ];
    
        orders.forEach(order => {
            // Generate or get existing color for this id_pesanan
            if (!pesananColorMap[order.id_pesanan]) {
                pesananColorMap[order.id_pesanan] = generateRandomColor(order.id_pesanan);
            }
    
            const row = document.createElement("tr");
            
            row.innerHTML = `
                <td>${formatTimes(order.timestamp) || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td style="background-color: ${pesananColorMap[order.id_pesanan]}; padding: 5px;">${order.id_pesanan || "-"}</td>
                <td>${typeProdukList[order.id_type] || "-"}</td>
                <td>${produkList[order.id_produk] || "-"}</td>
                <td style="color: ${getPlatformColor(order.platform).color}; background-color: ${getPlatformColor(order.platform).backgroundColor}; padding: 5px; border-radius: 5px;">
                    ${order.platform || "-"}
                </td>
                <td>${order.qty || "-"}</td>
                <td>
                    <select class="desainer-dropdown" data-id="${order.id_input}" data-column="desainer" 
                        onchange="updateDesainerColor(this)"
                        style="background-color: ${getColorByID(order.id_designer, 'desainer').backgroundColor}; color: ${getColorByID(order.id_designer, 'desainer').color};">
                        <option value="">Pilih Desainer</option>
                        ${Object.entries(desainerList).map(([id, nama]) =>
                            `<option value="${id}" ${order.id_designer == id ? 'selected' : ''}>${nama}</option>`
                        ).join('')}
                    </select>
                </td>
                                <td class="image-upload-cell" data-id="${order.id_input}">
                    <div class="upload-controls">
                        <div class="preview-container" style="display: none;">
                            <img class="image-preview" style="max-width: 100px; max-height: 100px;">
                            <button class="btn btn-sm btn-danger cancel-preview">&times;</button>
                        </div>
                        <div class="input-group">
                            <input type="file" 
                                id="file-${order.id_input}" 
                                class="layout-file" 
                                accept="image/*" 
                                data-id="${order.id_input}" 
                                style="display: none;">
                            <div class="btn-group">
                                <button class="btn btn-primary upload-btn" data-id="${order.id_input}" title="Upload image">
                                    <i class="fas fa-camera"></i>
                                </button>
                                ${order.layout_link ? `
                                    <a href="${order.layout_link}" target="_blank" class="btn btn-success view-link-btn">
                                        <i class="fas fa-external-link-alt"></i>
                                    </a>
                                    <button class="btn btn-info preview-link-btn" data-url="${order.layout_link}" title="Show preview">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-secondary hide-preview-btn" style="display: none;" title="Hide preview">
                                        <i class="fas fa-eye-slash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary submit-image-btn" style="display: none;" data-id="${order.id_input}">
                            Submit
                        </button>
                    </div>
                </td>
                <td>${formatTanggal(highlightDeadline(order.deadline)) || "-"}</td>
                <td>
                    <select class="status-print option" data-id="${order.id_input}" data-column="print_status">
                        <option value="-" ${order.status_print === '-' ? 'selected' : ''}>-</option>
                        <option value="EDITING" ${order.status_print === 'EDITING' ? 'selected' : ''}>EDITING</option>
                        <option value="PRINT VENDOR" ${order.status_print === 'PRINT VENDOR' ? 'selected' : ''}>PRINT VENDOR</option>
                        <option value="PROSES PRINT" ${order.status_print === 'PROSES PRINT' ? 'selected' : ''}>PROSES PRINT</option>
                        <option value="SELESAI PRINT" ${order.status_print === 'SELESAI PRINT' ? 'selected' : ''}>SELESAI PRINT</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="desc-table" data-id="${order.id_input}"><i class="fas fa-info-circle"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        addDeleteEventListeners();
        addUpdateEventListeners();
        addInputChangeEventListeners();
        addDescriptionEventListeners();
        // Add event listeners for image uploads after rendering
        setupImageUploadListeners();
    }
    
    async function showImagePreview(file, id_input) {

        const cell = document.querySelector(`.image-upload-cell[data-id="${id_input}"]`);
        if (!cell) return;
    
        const previewContainer = cell.querySelector('.preview-container');
        const previewImage = cell.querySelector('.image-preview');
        const submitBtn = cell.querySelector('.submit-image-btn');
    
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => {
                previewImage.src = e.target.result;
                previewContainer.style.display = 'block';
                submitBtn.style.display = 'block';
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }
    
    async function uploadImage(file, id_input) {
        const formData = new FormData();
        formData.append('layout_file', file);
        formData.append('id_input', id_input);
    
        try {
            const response = await fetch('http://100.117.80.112:5000/api/update-layout', {
                method: 'POST',
                body: formData
            });
    
            const result = await response.json();
            
            if (result.status === 'success') {
                // Update UI without refresh
                const cell = document.querySelector(`.image-upload-cell[data-id="${id_input}"]`);
                const btnGroup = cell.querySelector('.btn-group');
                
                // Update or add view link button
                let viewLinkBtn = btnGroup.querySelector('.view-link-btn');
                if (viewLinkBtn) {
                    viewLinkBtn.href = result.layout_url;
                } else {
                    const newBtn = document.createElement('a');
                    newBtn.href = result.layout_url;
                    newBtn.target = '_blank';
                    newBtn.className = 'btn btn-success view-link-btn';
                    newBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
                    btnGroup.appendChild(newBtn);
                }
                
                showResultPopup('Layout berhasil diupload');
                return result;
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            throw error;
        }
    }
    
    // Add this function to enable multi-select and multi-paste functionality
    function setupMultiSelectPasteFunction() {
        // Keep track of selected cells
        let selectedCells = [];
        
        // Function to visually highlight selected cells
        function updateSelectedCellsUI() {
            // Clear all highlights first
            document.querySelectorAll('.image-upload-cell').forEach(cell => {
                cell.classList.remove('multi-selected');
            });
            
            // Apply highlight to selected cells
            selectedCells.forEach(cell => {
                cell.classList.add('multi-selected');
            });
            
            // Show selection count if more than one cell is selected
            const selectionCount = selectedCells.length;
            let selectionCountEl = document.getElementById('multi-selection-count');
            
            if (selectionCount > 1) {
                if (!selectionCountEl) {
                    selectionCountEl = document.createElement('div');
                    selectionCountEl.id = 'multi-selection-count';
                    selectionCountEl.className = 'fixed-bottom m-3 p-2 bg-primary text-white rounded';
                    selectionCountEl.style.width = 'auto';
                    selectionCountEl.style.left = 'auto';
                    selectionCountEl.style.right = '20px';
                    selectionCountEl.style.bottom = '20px';
                    selectionCountEl.style.zIndex = '1050';
                    document.body.appendChild(selectionCountEl);
                }
                selectionCountEl.innerHTML = `<i class="fas fa-th-large"></i> ${selectionCount} cells selected`;
                selectionCountEl.style.display = 'block';
            } else if (selectionCountEl) {
                selectionCountEl.style.display = 'none';
            }
        }
        
        // Add CSS for highlighting selected cells
        const style = document.createElement('style');
        style.textContent = `
            .image-upload-cell.multi-selected {
                background-color: rgba(0, 123, 255, 0.15);
                outline: 2px dashed #007bff;
            }
        `;
        document.head.appendChild(style);
        
        // Add click handler to all image upload cells
        document.querySelectorAll('.image-upload-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                // Check if Ctrl/Cmd key is pressed
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Toggle selection for this cell
                    const cellIndex = selectedCells.indexOf(cell);
                    if (cellIndex === -1) {
                        // Add to selection
                        selectedCells.push(cell);
                    } else {
                        // Remove from selection
                        selectedCells.splice(cellIndex, 1);
                    }
                    
                    updateSelectedCellsUI();
                } else {
                    // Regular click behavior (already handled in existing code)
                    // But we'll clear multi-selection when clicking without Ctrl
                    if (selectedCells.length > 0) {
                        selectedCells = [];
                        updateSelectedCellsUI();
                    }
                }
            });
        });
        
        // Add paste handler to document
        document.addEventListener('paste', async (e) => {
            // Only process if we have selected cells
            if (selectedCells.length > 0) {
                const items = e.clipboardData.items;
                for (let item of items) {
                    if (item.type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        
                        // Show progress indicator
                        let progressEl = document.getElementById('multi-paste-progress');
                        if (!progressEl) {
                            progressEl = document.createElement('div');
                            progressEl.id = 'multi-paste-progress';
                            progressEl.className = 'fixed-bottom p-3 bg-dark text-white';
                            progressEl.style.zIndex = '1100';
                            document.body.appendChild(progressEl);
                        }
                        progressEl.innerHTML = `<div class="progress">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div class="text-center mt-2">Processing image for multiple cells...</div>`;
                        progressEl.style.display = 'block';
                        
                        // For each selected cell, show preview and store file
                        for (let i = 0; i < selectedCells.length; i++) {
                            const cell = selectedCells[i];
                            const id_input = cell.dataset.id;
                            
                            // Update progress
                            const progressBar = progressEl.querySelector('.progress-bar');
                            progressBar.style.width = `${(i / selectedCells.length) * 100}%`;
                            
                            // Show preview
                            await showImagePreview(file, id_input);
                            
                            // Store file data
                            cell.dataset.pendingFile = JSON.stringify({
                                name: file.name || 'pasted-image.png',
                                type: file.type || 'image/png',
                                lastModified: file.lastModified || new Date().getTime()
                            });
                        }
                        
                        // Hide progress and show success message
                        progressEl.style.display = 'none';
                        showResultPopup(`Image pasted to ${selectedCells.length} cells successfully. Click "Submit" in each cell to upload.`, false, 3000);
                        
                        // Show bulk upload button if available
                        checkPendingUploads();
                        
                        break;
                    }
                }
            }
        });
        
        // Clear selection when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.image-upload-cell') && !e.ctrlKey && !e.metaKey) {
                selectedCells = [];
                updateSelectedCellsUI();
            }
        });
        
        // Add keyboard shortcut for submission (Ctrl+Enter)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && selectedCells.length > 0) {
                e.preventDefault();
                
                // Ask for confirmation before bulk upload
                if (confirm(`Submit images for ${selectedCells.length} selected cells?`)) {
                    // Trigger upload for all selected cells
                    selectedCells.forEach(cell => {
                        const submitBtn = cell.querySelector('.submit-image-btn');
                        if (submitBtn && submitBtn.style.display !== 'none') {
                            submitBtn.click();
                        }
                    });
                }
            }
        });
        
        // Add a global keyboard shortcut for selecting all cells (Ctrl+A)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                
                // Select all image upload cells
                selectedCells = Array.from(document.querySelectorAll('.image-upload-cell'));
                updateSelectedCellsUI();
                
                showResultPopup(`Selected ${selectedCells.length} cells. Press Ctrl+V to paste image to all selected cells.`, false, 2000);
            }
        });
        
        // Add info tooltip/instructions
        const infoElement = document.createElement('div');
        infoElement.className = 'card bg-light mb-3 fixed-bottom';
        infoElement.style.width = '300px';
        infoElement.style.right = '20px';
        infoElement.style.bottom = '20px';
        infoElement.style.opacity = '0.9';
        infoElement.style.zIndex = '1000';
        
        infoElement.innerHTML = `
            <div class="card-header">
                <b>Multi-select Tips</b>
                <button type="button" class="close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="card-body">
                <ul class="mb-0 ps-3">
                    <li>Press Ctrl+Click to select multiple cells</li>
                    <li>Press Ctrl+V to paste image to all selected cells</li>
                    <li>Press Ctrl+Enter to submit all selected cells</li>
                    <li>Press Ctrl+A to select all cells</li>
                </ul>
            </div>
        `;
        
        document.body.appendChild(infoElement);
        
        // Add close button functionality
        infoElement.querySelector('.close').addEventListener('click', () => {
            infoElement.style.display = 'none';
        });
        
        // Auto-hide info after 10 seconds
        setTimeout(() => {
            infoElement.style.display = 'none';
        }, 10000);
    }
    
    // Function to check for pending uploads (moved out of setupImageUploadListeners for reference)
    function checkPendingUploads() {
        const pendingCells = document.querySelectorAll('.image-upload-cell[data-pending-file]');
        const bulkUploadBtn = document.querySelector('.bulk-upload-btn');
        if (bulkUploadBtn) {
            bulkUploadBtn.style.display = pendingCells.length > 0 ? 'inline-block' : 'none';
        }
    }
    
    // Call this function after renderOrdersTable
    function initMultiSelectFeature() {
        // Wait for the DOM to be fully loaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setupMultiSelectPasteFunction();
        } else {
            document.addEventListener('DOMContentLoaded', setupMultiSelectPasteFunction);
        }
    }
    
    

    

    function getColorByID(id, table) {
        let color = "white"; // Default warna teks
    
        if (table === 'desainer') {
            if (id === 1101) return { color, backgroundColor: "purple" };  // Desainer IMAM
            if (id === 1102) return { color, backgroundColor: "red" };     // Desainer JHODI
        }
        return { color: "black", backgroundColor: "transparent" }; // Default
    }
    




    function getPlatformColor(platform) {
        const colors = {
            "Shopee": { color: "#FFFFFF", backgroundColor: "#EE4D2D" },   // Oranye Shopee
            "TikTok": { color: "#FFFFFF", backgroundColor: "#000000" },   // Hitam TikTok
            "Tokopedia": { color: "#FFFFFF", backgroundColor: "#00AA5B" }, // Hijau Tokopedia
            "Lazada": { color: "#FFFFFF", backgroundColor: "#1A4DBE" },   // Biru Lazada
            "WhatsApp": { color: "#FFFFFF", backgroundColor: "#25D366" }  // Hijau WhatsApp
        };
    
        return colors[platform] || { color: "#FFFFFF", backgroundColor: "#333" }; // Default warna abu-abu gelap
    }


    
    function formatTimes(deadline) {
        if (!deadline) return "-"; 
        const date = new Date(deadline);  // Date() mengubah ke zona waktu lokal
    
        const utcDay = String(date.getUTCDate()).padStart(2, '0');
        const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const utcYear = date.getUTCFullYear();
        const utcHours = String(date.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
    
        return `${utcDay}-${utcMonth}-${utcYear} | ${utcHours}:${utcMinutes}`;
    }
    
    function addInputChangeEventListeners() {
        // ✅ Event listener untuk input layout link (diperbarui saat blur)
        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("blur", function() {
                const id_pesanan = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrder(id_pesanan, column, value);
            });
        });

        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("keypress", function(event) {
                if (event.key === "Enter") { // Jika tombol yang ditekan adalah Enter
                    event.preventDefault(); // Mencegah submit form default (jika ada)
                    this.blur(); // Trigger event blur agar langsung submit
                    const id_pesanan = this.dataset.id;
                    const column = this.dataset.column;
                    const value = this.value;
        
                    updateOrder(id_pesanan, column, value);
                }

            });
        });
    
        // ✅ Event listener untuk tombol submit link
        document.querySelectorAll(".submit-link-btn").forEach(button => {
            button.addEventListener("click", function() {
                const id_pesanan = this.dataset.id;
                const input = document.querySelector(`.layout-link-input[data-id="${id_pesanan}"]`);
                const value = input.value.trim();
    
                if (value) {
                    updateOrderWithConfirmation(id_pesanan, "layout_link", value);
                } else {
                    alert("Masukkan link sebelum submit.");
                }
            });
        });
    
        // ✅ Event listener untuk tombol membuka link di tab baru
        document.querySelectorAll(".open-link-btn").forEach(button => {
            button.addEventListener("click", function() {
                const id_pesanan = this.dataset.id;
                const input = document.querySelector(`.layout-link-input[data-id="${id_pesanan}"]`);
                const link = input.value.trim();
    
                if (link) {
                    window.open(link, "_blank");
                } else {
                    alert("Link belum tersedia.");
                }
            });
        });
    
        // ✅ Event listener untuk dropdown status produksi (diperbarui saat diubah)
        document.querySelectorAll(".status-print").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrder(id_input, column, value); // Pastikan fungsi dipanggil dengan parameter yang benar
            });
    
            updateSelectColor(select); // ✅ Pindahkan ini agar dijalankan setelah event listener ditambahkan
        });
    
        // ✅ Fungsi untuk mengubah warna berdasarkan status print
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `status-print option-${selectedValue}`;
        }
    }    
    
    async function fetchReferenceData() {
        try {
            const response = await fetch("http://100.117.80.112:5000/api/references");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            
            // Safely update reference lists
            if (data.table_admin) adminList = Object.fromEntries(data.table_admin.map(a => [a.ID, a.nama]));
            if (data.table_desainer) desainerList = Object.fromEntries(data.table_desainer.map(d => [d.ID, d.nama]));
            if (data.table_kurir) {
                data.table_kurir.forEach(k => kurirList[k.ID] = k.nama);
            }
            if (data.table_penjahit) {
                data.table_penjahit.forEach(p => penjahitList[p.ID] = p.nama);
            }
            if (data.table_qc) {
                data.table_qc.forEach(q => qcList[q.ID] = q.nama);
            }
            if (data.table_type_produk) {
                data.table_type_produk.forEach(t => typeProdukList[t.id_type] = t.kategori);
            }
            if (data.table_produk) {
                data.table_produk.forEach(pr => produkList[pr.id_produk] = pr.nama_produk);
            }
    
            console.log("Reference data loaded successfully");
        } catch (error) {
            console.error("Failed to fetch reference data:", error);
            showResultPopup("Failed to load reference data. Some features might not work properly.", true);
        }
    }   

    function addDescriptionEventListeners() {
        document.querySelectorAll(".desc-table").forEach(item => {
            item.addEventListener("click", function () {
                const orderId = this.getAttribute("data-id");
                fetchOrderDescription(orderId);
            });
        });
    }
    
    function fetchOrderDescription(orderId) {
        const order = allOrders.find(order => order.id_input == orderId);
        if (order) {
            showDescriptionModal(order);
        } else {
            showResultPopup("Deskripsi pesanan tidak ditemukan.", true);
        }
    }

    async function fetchLinkFoto(id_input) {
        if (!id_input || id_input === "-") {
            console.warn("ID tidak valid:", id_input);
            return "-";
        }
    
        try {
            const response = await fetch(`http://100.117.80.112:5000/api/get_link_foto/${id_input}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data || !data.data || typeof data.data.link !== "string") {
                console.warn("Format response tidak valid atau link kosong:", data);
                return "-";
            }
            
            return data.data.link;
    
        } catch (error) {
            console.error("Error fetching link foto:", error);
            return "-";
        }
    }

    async function showDescriptionModal(order) {
        if (!order.id_input) {
            console.error("ID Input tidak valid:", order);
            return;
        }
        const adminName = await fetchAdminId(order.id_input);
        const ketNama = await fetchNamaKet(order.id_input); 

        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
            
            modalBody.innerHTML = `
                <tr><th>ID INPUT</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>Admin</th><td>${adminName}</td></tr>
                <tr><th>Timestamp</th><td>${order.timestamp || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Desainer</th><td>${desainerList[order.id_designer] || "-"}</td></tr>
                <tr><th>Status Print</th><td><span class="badge ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td></tr>
                <tr><th>Layout Link</th><td>${
                    order.layout_link 
                    ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>`
                    : "-"
                }</td></tr>
                <tr><th>Link Foto</th><td>
                    ${linkFoto && linkFoto !== "-" 
                        ? `<div class="d-flex flex-column align-items-start gap-2">
                            <div class="image-thumbnail mb-2">
                                <img src="${linkFoto}" alt="Order Photo" 
                                     onclick="window.open('${linkFoto}', '_blank')"
                                     onerror="this.onerror=null; this.src='path/to/fallback-image.png';">
                            </div>
                            <a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-image"></i> Lihat Foto
                            </a>
                           </div>`
                        : "Tidak Tersedia"}
                    </td></tr>
                <tr> 
                <tr>
                    <th>Detail Pesanan</th>
                    <td style="white-space: pre-line;">${ketNama || "-"}</td>
                </tr>
                `;

            window.currentOrder = order;
            const orderModal = document.getElementById("orderModal");
            const modal = new bootstrap.Modal(orderModal);
            modal.show();
            
        } catch (error) {
            console.error("Error showing modal:", error);
            modalBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">Gagal memuat data pesanan: ${error.message}</td></tr>`;
        }
    }

    async function fetchNamaKet(idInput) {
        const baseUrl = "http://100.117.80.112:5000"; // Sesuaikan dengan URL API kamu
        const url = `${baseUrl}/api/get_nama_ket/${idInput}`;
    
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            
            // Pastikan mengembalikan hanya `nama_ket` agar tidak error
            return data.nama_ket || "Tidak ada keterangan"; 
    
        } catch (error) {
            console.error("Gagal mengambil keterangan pesanan:", error);
            return "Error mengambil data"; 
        }
    }
    

    async function fetchAdminId(id_input) {
        if (!id_input || id_input === "-") {
            console.warn("❌ ID Input tidak valid:", id_input);
            return "-";
        }
    
        try {
            const response = await fetch(`http://100.117.80.112:5000/api/get_id_admin/${id_input}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data || !data.id_admin) {
                console.warn("⚠️ ID Admin tidak ditemukan untuk:", id_input);
                return "-";
            }
            
            return adminList[data.id_admin] || data.id_admin; // Ambil nama admin atau ID jika tidak ada di list
        
        } catch (error) {
            console.error("❌ Error fetching ID Admin:", error);
            return "-";
        }
    }
    
    
    function getBadgeClass(status) {
        switch(status) {
            case '-': return 'bg-primary text-white';
            case 'SEDANG DI-PRESS': return 'bg-indigo text-white';
            case 'SEDANG DI-JAHIT': return 'bg-success text-white';
            case 'TAS SUDAH DI-JAHIT': return 'bg-teal text-white';
            case 'REJECT : PRINT ULANG': return 'bg-danger text-white';
            case 'TAS BLM ADA': return 'bg-danger text-white';
            case 'DONE': return 'bg-success text-white';
            default: return 'bg-secondary text-white';
        }
    }
    
    
    function addDeleteEventListeners() {
        document.querySelectorAll(".delete-icon").forEach(icon => {
            icon.addEventListener("click", function() {
                selectedOrderId = this.getAttribute("data-id");
                
                const deletePopup = document.getElementById("deletePopup");
                deletePopup.classList.add("active");
            });
        });
        
        // Add event listeners for popup buttons
        document.getElementById("confirmDelete").addEventListener("click", handleConfirmDelete);
        document.getElementById("cancelDelete").addEventListener("click", handleCancelDelete);
    }
    
    function handleConfirmDelete() {
        if (!selectedOrderId) {
            showResultPopup("Error: ID pesanan tidak valid.", true);
            return;
        }
    
        const confirmDeleteBtn = document.getElementById("confirmDelete");
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    
        // Corrected endpoint to use id_input instead of id_pesanan
        fetch(`http://100.117.80.112:5000/api/delete-order/${encodeURIComponent(selectedOrderId.trim())}`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                showResultPopup("Pesanan berhasil dihapus!");
                fetchOrders(); // Refresh the order list
            } else {
                showResultPopup(`Gagal menghapus: ${data.message || "Unknown error"}`, true);
            }
        })
        .catch(error => {
            console.error("Error saat menghapus pesanan:", error);
            showResultPopup(`Terjadi kesalahan: ${error.message}`, true);
        })
        .finally(() => {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Ya, Hapus';
            document.getElementById("deletePopup").classList.remove("active");
            selectedOrderId = null;
        });
    }
    
    function handleCancelDelete() {
        document.getElementById("deletePopup").classList.remove("active");
        selectedOrderId = null;
    }
    
    function showResultPopup(message, isError = false) {
        const popup = document.getElementById("resultPopup");
        const resultMessage = document.getElementById("resultMessage");
        
        resultMessage.innerText = message;
        if (isError) {
            popup.style.backgroundColor = "#ff3f5b";
        } else {
            popup.style.backgroundColor = "#1a73e8";
        }
        
        popup.classList.add("show");
    
        setTimeout(() => {
            popup.classList.remove("show");
        }, 3000);
    }
    
    function updateOrderWithConfirmation(id_input, column, value) {
        const confirmPopup = document.getElementById("confirmUpdatePopup");
        const confirmMessage = document.getElementById("confirmUpdateMessage");
        
        // Get the display name for the column based on selected value
        let displayValue = value;
        if (column === "id_designer" && desainerList[value]) {
            displayValue = desainerList[value];
        }
        
        // Column display name for user interface
        let columnDisplay = column;
        switch(column) {
            case "id_designer": columnDisplay = "Desainer"; break;
            case "status_print": columnDisplay = "Status Print"; break;
            case "layout_link": columnDisplay = "Layout Link"; break;
        }
        
        confirmMessage.innerText = `Yakin ingin update ${columnDisplay} menjadi "${displayValue}" untuk ID Pesanan ${id_input}?`;
        confirmPopup.classList.add("active");
        
        // Store the update details for use in event handlers
        confirmPopup.dataset.id = id_input;
        confirmPopup.dataset.column = column;
        confirmPopup.dataset.value = value;
    }
    
    function addUpdateEventListeners() {
        // For all dropdowns with data-column attribute (print-status and desainer)
        document.querySelectorAll("select[data-column]").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                let column = this.dataset.column;
                const value = this.value;
                
                // Map the column names to match the API expectations
                if (column === "print_status") {
                    column = "status_print";
                } else if (column === "desainer") {
                    column = "id_designer";
                }
                
                updateOrder(id_input, column, value);
            });
        });
        
        // Confirm update button
        document.getElementById("confirmUpdateBtn").addEventListener("click", function() {
            const popup = document.getElementById("confirmUpdatePopup");
            const id_input = popup.dataset.id;
            const column = popup.dataset.column;
            const value = popup.dataset.value;
            
            updateOrder(id_input, column, value);
            popup.classList.remove("active");
        });
        
        // Cancel update button
        document.getElementById("cancelUpdateBtn").addEventListener("click", function() {
            const popup = document.getElementById("confirmUpdatePopup");
            popup.classList.remove("active");
            
            // Reset the dropdown/input to its original value
            const selector = `[data-id="${popup.dataset.id}"][data-column="${popup.dataset.column}"]`;
            const element = document.querySelector(selector);
            
            if (element) {
                const originalOrder = allOrders.find(order => order.id_input == popup.dataset.id);
                if (originalOrder && element.tagName === "SELECT") {
                    // Map back from API field names to UI field names
                    let fieldName = popup.dataset.column;
                    if (fieldName === "status_print") {
                        fieldName = "print_status";
                    } else if (fieldName === "id_designer") {
                        fieldName = "desainer";
                    }
                    element.value = originalOrder[fieldName] || "";
                } else if (originalOrder && element.tagName === "INPUT") {
                    let fieldName = popup.dataset.column;
                    if (fieldName === "layout_link") {
                        fieldName = "layout_link"; // Note capital L in "Layout_link"
                    }
                    element.value = originalOrder[fieldName] || "";
                }
            }
        });
    }
    
    function updateOrder(id_input, column, value) {
        const endpoint = "http://100.117.80.112:5000/api/update-design";
        
        // Check if confirmUpdateBtn exists before accessing
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        if (confirmUpdateBtn) {
            confirmUpdateBtn.disabled = true;
            confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        }
    
        // Buat format JSON sesuai yang diharapkan API
        const payload = {
            id_input: id_input,
            id_designer: null,
            layout_link: null,
            status_print: null
        };
    
        // Pastikan field yang diubah dimasukkan ke dalam JSON
        if (column === "id_designer") {
            payload.id_designer = value;
        } else if (column === "layout_link") {
            payload.layout_link = value;
        } else if (column === "status_print") {
            payload.status_print = value;
        }
    
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Gagal update! Status: ${response.status}`);
            } 
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                const isZero = value === 0 || value === "0";
                const popupMessage = `Update berhasil: ${column} -> ${value}`;
                
                showResultPopup(popupMessage, isZero);
                
                // Only try to update container style if it exists
                const container = document.getElementById("tableContainer");
                if (container && isZero) {
                    container.style.backgroundColor = "#e74c3c";
                }
                
                // Refresh the orders after successful update
                fetchOrders();
            }
        })
        .catch(error => {
            console.error("Error updating order:", error);
            showResultPopup("Gagal mengupdate data: " + error.message, true);
        })
        .finally(() => {
            if (confirmUpdateBtn) {
                confirmUpdateBtn.disabled = false;
                confirmUpdateBtn.innerHTML = 'Confirm Update';
            }
        });
    }
    
    
});