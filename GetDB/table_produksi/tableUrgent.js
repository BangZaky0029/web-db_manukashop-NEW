document.addEventListener("DOMContentLoaded", function () {
    let currentPage = 1;
    let itemsPerPage = 1000;
    let allOrders = [];
    let filteredOrders = []; // Data hasil filter

    // Define reference data objects
    let adminList = {};
    let desainerList = {};
    let penjahitList = {};
    let qcList = {};
    let typeProdukList = {};
    let produkList = {};

    // Create loading overlay function
    function showLoadingOverlay() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        
        loadingOverlay.appendChild(spinner);
        document.body.appendChild(loadingOverlay);
    }

    function hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Initialize the page
    initApp();
    
    async function initApp() {
        try {
            // Show loading overlay
            showLoadingOverlay();
            
            // First load reference data
            await fetchReferenceData();
            // Then fetch orders
            await fetchOrders();
            // Add event listeners for filter and search
            setupFilterAndSearch();
            // Setup PDF and Excel buttons
            setupDownloadButtons();
            
            // setupAutoRefresh();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        } finally {
            // Hide loading overlay once everything is loaded
            hideLoadingOverlay();
        }
    }

    // Function to simulate potential longer loading time
        function simulateSlowLoading() {
            return new Promise(resolve => {
                setTimeout(resolve, Math.random() * 1500 + 500); // Random delay between 500-2000ms
            });
        }


// =================================================================================================== //
                                          // API ENDPOINT //
// =================================================================================================== //

    
    async function fetchReferenceData() {
        try {
            const response = await fetch("http://100.124.58.32:5000/api/references");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (data.table_type_produk) {
                data.table_type_produk.forEach(t => typeProdukList[t.id_type] = t.kategori);
            }
            if (data.table_produk) {
                data.table_produk.forEach(pr => produkList[pr.id_produk] = pr.nama_produk);
            }
    
            console.log("Reference data loaded successfully");
    
        } catch (error) {
            console.error("Gagal mengambil data referensi:", error);
            showResultPopup("Gagal memuat data referensi. Beberapa fitur mungkin tidak berfungsi dengan baik.", true);
        }
    }

    
    
    async function fetchOrders() {
        try {
            const response = await fetch("http://100.124.58.32:5000/api/get_table_urgent");
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("Data orders:", data); // Debugging
    
            if (data.status === "success" && Array.isArray(data.data)) {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination(allOrders);
            } else {
                console.error("Gagal mengambil data:", data.message || "Format response salah");
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }


    async function fetchLayoutLink(id_input) {
        try {
            const response = await fetch(`http://100.124.58.32:5000/api/get-layout?id_input=${encodeURIComponent(id_input)}`);
            const data = await response.json();
    
            if (response.ok && data.length > 0) {
                return data[0].layout_link || "-"; // Mengembalikan link jika ada
            }
            return "-"; // Jika tidak ada data, kembalikan "-"
        } catch (error) {
            console.error("Error fetching layout link:", error);
            return "-";
        }
    }

    async function fetchNamaKet(idInput) {
        const baseUrl = "http://100.124.58.32:5000"; // Sesuaikan dengan URL API kamu
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

    async function fetchLinkFoto(id_input) {
        if (!id_input || id_input === "-") {
            console.warn("ID tidak valid:", id_input);
            return "-";
        }
    
        try {
            const response = await fetch(`http://100.124.58.32:5000/api/get_link_foto/${id_input}`);
            
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




// =================================================================================================== //
                                          // API ENDPOINT //
// =================================================================================================== //






// =================================================================================================== //
                                          // FILTER SEARCH //
// =================================================================================================== //



    function setupFilterAndSearch() {
        // Enhanced Search functionality
        const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        const filterStatus = document.getElementById("filterStatus");
        const sortSelect = document.getElementById("sortSelect"); // Add a sort dropdown

        // Advanced search with multiple criteria
        searchButton.addEventListener("click", function() {
            performAdvancedSearch(searchInput.value);
        });

        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                performAdvancedSearch(this.value);
            }
        });

        // Enhanced Status Filter
        filterStatus.addEventListener("change", function() {
            filterOrdersByStatus(this.value);
        });

        // Add sorting functionality
        sortSelect.addEventListener("change", function() {
            sortOrders(this.value);
        });

        function resetSearch() {
            // Clear search input
            document.getElementById("searchInput").value = '';
            document.getElementById("filterStatus").value = '';
            document.getElementById("sortSelect").value = '';

            // Reset to original state
            filteredOrders = [];
            currentPage = 1;
            updateTableDisplay();
        }

        // Refresh button
        const refreshButton = document.getElementById("refreshButton");
        refreshButton.addEventListener("click", function() {
            resetSearch();
        });

        // Pagination controls
        document.getElementById("prevPage").addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage--;
                updateTableDisplay();
            }
        });
    }

// =================================================================================================== //
                                          // FILTER SEARCH //
// =================================================================================================== //


// =================================================================================================== //
                                          // PAGINATION //
// =================================================================================================== //


    function updatePagination(orders) {
        const totalOrders = orders.length;
        const totalPages = Math.ceil(totalOrders / itemsPerPage);
        const pageInfo = document.getElementById("pageInfo");
        const prevButton = document.getElementById("prevPage");
        const nextButton = document.getElementById("nextPage");
        const firstButton = document.getElementById("firstPage");
        const lastButton = document.getElementById("lastPage");

        // Pastikan currentPage tidak melebihi total halaman
        if (currentPage > totalPages) currentPage = totalPages;

        // Update halaman informasi
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
        
        // Disable/Enable tombol sesuai halaman
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
        firstButton.disabled = currentPage <= 1;
        lastButton.disabled = currentPage >= totalPages;
    }


    function paginateOrders(orders) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return orders.slice(startIndex, endIndex);
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
    
    function updateTableDisplay() {
        const ordersToDisplay = filteredOrders.length > 0 ? filteredOrders : allOrders;
        const paginatedOrders = paginateOrders(ordersToDisplay);
        renderOrdersTable(paginatedOrders);
        updatePagination(ordersToDisplay);
    }
    
    
    // Panggil fungsi setup kontrol pagination saat dokumen siap
    setupPaginationControls();
    // Updated performAdvancedSearch function with proper checks for null/undefined in references:

    
    function performAdvancedSearch(searchTerm) {
        if (!searchTerm.trim()) {
            resetSearch();
            return;
        }

        const searchTermLower = searchTerm.toLowerCase().trim();

        // Advanced search across multiple fields
        filteredOrders = allOrders.filter(order => {
            // Search across all possible string fields
            return Object.values(order).some(value => {
                // Convert to string and check if it includes the search term
                if (value === null || value === undefined) return false;
                
                const stringValue = String(value).toLowerCase();
                return stringValue.includes(searchTermLower);
            }) || 
            // Check in reference lists
            (adminList[order.id_admin] && adminList[order.id_admin].toLowerCase().includes(searchTermLower)) ||
            (desainerList[order.id_desainer] && desainerList[order.id_desainer].toLowerCase().includes(searchTermLower)) ||
            (penjahitList[order.id_penjahit] && penjahitList[order.id_penjahit].toLowerCase().includes(searchTermLower)) ||
            (qcList[order.id_qc] && qcList[order.id_qc].toLowerCase().includes(searchTermLower)) ||
            (typeProdukList[order.id_type] && typeProdukList[order.id_type].toLowerCase().includes(searchTermLower)) ||
            (produkList[order.id_produk] && produkList[order.id_produk].toLowerCase().includes(searchTermLower));
        });

        // Reset to first page after search
        currentPage = 1;
        updateTableDisplay();

        // Show search results
        showResultPopup(`Ditemukan ${filteredOrders.length} hasil pencarian.`);
    }


    function updateTableDisplay() {
        const ordersToDisplay = filteredOrders.length > 0 ? filteredOrders : allOrders;
        renderOrdersTable(paginateOrders(ordersToDisplay));
        updatePagination(ordersToDisplay);
    }


    // Updated searchOrders function with checks for undefined/null values:
    function searchOrders(searchTerm) {
        if (!searchTerm.trim()) {
            renderOrdersTable(paginateOrders(allOrders));
            updatePagination();
            return;
        }

        const searchTermLower = searchTerm.toLowerCase().trim();

        filteredOrders = allOrders.filter(order => {
            return (
                (order.id_input && order.id_input.toLowerCase().includes(searchTermLower)) ||
                (order.id_pesanan && order.id_pesanan.toLowerCase().includes(searchTermLower)) ||
                (order.platform && order.platform.toLowerCase().includes(searchTermLower)) ||
                (order.status_print && order.status_print.toLowerCase().includes(searchTermLower)) ||
                (order.status_produksi && order.status_produksi.toLowerCase().includes(searchTermLower))
            );
        });

        filteredOrders.sort((a, b) => {
            // Sorting logic
        });

        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination();

        showResultPopup(`🔍 Ditemukan ${filteredOrders.length} hasil pencarian.`);
    }

    

    function filterOrdersByStatus(status) {
        if (!status) {
            renderOrdersTable(paginateOrders(allOrders));
            updatePagination();
            return;
        }
        
        const filteredOrders = allOrders.filter(order => 
            order.print_status === status
        );
        
        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination();
        
        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan dengan status: ${status}`);
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
    
    function renderOrdersTable(orders) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";

        // Sort orders: today first, then future, then past
        const today = new Date().setHours(0, 0, 0, 0);

        orders.sort((a, b) => {
            const deadlineA = new Date(a.deadline).setHours(0, 0, 0, 0);
            const deadlineB = new Date(b.deadline).setHours(0, 0, 0, 0);

            // Prioritaskan deadline hari ini
            if (deadlineA === today && deadlineB !== today) return -1;
            if (deadlineB === today && deadlineA !== today) return 1;

            // Urutkan deadline yang akan datang setelah hari ini
            if (deadlineA > today && deadlineB > today) return deadlineA - deadlineB;

            // Urutkan deadline yang sudah lewat di bagian bawah
            if (deadlineA < today && deadlineB < today) return deadlineB - deadlineA;

            // Jika tidak masuk kategori khusus, urutkan default
            return deadlineA - deadlineB;
        });


        orders.forEach(order => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.id_input || "-"}</td>
                <td>${order.id_pesanan || "-"}</td>
                <td>${typeProdukList[order.id_type] || "-"}</td>
                <td>${produkList[order.id_produk] || "-"}</td>
                <td style="color: ${getPlatformColor(order.platform).color}; background-color: ${getPlatformColor(order.platform).backgroundColor}; padding: 5px; border-radius: 5px;">
                    ${order.platform || "-"}
                </td>
                <td>${order.qty || "-"}</td>
                <td>${highlightDeadline(order.deadline)}</td>
                <td><span class="badge_input ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td>
                <td><span class="badge_input ${getBadgeClass(order.status_produksi)}">${order.status_produksi || "-"}</span></td>
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="desc-table" data-id="${order.id_input}"><i class="fas fa-info-circle"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addUpdateEventListeners();
        addInputChangeEventListeners();
        addDescriptionEventListeners();
    }


    function getBadgeClass(status) {
        switch(status) {
            case '-': return 'option-default';
            case 'EDITING': return 'option-EDITING';
            case 'PRINT VENDOR': return 'option-PRINT-VENDOR';
            case 'PROSES PRINT': return 'option-PROSES-PRINT';
            case 'SELESAI PRINT': return 'option-SELESAI-PRINT';
            case 'SEDANG DI PRESS': return 'option-SEDANG-DI-PRESS';
            case 'SEDANG DI JAHIT': return 'option-SEDANG-DI-JAHIT';
            case 'TAS SUDAH DI JAHIT': return 'option-TAS-SUDAH-DI-JAHIT';
            case 'REJECT PRINT ULANG': return 'option-REJECT-PRINT-ULANG';
            case 'TAS BLM ADA': return 'option-TAS-BLM-ADA';
            case 'DONE': return 'option-DONE';
            default: return 'option-default';
        }
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


    function addInputChangeEventListeners() {
        // Event listener untuk dropdown status produksi
        document.querySelectorAll(".status-produksi").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrderWithConfirmation(id_input, column, value);
            });
    
            updateSelectColor(select);
        });
    
        // Fungsi untuk mengubah warna berdasarkan status produksi
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `status-produksi option-${selectedValue}`;
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


    async function showDescriptionModal(order) {
        if (!order.id_input) {
            console.error("ID Input tidak valid:", order);
            return;
        }
    
        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        const nama_ket = await fetchNamaKet(order.id_input);
        const layoutLink = await fetchLayoutLink(order.id_input);
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
    
            modalBody.innerHTML = `
                <tr><th>ID Input</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>ID Input</th><td>${order.id_pesanan || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Status Print</th><td>${order.status_print || "-"}</td></tr>
                <tr><th>Status Produksi</th><td>${order.status_produksi || "-"}</td></tr>
                <tr><th>Layout Link</th><td>
                    ${layoutLink && layoutLink !== "-" ? `<a href="${layoutLink}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i>LIHAT LAYOUT PRINT</a>` : "Tidak Tersedia"}
                </td></tr>
                <tr><th>Link Foto</th><td>
                ${linkFoto && linkFoto !== "-" ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>` : "Tidak Tersedia"}
                </td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr>
                    <th>Detail Pesanan</th>
                    <td style="white-space: pre-line;">${nama_ket || "-"}</td>
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
        if (column === "penjahit" && penjahitList[value]) {
            displayValue = penjahitList[value];
        } else if (column === "qc" && qcList[value]) {
            displayValue = qcList[value];
        }

        
        // Column display name
        let columnDisplay = column;
        switch(column) {
            case "penjahit": columnDisplay = "Penjahit"; break;
            case "qc": columnDisplay = "QC"; break;
            case "status_produksi": columnDisplay = "Status Produksi"; break;
        }
        
        confirmMessage.innerText = `Yakin ingin update ${columnDisplay} menjadi "${displayValue}" untuk ID Pesanan ${id_input}?`;
        confirmPopup.classList.add("active");
        
        // Store the update details for use in event handlers
        confirmPopup.dataset.id = id_input;
        confirmPopup.dataset.column = column;
        confirmPopup.dataset.value = value;
    }
    
    function addUpdateEventListeners() {
        // For all dropdowns with data-column attribute
        document.querySelectorAll("select[data-column]").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                let value = this.value;
        
                // Update with confirmation dialog
                updateOrderWithConfirmation(id_input, column, value);
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
                    element.value = originalOrder[popup.dataset.column] || "";
                } else if (originalOrder && element.tagName === "INPUT") {
                    element.value = originalOrder[popup.dataset.column] || "";
                }
            }
        });
    }

    // Setup download buttons if they exist
    function setupDownloadButtons() {
        const pdfButton = document.getElementById("downloadPDF");
        const excelButton = document.getElementById("downloadExcel");
        
        if (pdfButton) {
            pdfButton.addEventListener("click", function() {
                // Implement PDF download functionality
                showResultPopup("Downloading PDF...");
            });
        }
        
        if (excelButton) {
            excelButton.addEventListener("click", function() {
                // Implement Excel download functionality
                showResultPopup("Downloading Excel...");
            });
        }
    }
});