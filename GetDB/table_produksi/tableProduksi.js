document.addEventListener("DOMContentLoaded", function () {
    let selectedOrderId = null;
    let showDoneOrders = false;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];
    let filteredOrders = []; // Data hasil filter
    let typeProdukList = [];
    let produkList = {};
    
    // Define reference data objects
    let adminList = {};
    let desainerList = {};
    let kurirList = {};
    let penjahitList = {};
    let qcList = {};

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
            // Setup auto refresh
            setupAutoRefresh();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    // Setup auto refresh function to run at 9:00 AM daily
    function setupAutoRefresh() {
        function scheduleRefresh() {
            const now = new Date();
            const scheduledTime = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                9, // 9 AM
                0, // 0 minutes
                0  // 0 seconds
            );

            // If it's past 9 AM, schedule for next day
            if (now > scheduledTime) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const timeUntilRefresh = scheduledTime - now;
            setTimeout(() => {
                fetchOrders();
                scheduleRefresh(); // Schedule next day's refresh
            }, timeUntilRefresh);

            console.log(`Next refresh scheduled for: ${scheduledTime.toLocaleString()}`);
        }

        // Start the scheduling
        scheduleRefresh();
        
        // Also fetch immediately when page loads
        fetchOrders();
    }

    document.getElementById("inputForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Hindari reload form
    
        const formData = new FormData(this);
        const response = await fetch("http://100.124.58.32:5000/api/get_table_prod", {
            method: "POST",
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: { "Content-Type": "application/json" },
        });
    
        const result = await response.json();
        if (result.status === "success") {
            await fetchOrders();  // Refresh data after successful form submission
            showResultPopup("Data berhasil ditambahkan");
            this.reset(); // Reset form after successful submission
        } else {
            showResultPopup("Gagal menambahkan data: " + (result.message || "Unknown error"), true);
        }
    });
    

    // Update fetchOrders to pass isSearching parameter
    async function fetchOrders() {
        try {
            const response = await fetch("http://100.124.58.32:5000/api/get_table_prod");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Data orders:", data);

            if (data.status === "success") {
                allOrders = data.data;
                const isSearching = document.getElementById("searchInput")?.value.trim() !== '';
                
                // Initialize total qty display
                const totalPendingQty = allOrders
                    .filter(order => order.status_produksi === '-' || !order.status_produksi)
                    .reduce((total, order) => total + (parseInt(order.qty) || 0), 0);
                
                const qtyDisplay = document.getElementById("totalQty");
                if (qtyDisplay) {
                    qtyDisplay.textContent = `Belum Update: ${totalPendingQty} pcs`;
                }

                renderOrdersTable(paginateOrders(allOrders, isSearching), isSearching);
                updatePagination(isSearching);
            } else {
                console.error("Gagal mengambil data:", data.message);
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }

    // Modify paginateOrders function
    function paginateOrders(orders, isSearching = false) {
        const ordersToUse = orders || (filteredOrders.length > 0 ? filteredOrders : allOrders);
        
        // Always hide DONE orders unless explicitly showing them
        let ordersToDisplay = showDoneOrders ? 
            ordersToUse : 
            ordersToUse.filter(order => order.status_produksi !== 'DONE');
        
        // Sort orders by id_input in descending order
        ordersToDisplay = ordersToDisplay.sort((a, b) => {
            const idA = parseInt(a.id_input?.replace(/\D/g, '') || 0);
            const idB = parseInt(b.id_input?.replace(/\D/g, '') || 0);
            return idB - idA;
        });
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Ensure current page is valid
        const totalPages = Math.ceil(ordersToDisplay.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            return paginateOrders(orders, isSearching);
        }
        
        return ordersToDisplay.slice(startIndex, endIndex);
    }

    // Update updatePagination function
    function updatePagination(isSearching = false) {
        const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
        const displayOrders = showDoneOrders ? 
            ordersToUse : 
            ordersToUse.filter(order => order.status_produksi !== 'DONE');
        
        const totalPages = Math.ceil(displayOrders.length / itemsPerPage);
        
        const pageInfo = document.getElementById("pageInfo");
        const prevButton = document.getElementById("prevPage");
        const nextButton = document.getElementById("nextPage");
        const firstButton = document.getElementById("firstPage");
        const lastButton = document.getElementById("lastPage");
        const pageInput = document.getElementById("pageInput");
        
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1} (${displayOrders.length} pesanan${isSearching ? '' : ' aktif'})`;
        
        // Update button states
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
        firstButton.disabled = currentPage <= 1;
        lastButton.disabled = currentPage >= totalPages;
        
        pageInput.value = currentPage;
        pageInput.max = totalPages;
    }

    function goToSpecificPage() {
        const pageInput = document.getElementById("pageInput");
        const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
        const totalPages = Math.ceil(ordersToUse.length / itemsPerPage);
        const pageNum = parseInt(pageInput.value, 10);

        if (pageNum >= 1 && pageNum <= totalPages) {
            currentPage = pageNum;
            renderOrdersTable(paginateOrders(ordersToUse));
            updatePagination();
        } else {
            showResultPopup(`Halaman tidak valid. Masukkan nomor antara 1 hingga ${totalPages}`, true);
            pageInput.value = currentPage; // Reset to current page
        }
    }

    // Add new function to toggle DONE orders visibility
    function toggleDoneOrders() {
        showDoneOrders = !showDoneOrders;
        const toggleBtn = document.getElementById("toggleDoneBtn");
        toggleBtn.innerHTML = showDoneOrders ? 
            '<i class="fas fa-eye-slash"></i> Hide DONE Orders' : 
            '<i class="fas fa-eye"></i> Show DONE Orders';
        
        const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
        renderOrdersTable(paginateOrders(ordersToUse, showDoneOrders));
        updatePagination(showDoneOrders);
    }

    function setupFilterAndSearch() {
        // Search functionality
        const filterStatus = document.getElementById("filterStatus");
        const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        const pageInput = document.getElementById("pageInput");
        const goPageBtn = document.getElementById("goPage");
        const tanggalInput = document.getElementById("tanggal");
        // Add platform filter functionality
        const platformFilter = document.getElementById("platformFilter");
        if (platformFilter) {
            platformFilter.addEventListener("change", function() {
                filterByPlatformAndAdmin(this.value);
            });
        }

        // Add toggle button for DONE orders - Modified to use existing container
        const controlsContainer = document.querySelector(".controls-container") || document.querySelector(".table-controls");
        if (controlsContainer) {
            const toggleButton = document.createElement("button");
            toggleButton.id = "toggleDoneBtn";
            toggleButton.className = "btn btn-outline-secondary ms-2";
            toggleButton.innerHTML = '<i class="fas fa-eye"></i> Show DONE Orders';
            toggleButton.onclick = toggleDoneOrders;
            controlsContainer.appendChild(toggleButton);
        }


         // Fix search functionality
        if (searchButton) {
            searchButton.addEventListener("click", function() {
                const searchTerm = searchInput ? searchInput.value : '';
                performAdvancedSearch(searchTerm);
            });
        }

        if (searchInput) {
            searchInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    performAdvancedSearch(this.value);
                }
            });
        }

        // Add new function for platform and admin filtering
        function filterByPlatformAndAdmin(filterValue) {
            if (!filterValue) {
                filteredOrders = [...allOrders];
            } else {
                const [platform, admin] = filterValue.split('-');
                
                filteredOrders = allOrders.filter(order => {
                    if (platform === "WhatsApp" && admin) {
                        return order.platform === platform && order.admin === admin;
                    }
                    return order.platform === platform;
                });
            }
    
            // Count unique pending orders (not qty)
            const pendingOrdersCount = filteredOrders.filter(order => 
                order.status_produksi === '-' || !order.status_produksi
            ).length;
    
            // Update display
            const qtyDisplay = document.getElementById("totalQty");
            if (qtyDisplay) {
                qtyDisplay.textContent = `Belum Update: ${pendingOrdersCount} pesanan`;
            }
    
            currentPage = 1;
            renderOrdersTable(paginateOrders(filteredOrders, true));
            updatePagination(true);
    
            const platformName = filterValue ? filterValue.replace('-', ' - ') : 'Semua Platform';
            showResultPopup(`Menampilkan pesanan untuk ${platformName} (${filteredOrders.length} Total pesanan, ${pendingOrdersCount} pesanan belum update)`);
        }
        
        // Filter by status
        // const filterStatus = document.getElementById("filterStatus");
        filterStatus.addEventListener("change", function() {
            const selectedStatus = this.value;

            
            if (selectedStatus === "BELUM UPDATE") {
                // Special handling for "BELUM UPDATE"
                filteredOrders = allOrders.filter(order => {
                    const printStatus = order.status_print || "";
                    const prodStatus = order.status_produksi || "";
                    
                    // Show rows where either status is empty/not set
                    return (printStatus === "-" || 
                           printStatus === "Pilih Status" || 
                           printStatus.trim() === "" ||
                           printStatus === null) 
                           || 
                           (prodStatus === "-" ||
                           prodStatus === "Pilih Status" ||
                           prodStatus.trim() === "" ||
                           prodStatus === null);
                });
            } else if (selectedStatus) {
                // Normal status filtering
                filteredOrders = allOrders.filter(order => 
                    order.status_produksi === selectedStatus || 
                    order.status_print === selectedStatus
                );
            } else {
                // Reset filter
                filteredOrders = [...allOrders];
            }
            
            currentPage = 1;
            renderOrdersTable(paginateOrders(filteredOrders, true));
            updatePagination(true);
            
            // Show result message
            const count = filteredOrders.length;
            showResultPopup(`Ditemukan ${count} pesanan${selectedStatus ? ` dengan status: ${selectedStatus}` : ''}`);
        });
        
        // Refresh button
            // Update refresh button handler
        const refreshButton = document.getElementById("refreshButton");
        refreshButton.addEventListener("click", async function() {
            refreshButton.disabled = true;
            refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            await fetchOrders();
            filteredOrders = []; // Clear any filters
            currentPage = 1; // Reset to first page
            
            refreshButton.disabled = false;
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        });
        
        // Pagination controls
        // Fix pagination controls in setupFilterAndSearch
        document.getElementById("prevPage").addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage--;
                const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
                renderOrdersTable(paginateOrders(ordersToUse));
                updatePagination();
            }
        });
        
        document.getElementById("nextPage").addEventListener("click", function() {
            const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
            const totalPages = Math.ceil(ordersToUse.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderOrdersTable(paginateOrders(ordersToUse));
                updatePagination();
            }
        });

        // First Page Button
        document.getElementById("firstPage").addEventListener("click", function() {
            if (currentPage !== 1) {
                currentPage = 1;
                const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
                renderOrdersTable(paginateOrders(ordersToUse));
                updatePagination();
            }
        });

        // Last Page Button
        document.getElementById("lastPage").addEventListener("click", function() {
            const ordersToUse = filteredOrders.length > 0 ? filteredOrders : allOrders;
            const totalPages = Math.ceil(ordersToUse.length / itemsPerPage);
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                renderOrdersTable(paginateOrders(ordersToUse));
                updatePagination();
            }
        });

        goPageBtn.addEventListener("click", function() {
            goToSpecificPage();
        });

        pageInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                goToSpecificPage();
            }
        });

        if (tanggalInput) {
            tanggalInput.addEventListener("change", function() {
                filterOrdersByDate(this.value);
            });
        }


    }

    function filterOrdersByDate(selectedDate) {
        if (!selectedDate) {
            filteredOrders = [...allOrders];
            currentPage = 1;
            renderOrdersTable(paginateOrders(filteredOrders, true));
            updatePagination(true);
            showResultPopup("Menampilkan semua data");
            return;
        }

        const dateStart = new Date(selectedDate);
        dateStart.setHours(0, 0, 0, 0);
        
        const dateEnd = new Date(selectedDate);
        dateEnd.setHours(23, 59, 59, 999);

        filteredOrders = allOrders.filter(order => {
            if (!order.deadline) return false;
            
            const orderDate = new Date(order.deadline);
            return orderDate >= dateStart && orderDate <= dateEnd;
        });

        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders, true));
        updatePagination(true);

        const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan untuk tanggal ${formattedDate}`);
    }


     // Fungsi untuk mendeteksi tombol Enter pada input pencarian
     function handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            const searchTerm = event.target.value;
            performAdvancedSearch(searchTerm);
        }
    }

    function resetSearch() {
        filteredOrders = [...allOrders];
        currentPage = 1;
        renderOrdersTable(paginateOrders(allOrders));
        updatePagination();
        showResultPopup("Menampilkan semua data");
    }


    function performAdvancedSearch(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            resetSearch();
            return;
        }

        const searchTermLower = searchTerm.toLowerCase().trim();

        // Search in all orders, including DONE status
        filteredOrders = allOrders.filter(order => {
            const searchFields = [
                order.id_input,
                order.id_pesanan,
                typeProdukList[order.id_type],
                produkList[order.id_produk],
                order.platform,
                order.status_produksi,
                order.status_print
            ];

            return searchFields.some(field => 
                field && field.toString().toLowerCase().includes(searchTermLower)
            );
        });

        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders, true), true);
        updatePagination(true);

        showResultPopup(`Ditemukan ${filteredOrders.length} hasil pencarian untuk "${searchTerm}"`);
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
    
    function renderOrdersTable(orders, isSearching = true) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";
    
        orders.forEach(order => {
            const row = document.createElement("tr");
            if (order.status_produksi === 'DONE') {
                row.classList.add('done-status-row');
                // Hide DONE rows unless explicitly showing them
                if (!showDoneOrders) {
                    row.style.display = 'none';
                }
            }
            row.innerHTML = `
                <td>${formatTimes(order.timestamp) || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td>${order.id_pesanan || "-"}</td>
                <td>${typeProdukList[order.id_type] || "-"}</td>
                <td>${produkList[order.id_produk] || "-"}</td>
                <td style="color: ${getPlatformColor(order.platform).color}; background-color: ${getPlatformColor(order.platform).backgroundColor}; padding: 5px; border-radius: 5px;">
                    ${order.platform || "-"}
                </td>
                <td>${order.qty || "-"}</td>
                <td>
                    <select class="penjahit-dropdown" data-id="${order.id_input}" data-column="penjahit">
                    <option value="">Pilih Penjahit</option>
                    ${Object.entries(penjahitList).map(([id, nama]) =>
                        `<option value="${id}" ${order.id_penjahit == id ? 'selected' : ''}>${nama}</option>`
                    ).join('')}
                    </select>
                </td>
                <td>
                    <select class="qc-dropdown" data-id="${order.id_input}" data-column="qc">
                    <option value="">Pilih QC</option>
                    ${Object.entries(qcList).map(([id, nama]) =>
                        `<option value="${id}" ${order.id_qc == id ? 'selected' : ''}>${nama}</option>`
                    ).join('')}
                    </select>
                </td>
                <td>${formatTanggal(highlightDeadline(order.deadline))}</td>
                <td><span class="badge_input ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td>
                <td>
                    <select class="status-produksi" data-id="${order.id_input}" data-column="status_produksi">
                        <option value="-" ${order.status_produksi === '-' ? 'selected' : ''}>-</option>
                        <option value="SEDANG DI PRESS" ${order.status_produksi === 'SEDANG DI PRESS' ? 'selected' : ''}>SEDANG DI PRESS</option>
                        <option value="SEDANG DI JAHIT" ${order.status_produksi === 'SEDANG DI JAHIT' ? 'selected' : ''}>SEDANG DI JAHIT</option>
                        <option value="TAS SUDAH DI JAHIT" ${order.status_produksi === 'TAS SUDAH DI JAHIT' ? 'selected' : ''}>TAS SUDAH DI JAHIT</option>
                        <option value="REJECT PRINT ULANG" ${order.status_produksi === 'REJECT PRINT ULANG' ? 'selected' : ''}>REJECT PRINT ULANG</option>
                        <option value="TAS BLM ADA" ${order.status_produksi === 'TAS BLM ADA' ? 'selected' : ''}>TAS BLM ADA</option>
                        <option value="DONE" ${order.status_produksi === 'DONE' ? 'selected' : ''}>DONE</option>
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
        // Event listener untuk dropdown status produksi
        document.querySelectorAll(".status-produksi").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                // Direct update without confirmation
                updateOrder(id_input, column, value);
            });
    
            updateSelectColor(select);
        });
    
        // Fungsi untuk mengubah warna berdasarkan status produksi
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-");
            select.className = `status-produksi option-${selectedValue}`;
        }
    }
    
    async function fetchReferenceData() {
        try {
            const response = await fetch("http://100.124.58.32:5000/api/references");
            
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

    async function showDescriptionModal(order) {
        if (!order.id_input) {
            console.error("ID Input tidak valid:", order);
            return;
        }
    
        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        const nama_ket = await fetchNamaKet(order.id_input)
        const layoutLink = await fetchLayoutLink(order.id_input)
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
    
            modalBody.innerHTML = `
                <tr><th>Timestamp</th><td>${order.timestamp || "-"}</td></tr>
                <tr><th>ID Input</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr><th>Penjahit</th><td>${penjahitList[order.id_penjahit] || "-"}</td></tr>
                <tr><th>QC</th><td>${qcList[order.id_qc] || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Status Print</th><td>${order.status_print || "-"}</td></tr>
                <tr><th>Status Produksi</th><td>${order.status_produksi || "-"}</td></tr>
                <tr><th>Layout Link</th><td>
                    ${layoutLink && layoutLink !== "-" ? `<a href="${layoutLink}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i>LIHAT LAYOUT PRINT</a>` : "Tidak Tersedia"}
                </td></tr>
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
        
                // Direct update without confirmation
                updateOrder(id_input, column, value);
            });
        });
    }

    // Remove updateOrderWithConfirmation function as it's no longer needed

    function updateOrder(id_input, column, value) {
        const endpoint = "http://100.124.58.32:5000/api/sync-prod-to-pesanan";
        
        if (!id_input || !column || value === undefined || value === null) {
            showResultPopup("ID Input, Column, atau Value tidak valid!", true);
            return;
        }

        const columnMapping = {
            "penjahit": "id_penjahit",
            "qc": "id_qc",
            "status_produksi": "status_produksi"
        };
        
        const apiParam = columnMapping[column];
        if (!apiParam) {
            showResultPopup(`Kolom tidak valid: ${column}`, true);
            return;
        }

        const requestBody = { 
            "id_input": id_input,
            [apiParam]: value 
        };

        // Cancel any pending update request
        if (window.currentUpdateRequest) {
            window.currentUpdateRequest.abort();
        }
        
        const controller = new AbortController();
        window.currentUpdateRequest = controller;

        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" || data.message) {
                // Update local data immediately
                const orderToUpdate = allOrders.find(order => order.id_input === id_input);
                if (orderToUpdate) {
                    if (column === 'penjahit') orderToUpdate.id_penjahit = value;
                    else if (column === 'qc') orderToUpdate.id_qc = value;
                    else if (column === 'status_produksi') orderToUpdate.status_produksi = value;
                }

                // Update filtered orders if they exist
                if (filteredOrders.length > 0) {
                    const filteredOrderToUpdate = filteredOrders.find(order => order.id_input === id_input);
                    if (filteredOrderToUpdate) {
                        if (column === 'penjahit') filteredOrderToUpdate.id_penjahit = value;
                        else if (column === 'qc') filteredOrderToUpdate.id_qc = value;
                        else if (column === 'status_produksi') filteredOrderToUpdate.status_produksi = value;
                    }
                }

                renderOrdersTable(paginateOrders(filteredOrders.length > 0 ? filteredOrders : allOrders));
                showResultPopup(`✅ Update berhasil: ${column} -> ${value}`);
                
                // Schedule a delayed fetch to ensure data consistency
                setTimeout(fetchOrders, 5000);
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') return;
            showResultPopup(`Terjadi kesalahan saat update: ${error.message}`, true);
        })
        .finally(() => {
            window.currentUpdateRequest = null;
        });
    }
    
    function updateOrder(id_input, column, value) {
        const endpoint = "http://100.124.58.32:5000/api/sync-prod-to-pesanan";
        
        if (!id_input || !column) {
            showResultPopup("ID Input atau Column tidak valid!", true);
            return;
        }

        // Handle empty selections for penjahit and qc
        if ((column === "penjahit" || column === "qc") && !value) {
            value = null; // Set to null instead of empty string
        }

        const columnMapping = {
            "penjahit": "id_penjahit",
            "qc": "id_qc",
            "status_produksi": "status_produksi"
        };
        
        const apiParam = columnMapping[column];
        if (!apiParam) {
            showResultPopup(`Kolom tidak valid: ${column}`, true);
            return;
        }

        const requestBody = { 
            "id_input": id_input,
            [apiParam]: value 
        };

        // Cancel any pending update request
        if (window.currentUpdateRequest) {
            window.currentUpdateRequest.abort();
        }
        
        const controller = new AbortController();
        window.currentUpdateRequest = controller;

        fetch(endpoint, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Update failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success" || data.message) {
                // Update local data immediately
                const orderToUpdate = allOrders.find(order => order.id_input === id_input);
                if (orderToUpdate) {
                    if (column === 'status_produksi') {
                        orderToUpdate.status_produksi = value;
                        // Hide row if status is DONE
                        if (value === 'DONE') {
                            const row = document.querySelector(`tr:has(select[data-id="${id_input}"])`);
                            if (row) {
                                row.classList.add('done-status-row');
                                row.style.display = 'none';
                            }
                        }
                    }
                }
                if (orderToUpdate) {
                    if (column === 'penjahit') orderToUpdate.id_penjahit = value;
                    else if (column === 'qc') orderToUpdate.id_qc = value;
                    else if (column === 'status_produksi') orderToUpdate.status_produksi = value;
                }

                // Update filtered orders if they exist
                if (filteredOrders.length > 0) {
                    const filteredOrderToUpdate = filteredOrders.find(order => order.id_input === id_input);
                    if (filteredOrderToUpdate) {
                        if (column === 'penjahit') filteredOrderToUpdate.id_penjahit = value;
                        else if (column === 'qc') filteredOrderToUpdate.id_qc = value;
                        else if (column === 'status_produksi') filteredOrderToUpdate.status_produksi = value;
                    }
                }

                // Update UI immediately without fetching
                renderOrdersTable(paginateOrders(filteredOrders.length > 0 ? filteredOrders : allOrders));
                showResultPopup(`✅ Update berhasil: ${column} -> ${value}`);
                
                // Schedule a delayed fetch to ensure data consistency
                setTimeout(fetchOrders, 5000);
            }
        })
        .catch(error => {
            if (error.name === 'AbortError') return;
            showResultPopup(`Terjadi kesalahan saat update: ${error.message}`, true);
        })
        .finally(() => {
            confirmUpdateBtn.disabled = false;
            confirmUpdateBtn.innerHTML = 'Ya, Update';
            window.currentUpdateRequest = null;
        });
    }

    // Add CSS for done status rows
    const style = document.createElement('style');
    style.textContent = `
        .done-status-row {
            opacity: 0.7;
            background-color: #f8f9fa;
        }
        .done-status-row:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

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