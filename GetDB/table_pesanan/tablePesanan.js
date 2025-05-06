document.addEventListener("DOMContentLoaded", function () {
    let selectedOrderId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];
    let filteredOrders = []; // Data hasil filter
    
    // Define reference data objects
    let adminList = {};
    let desainerList = {};
    let kurirList = {};
    let penjahitList = {};
    let qcList = {};
    let typeProdukList = {};
    let produkList = {};
    let bahanList = {};


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
            // Setup PDF and Excel buttons
            setupDownloadButtons();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }
    const confirmButton = document.getElementById("confirmAdminCode");
    const cancelButton = document.getElementById("cancelAdminCode");

    if (confirmButton) {
        confirmButton.addEventListener("click", verifyAdminCode);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", cancelAdminCode);
    }

    async function fetchOrders() {
        try {
            const response = await fetch("http://100.117.80.112:5000/api/get-orders");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Data orders:", data); // Cek di console
    
            if (data.status === "success") {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination(allOrders); // Kirim allOrders sebagai parameter
            } else {
                console.error("Gagal mengambil data:", data.message);
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }

    
    
    function paginateOrders(orders) {
        // Sort orders by id_input in descending order
        const sortedOrders = [...orders].sort((a, b) => {
            const idA = parseInt(a.id_input?.replace(/\D/g, '') || 0);
            const idB = parseInt(b.id_input?.replace(/\D/g, '') || 0);
            return idB - idA;  // Descending order (highest to lowest)
        });

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedOrders.slice(startIndex, endIndex);
    }

    function updatePagination(orders) {
        const totalOrders = orders.length;
        const totalPages = Math.ceil(totalOrders / itemsPerPage);
        const pageInfo = document.getElementById("pageInfo");
        const prevButton = document.getElementById("prevPage");
        const nextButton = document.getElementById("nextPage");
        const firstButton = document.getElementById("firstPage");
        const lastButton = document.getElementById("lastPage");
        
    
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
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
    setupPaginationControls();
    

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

    function setupFilterAndSearch() {
        // Enhanced Search functionality
        const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        const filterStatus = document.getElementById("filterStatus");
        const sortSelect = document.getElementById("sortSelect"); // Add a sort dropdown
        // Add deadline filter functionality
        const deadlineFilter = document.getElementById("tanggal");
        deadlineFilter.addEventListener("change", function() {
            filterOrdersByDeadline(this.value);
        });

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

        // Add this new function
        function filterOrdersByDeadline(selectedDate) {
            if (!selectedDate) {
                // If no date selected, show all orders
                filteredOrders = [];
                currentPage = 1;
                updateTableDisplay();
                return;
            }
        
            // Create start and end dates for the selected date
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
        
            // Filter orders by deadline
            filteredOrders = allOrders.filter(order => {
                if (!order.deadline) return false;
                const orderDate = new Date(order.deadline);
                return orderDate >= startDate && orderDate <= endDate;
            });
        
            // Sort filtered orders by deadline
            filteredOrders.sort((a, b) => {
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                return dateA - dateB;
            });
        
            // Reset to first page
            currentPage = 1;
            updateTableDisplay();
        
            // Show result message
            const resultCount = filteredOrders.length;
            const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            showResultPopup(`Ditemukan ${resultCount} pesanan dengan deadline: ${formattedDate}`);
        }

        // Add reset functionality to the refresh button
    document.getElementById("refreshButton").addEventListener("click", function() {
        // ... existing reset code ...
        document.getElementById("tanggal").value = ''; // Reset date filter
        // ... rest of reset code ...
    });

    function sortOrders(sortBy) {
        if (!sortBy) {
            // If no sort selected, maintain current view
            return;
        }

        // Determine the sorting logic based on the selected option
        const sortedData = [...(filteredOrders.length > 0 ? filteredOrders : allOrders)].sort((a, b) => {
            switch(sortBy) {
                case 'id_asc':
                    return (a.id_input || 0) - (b.id_input || 0);
                case 'id_desc':
                    return (b.id_input || 0) - (a.id_input || 0);
                case 'deadline_asc':
                    return new Date(a.deadline || 0) - new Date(b.deadline || 0);
                case 'deadline_desc':
                    return new Date(b.deadline || 0) - new Date(a.deadline || 0);
                case 'qty_asc':
                    return (a.qty || 0) - (b.qty || 0);
                case 'qty_desc':
                    return (b.qty || 0) - (a.qty || 0);
                default:
                    return 0;
            }
        });

        // Update the filtered or all orders with sorted data
        if (filteredOrders.length > 0) {
            filteredOrders = sortedData;
        } else {
            allOrders = sortedData;
        }

        // Reset to first page and update display
        currentPage = 1;
        updateTableDisplay();

        showResultPopup(`Data diurutkan berdasarkan: ${sortBy}`);
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

    // Add this to your existing filterOrders function
function filterOrders() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const selectedStatus = document.getElementById("filterStatus").value;
    const selectedDate = document.getElementById("tanggal").value;

    filteredOrders = allOrders.filter(order => {
        // Search filter
        const searchMatch = (order.id_input && order.id_input.toString().toLowerCase().includes(searchTerm)) ||
                          (order.id_pesanan && order.id_pesanan.toString().toLowerCase().includes(searchTerm));

        // Status filter
        let statusMatch = true;
        if (selectedStatus) {
            if (selectedStatus === "BELUM DONE") {
                // Check if either status_produksi OR status_print is "-"
                statusMatch = (order.status_produksi === "-" || order.status_print === "-");
            } else {
                statusMatch = order.status_produksi === selectedStatus;
            }
        }

        // Date filter
        let dateMatch = true;
        if (selectedDate) {
            const orderDate = order.deadline ? order.deadline.split('T')[0] : null;
            dateMatch = orderDate === selectedDate;
        }

        return searchMatch && statusMatch && dateMatch;
    });

    // Reset to first page and update display
    currentPage = 1;
    updateTableDisplay();
}


    function filterOrdersByStatus(status) {
        if (!status) {
            // If no status selected, show all orders
            filteredOrders = [];
            currentPage = 1;
            updateTableDisplay();
            return;
        }
        
        // Filter orders by exact status match
        filteredOrders = allOrders.filter(order => 
            order.status_print === status || order.status_produksi === status
        );
        
        // Reset to first page
        currentPage = 1;
        updateTableDisplay();
        
        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan dengan status: ${status}`);
    }
    
    function getColorByID(id, table) {
        // Mengembalikan warna teks dan background berdasarkan ID dan tabelnya (admin, desainer, kurir, dll)
        let color = "dark white"; // Warna teks tetap putih

        if (table === 'admin') {
            if (id === 1001) return { color, backgroundColor: "pink" }; // Admin Lilis
            if (id === 1002) return { color, backgroundColor: "olive" }; // Admin Ina
            if (id === 1003) return { color, backgroundColor: "yellow" }; // Admin Indy
            if (id === 1004) return { color : "white", backgroundColor: "blue" }; // Admin Untung,
            if (id === 1005) return { color : "white", backgroundColor: "red" }; // Admin Billa
        } else if (table === 'desainer') {
            if (id === 1101) return { color, backgroundColor: "purple" }; // Desainer IMAM
            if (id === 1102) return { color, backgroundColor: "red" }; // Desainer JHODI
        } else if (table === 'kurir') {
            if (id === 1501) return { color, backgroundColor: "orange" }; // Kurir teddy
            if (id === 1502) return { color, backgroundColor: "coral" }; // Kurir Mas Nur
            if (id === 1503) return { color, backgroundColor: "tomato" }; // Kurir Jhodi
        } else if (table === 'penjahit') {
            if (id === 1301) return { color, backgroundColor: "green" }; // Penjahit Mas Ari
            if (id === 1302) return { color, backgroundColor: "indigo" }; // Penjahit Mas Saep
            if (id === 1303) return { color, backgroundColor: "violet" }; // Penjahit Mas Egeng
            if (id === 1304) return { color, backgroundColor: "fireBrick" };
            if (id === 1305) return { color, backgroundColor: "darkOrchid" };
        } else if (table === 'qc') {
            if (id === 1401) return { color, backgroundColor: "yellowgreen" }; // QC tita
            if (id === 1402) return { color, backgroundColor: "olive" }; // QC ina
            if (id === 1403) return { color, backgroundColor: "pink" }; // QC lilis
        }
    
        return { color: "black", backgroundColor: "transparent" };
    }
    
    
    async function renderOrdersTable(orders) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";
    
        for (const order of orders) {
            const row = document.createElement("tr");
    
            // Dapatkan warna teks dan background berdasarkan ID
            const adminColor = getColorByID(order.id_admin, 'admin');
            const desainerColor = getColorByID(order.id_desainer, 'desainer');
            const penjahitColor = getColorByID(order.id_penjahit, 'penjahit');
            const qcColor = getColorByID(order.id_qc, 'qc');
    
            row.innerHTML = `
                <td>${formatTimes(order.timestamp) || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td>${order.id_pesanan || "-"}</td>
                <td>${typeProdukList[order.id_type] || "-"}</td>
                <td>${produkList[order.id_produk] || "-"}</td>
                <td style="color: ${getPlatformColor(order.platform).color}; background-color: ${getPlatformColor(order.platform).backgroundColor}; padding: 5px; border-radius: 5px;">
                    ${order.platform || "-"}
                </td>
                <td style="color: ${adminColor.color}; background-color: ${adminColor.backgroundColor}; padding: 5px; border-radius: 5px;">${adminList[order.id_admin] || "-"}</td>
                <td>${order.qty || "-"}</td>
                <td>${highlightDeadline(order.deadline)}</td>
                <td style="color: ${desainerColor.color}; background-color: ${desainerColor.backgroundColor}; padding: 5px; border-radius: 5px;">${desainerList[order.id_desainer] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_designer) || "-"}</td>
                <td>
                    ${order.layout_link ? `<a href="${order.layout_link}" target="_blank">Lihat Layout</a>` : "-"}
                </td>
                <td style="color: ${penjahitColor.color}; background-color: ${penjahitColor.backgroundColor}; padding: 5px; border-radius: 5px;">${penjahitList[order.id_penjahit] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_penjahit) || "-"}</td>
                <td style="color: ${qcColor.color}; background-color: ${qcColor.backgroundColor}; padding: 5px; border-radius: 5px;">${qcList[order.id_qc] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_qc) || "-"}</td>
                <td><span class="badge_input ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td>
                <td><span class="badge_input ${getBadgeClass(order.status_produksi)}">${order.status_produksi || "-"}</span></td>
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="delete-icon" data-id="${order.id_input}"><i class="fas fa-trash-alt"></i></button>
                        <button class="desc-table" data-id="${order.id_input}"><i class="fas fa-info-circle"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        }
        addDeleteEventListeners();
        addUpdateEventListeners();
        addInputChangeEventListeners();
        addDescriptionEventListeners();
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
    
    

    function formatTanggal(dateString) {
        if (!dateString) return "-";
        
        const dateObj = new Date(dateString);
        if (isNaN(dateObj)) return dateString;
    
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    
        return `${day}-${month}`;
    }
    
    function formatTimes(deadline) {
        if (!deadline) return "-"; 
        const date = new Date(deadline);  // Date() mengubah ke zona waktu lokal
    
        const utcDay = String(date.getUTCDate()).padStart(2, '0');
        const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const utcYear = date.getUTCFullYear();
        const utcHours = String(date.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
    
        return `${utcDay}-${utcMonth} | ${utcHours}:${utcMinutes}`;
    }
    
    
    

    async function fetchSortedOrders() {
        try {
            console.log("Fetching sorted orders...");
            const response = await fetch('http://100.117.80.112:5000/api/get_sorted_orders'); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            
            console.log("Data pesanan yang diterima:", data.orders); // Debugging
    
            if (data.orders) {
                console.table(data.orders); // Tambahkan debugging untuk melihat data
                renderOrdersTable(data.orders);
            } else {
                console.error("Data orders tidak ditemukan");
            }
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        }
    }
    
    
    

    
    
    
    

    function formatTimestamp(timestamp) {
        // Jika timestamp kosong, return string kosong
        if (!timestamp) return "";
    
        // Ubah timestamp menjadi objek Date
        let date = new Date(timestamp);
    
        // Format jam dan menit
        let hours = String(date.getHours()).padStart(2, "0");
        let minutes = String(date.getMinutes()).padStart(2, "0");
    
        // Format tanggal dan bulan
        let day = String(date.getDate()).padStart(2, "0");
        let month = String(date.getMonth() + 1).padStart(2, "0"); // Ingat! Bulan di JS dimulai dari 0
    
        return `${hours}:${minutes} / ${day}-${month}`;
    }
    
    // Contoh data dari database
    const timestamps = [
        "2025-03-03T16:28:00Z",
        "2025-01-01T07:00:00Z",
        null, // Field kosong di database
        "2025-03-03T16:23:00Z",
        "2025-03-03T16:24:00Z"
    ];
    
    function addInputChangeEventListeners() {
        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("blur", function() {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
                
                updateOrderWithConfirmation(id_input, column, value);
            });
        document.querySelectorAll(".print-status-dropdown").forEach(select => {
            updateSelectColor(select);
    
            select.addEventListener("change", function () {
                updateSelectColor(select);
            });
        });
    
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `print-status-dropdown option-${selectedValue}`;
        }
        
        
        });
    }

    async function fetchReferenceData() {
    try {
        const response = await fetch("http://100.117.80.112:5000/api/references");
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.table_admin) {
            data.table_admin.forEach(a => adminList[a.ID] = a.nama);
        }
        if (data.table_desainer) {
            data.table_desainer.forEach(d => desainerList[d.ID] = d.nama);
        }
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
        if (data.table_bahan) {
            data.table_bahan.forEach(b => bahanList[b.id_bahan] = b.bahan);
        }

        console.log("Reference data loaded successfully");

    } catch (error) {
        console.error("Gagal mengambil data referensi:", error);
        showResultPopup("Gagal memuat data referensi. Beberapa fitur mungkin tidak berfungsi dengan baik.", true);
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
    
        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        const detail = await fetchNamaKet(order.id_input);
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
            
            function applyColor(id, table) {
                const style = getColorByID(id, table);
                return `style="
                    color: ${style.color}; 
                    background-color: ${style.backgroundColor}; 
                    padding: 2px 8px; 
                    border-radius: 5px; 
                    font-size: 13px; 
                    font-family: 'Poppins', sans-serif; 
                    font-weight: 500;
                    letter-spacing: -0.3px; 
                    display: inline-flex; 
                    margin: 4px 7px;
                    align-items: center;"`;
            }
            
    
            modalBody.innerHTML = `
                <tr><th>ID Input</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>ID Pesanan</th><td>${order.id_pesanan || "-"}</td></tr>
                <tr><th>Admin</th><td ${applyColor(order.id_admin, 'admin')}>${adminList[order.id_admin] || "-"}</td></tr>
                <tr><th>Timestamp</th><td>${formatTimes(order.timestamp) || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Desainer</th><td ${applyColor(order.id_desainer, 'desainer')}>${desainerList[order.id_desainer] || "-"}</td></tr>
                <tr><th>Status Print</th><td><span class="badge ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td></tr>
                <tr><th>Status Produksi</th><td><span class="badge ${getBadgeClass(order.status_produksi)}">${order.status_produksi || "-"}</span></td></tr>
                <tr><th>Layout Link</th><td>
                    ${order.layout_link ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>` : "-"}
                    </td></tr>
                <tr><th>Penjahit</th><td ${applyColor(order.id_penjahit, 'penjahit')}>${penjahitList[order.id_penjahit] || "-"}</td></tr>
                <tr><th>QC</th><td ${applyColor(order.id_qc, 'qc')}>${qcList[order.id_qc] || "-"}</td></tr>
                <tr><th>Link Foto</th><td>
                    ${linkFoto && linkFoto !== "-" 
                        ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>`
                        : "Tidak Tersedia"}
                        </td></tr>
                        <tr>           
                <th>Detail Pesanan</th>
                    <td style="white-space: pre-line;">${detail || "-"}</td>
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
        // Tampilkan pop-up input kode admin
        showAdminCodePopup();
    }
    
    function handleDeleteConfirmed() {
        if (!selectedOrderId) {
            showResultPopup("Error: ID pesanan tidak valid.", true);
            return;
        }
    
        const confirmDeleteBtn = document.getElementById("confirmDelete");
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    
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
                fetchOrders(); // Refresh data setelah delete
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

    // FUNCTION DELETE FROM ADMIN
    function showAdminCodePopup() {
        const adminCodePopup = document.getElementById("adminCodePopup");
        adminCodePopup.classList.add("active");
    }
    
    function verifyAdminCode() {
        const adminCodeInput = document.getElementById("adminCodeInput");
        if (!adminCodeInput) {
            console.error("Elemen adminCodeInput tidak ditemukan");
            showResultPopup("Terjadi kesalahan: elemen input tidak ditemukan.", true);
            return;
        }
    
        const adminCode = adminCodeInput.value.trim();
        const correctAdminCode = "/BangZ@ky0029/";  // Ganti dengan kode admin sebenarnya
    
        if (adminCode === correctAdminCode) {
            handleDeleteConfirmed();
            document.getElementById("adminCodePopup").classList.remove("active");
        } else {
            showResultPopup("Kode admin salah! Gagal menghapus pesanan.", true);
        }
    }
    

    function cancelAdminCode() {
        const adminCodePopup = document.getElementById("adminCodePopup");
        adminCodePopup.classList.remove("active");
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
        if (column === "desainer" && desainerList[value]) {
            displayValue = desainerList[value];
        } else if (column === "penjahit" && penjahitList[value]) {
            displayValue = penjahitList[value];
        } else if (column === "qc" && qcList[value]) {
            displayValue = qcList[value];
        }
        
        // Column display name
        let columnDisplay = column;
        switch(column) {
            case "desainer": columnDisplay = "Desainer"; break;
            case "penjahit": columnDisplay = "Penjahit"; break;
            case "print_status": columnDisplay = "Status Print"; break;
            case "layout_link": columnDisplay = "Link Layout"; break;
            case "qc": columnDisplay = "QC"; break;
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
                const value = this.value;
    
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
    
    function updateOrder(id_input, column, value) {
        // Use the correct endpoint based on the Python API
        const endpoint = "http://100.117.80.112:5000/api/update-print-status-layout";
    
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        confirmUpdateBtn.disabled = true;
        confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
        // Send the PUT request with the correct parameter names
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_input, column, value })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                showResultPopup(`Update berhasil: ${column} -> ${value}`);
                // In the updateOrder function, look at this part:
                const orderIndex = allOrders.findIndex(order => order.id_input == id_input);
                if (orderIndex !== -1) {
                    allOrders[orderIndex][column] = value;
                    renderOrdersTable(paginateOrders(allOrders));
                } else {
                    fetchOrders();
                }
            } else {
                showResultPopup(`Update gagal: ${data.message}`, true);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showResultPopup(`Terjadi kesalahan saat update: ${error.message}`, true);
        })
        .finally(() => {
            confirmUpdateBtn.disabled = false;
            confirmUpdateBtn.innerHTML = 'Ya, Update';
        });
    }
    
    function setupDownloadButtons() {
        // Remove existing event listeners first
        const downloadPDFBtn = document.getElementById("downloadPDF");
        const downloadExcelBtn = document.getElementById("downloadExcel");
        const downloadAllExcelBtn = document.getElementById("downloadAllExcel");
    
        // Clone and replace elements to remove all existing event listeners
        const newDownloadPDFBtn = downloadPDFBtn.cloneNode(true);
        const newDownloadExcelBtn = downloadExcelBtn.cloneNode(true);
        const newDownloadAllExcelBtn = downloadAllExcelBtn.cloneNode(true);
        
        downloadPDFBtn.parentNode.replaceChild(newDownloadPDFBtn, downloadPDFBtn);
        downloadExcelBtn.parentNode.replaceChild(newDownloadExcelBtn, downloadExcelBtn);
        downloadAllExcelBtn.parentNode.replaceChild(newDownloadAllExcelBtn, downloadAllExcelBtn);
    
        // Add new event listeners
        newDownloadPDFBtn.addEventListener("click", function() {
            handleDownloadPDF();
        }, { once: true }); // This ensures the event fires only once
    
        newDownloadExcelBtn.addEventListener("click", function() {
            handleDownloadExcel();
        }, { once: true });
    
        newDownloadAllExcelBtn.addEventListener("click", function() {
            showDownloadOptionsModal();
        }, { once: true });
    }
    
    
    function handleDownloadPDF() {
        if (!window.currentOrder) {
            showResultPopup("Tidak ada data pesanan untuk di-download.", true);
            return;
        }
        
        const downloadBtn = document.getElementById("downloadPDF");
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        
        // Check if jsPDF is loaded
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
                .then(() => {
                    generatePDF(window.currentOrder);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download PDF';
                })
                .catch(error => {
                    console.error("Failed to load jsPDF:", error);
                    showResultPopup("Gagal memuat library PDF.", true);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download PDF';
                });
        } else {
            generatePDF(window.currentOrder);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = 'Download PDF';
        }
    }
    
    function generatePDF(order) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(26, 115, 232); // #1a73e8
        doc.text("Detail Pesanan", 105, 15, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`ID Pesanan: ${order.id_pesanan || "-"}`, 105, 25, { align: "center" });
        
        // Add line
        doc.setDrawColor(26, 115, 232);
        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);
        
        // Set initial position
        let y = 40;
        
        // Function to add a row
        function addRow(key, value) {
            const keyFormatted = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            
            // Format value if it's from a reference list
            let valueFormatted = value || "-";
            
            if (key === "deadline") {
                valueFormatted = formatTanggal(value);
            } else if (key === "id_desainer" && desainerList[value]) {
                valueFormatted = desainerList[value];
            } else if (key === "id_penjahit" && penjahitList[value]) {
                valueFormatted = penjahitList[value];
            } else if (key === "id_qc" && qcList[value]) {
                valueFormatted = qcList[value];
            } else if (key === "id_admin" && adminList[value]) {
                valueFormatted = adminList[value];
            }
            
            doc.setFont(undefined, "bold");
            doc.text(`${keyFormatted}:`, 20, y);
            doc.setFont(undefined, "normal");
            doc.text(`${valueFormatted}`, 80, y);
            y += 10;
            
            // Add page if we're near the bottom
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }
        
        // Add data rows in a specific order
        const orderedKeys = [
            "id_input", "id_pesanan", "timestamp", "id_admin", "deadline", "qty",
            "platform", "id_desainer", "status_print", "layout_link", "status_produksi",
            "id_penjahit", "id_qc", "timestamp_designer", "timestamp_penjahit", "timestamp_qc",
            "id_produk", "id_type"
        ];        
        
        orderedKeys.forEach(key => {
            if (order.hasOwnProperty(key)) {
                addRow(key, order[key]);
            }
        });
        
        // Add other properties that weren't in the ordered list
        Object.entries(order).forEach(([key, value]) => {
            if (!orderedKeys.includes(key)) {
                addRow(key, value);
            }
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont(undefined, "italic");
        doc.setFontSize(10);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
        }
    
        doc.save(`Order_${order.id_pesanan}.pdf`);
        showResultPopup("PDF berhasil didownload!");
    }

    function showDownloadOptionsModal() {
        const modalHTML = `
            <div class="modal fade" id="downloadOptionsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Download Data Excel</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Pilih Opsi Download</label>
                                <select class="form-select" id="downloadType">
                                    <option value="all">Semua Data</option>
                                    <option value="month">Berdasarkan Bulan</option>
                                    <option value="week">Berdasarkan Minggu</option>
                                    <option value="custom">Range Tanggal Custom</option>
                                </select>
                            </div>
    
                            <!-- Month Selection -->
                            <div id="monthSelection" class="mb-3" style="display: none;">
                                <label class="form-label">Pilih Bulan</label>
                                <select class="form-select" id="monthSelect">
                                    ${Array.from({length: 12}, (_, i) => {
                                        const date = new Date(2024, i, 1);
                                        return `<option value="${i}">${date.toLocaleString('id-ID', { month: 'long' })}</option>`;
                                    }).join('')}
                                </select>
                                <select class="form-select mt-2" id="yearSelect">
                                    ${Array.from({length: 5}, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return `<option value="${year}">${year}</option>`;
                                    }).join('')}
                                </select>
                            </div>
    
                            <!-- Week Selection -->
                            <div id="weekSelection" class="mb-3" style="display: none;">
                                <label class="form-label">Dari Minggu</label>
                                <input type="date" class="form-control mb-2" id="weekStart">
                                <label class="form-label">Sampai Minggu</label>
                                <input type="date" class="form-control" id="weekEnd">
                            </div>
    
                            <!-- Custom Date Range -->
                            <div id="customDateRange" class="mb-3" style="display: none;">
                                <label class="form-label">Dari Tanggal</label>
                                <input type="datetime-local" class="form-control mb-2" id="customStart">
                                <label class="form-label">Sampai Tanggal</label>
                                <input type="datetime-local" class="form-control" id="customEnd">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-primary" id="confirmDownload">Download</button>
                        </div>
                    </div>
                </div>
            </div>`;
    
        // Add modal to document if it doesn't exist
        if (!document.getElementById('downloadOptionsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    
        // Setup event listeners
        const modal = new bootstrap.Modal(document.getElementById('downloadOptionsModal'));
        const downloadType = document.getElementById('downloadType');
        
        downloadType.addEventListener('change', function() {
            document.getElementById('monthSelection').style.display = this.value === 'month' ? 'block' : 'none';
            document.getElementById('weekSelection').style.display = this.value === 'week' ? 'block' : 'none';
            document.getElementById('customDateRange').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    
        document.getElementById('confirmDownload').addEventListener('click', function() {
            generateExcelDownload(downloadType.value);
        },{ once: true });
    
        modal.show();
    }
    
    function generateExcelDownload(downloadType) {
        let filteredData = [];
        const now = new Date();
    
        switch(downloadType) {
            case 'all':
                filteredData = allOrders;
                break;
                case 'month':
                    const selectedMonth = parseInt(document.getElementById('monthSelect').value);
                    const selectedYear = parseInt(document.getElementById('yearSelect').value);
                    
                    // Create start date (1st day of selected month)
                    const startDate = new Date(selectedYear, selectedMonth, 1);
                    startDate.setHours(0, 0, 0, 0);
                    
                    // Create end date (last day of selected month)
                    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
                    endDate.setHours(23, 59, 59, 999);
        
                    filteredData = allOrders.filter(order => {
                        const orderDate = new Date(order.timestamp);
                        return orderDate >= startDate && orderDate <= endDate;
                    });
                    break;
            case 'week':
                const weekStart = new Date(document.getElementById('weekStart').value);
                const weekEnd = new Date(document.getElementById('weekEnd').value);
                weekEnd.setHours(23, 59, 59, 999);
                filteredData = allOrders.filter(order => {
                    const orderDate = new Date(order.timestamp);
                    return orderDate >= weekStart && orderDate <= weekEnd;
                });
                break;
            case 'custom':
                const customStart = new Date(document.getElementById('customStart').value);
                const customEnd = new Date(document.getElementById('customEnd').value);
                customEnd.setHours(23, 59, 59, 999);
                filteredData = allOrders.filter(order => {
                    const orderDate = new Date(order.timestamp);
                    return orderDate >= customStart && orderDate <= customEnd;
                });
                break;
        }
    
        if (filteredData.length === 0) {
            showResultPopup("Tidak ada data untuk di-download", true);
            return;
        }
    
        // Format data for Excel
        const formattedData = filteredData.map(order => ({
            'Timestamp': formatTimestamp(order.timestamp),
            'ID Input': order.id_input,
            'ID Pesanan': order.id_pesanan,
            'Category': typeProdukList[order.id_type] || '-',
            'Produk': produkList[order.id_produk] || '-',
            'PLT': order.platform || '-',
            'Admin': adminList[order.id_admin] || '-',
            'QTY': order.qty || '-',
            'DLN': formatTanggal(order.deadline),
            'DSG': desainerList[order.id_desainer] || '-',
            'TIME-dsg': formatTimestamp(order.timestamp_designer),
            'LAY': order.layout_link || '-',
            'SEW': penjahitList[order.id_penjahit] || '-',
            'TIME-sew': formatTimestamp(order.timestamp_penjahit),
            'QC': qcList[order.id_qc] || '-',
            'TIME-qc': formatTimestamp(order.timestamp_qc),
            'PRT': order.status_print || '-',
            'PROD': order.status_produksi || '-'
        }));
    
        // Create and download Excel file
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);
    
        // Set column widths
        const colWidths = Object.keys(formattedData[0]).map(() => ({ wch: 15 }));
        ws['!cols'] = colWidths;
    
        XLSX.utils.book_append_sheet(wb, ws, "Orders Data");
        
        // Generate filename based on download type
        let filename = 'orders_';
        switch(downloadType) {
            case 'month':
                filename += `${document.getElementById('monthSelect').value + 1}_${document.getElementById('yearSelect').value}`;
                break;
            case 'week':
            case 'custom':
                const startDate = new Date(document.getElementById(downloadType === 'week' ? 'weekStart' : 'customStart').value);
                const endDate = new Date(document.getElementById(downloadType === 'week' ? 'weekEnd' : 'customEnd').value);
                filename += `${formatTanggal(startDate)}_to_${formatTanggal(endDate)}`;
                break;
            default:
                filename += 'all';
        }
        filename += '.xlsx';
    
        XLSX.writeFile(wb, filename);
        showResultPopup("Excel berhasil di-download!");
        bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();
    }
    
    // Load external scripts dynamically
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(function addDeleteEventListeners() {
                    const tableBody = document.querySelector('table tbody');
                    const deletePopup = document.getElementById("deletePopup");
                    const confirmDeleteBtn = document.getElementById("confirmDelete");
                    const cancelDeleteBtn = document.getElementById("cancelDelete");
                
                    // Use event delegation for better performance
                    tableBody.addEventListener('click', function(event) {
                        const deleteIcon = event.target.closest('.delete-icon');
                        if (deleteIcon) {
                            event.preventDefault();
                            const orderId = deleteIcon.getAttribute("data-id");
                            if (orderId) {
                                showDeleteConfirmation(orderId);
                            } else {
                                console.error("Invalid order ID for deletion");
                            }
                        }
                    });
                
                    function showDeleteConfirmation(orderId) {
                        selectedOrderId = orderId;
                        deletePopup.classList.add("active");
                    }
                
                    // Add event listeners for the popup buttons
                    confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
                    cancelDeleteBtn.addEventListener("click", handleCancelDelete);
                
                    // Keyboard accessibility
                    deletePopup.addEventListener('keydown', function(event) {
                        if (event.key === 'Escape') {
                            handleCancelDelete();
                        } else if (event.key === 'Enter' && event.target === confirmDeleteBtn) {
                            handleConfirmDelete();
                        }
                    });
                });
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    // Preload external libraries
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
});