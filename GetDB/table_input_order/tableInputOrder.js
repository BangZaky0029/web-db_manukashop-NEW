document.addEventListener("DOMContentLoaded", function () {
    const ordersTable = document.getElementById("ordersTable").querySelector("tbody");
    const pageInfo = document.getElementById("pageInfo");
    const searchOrderIdInput = document.getElementById("searchOrderId");
    const searchNamaKetInput = document.getElementById("searchNamaKet");
    const searchOrderIdBtn = document.getElementById("searchOrderIdBtn");
    const searchNamaKetBtn = document.getElementById("searchNamaKetBtn");
    const searchResultsPopup = document.getElementById("searchResultsPopup");
    const searchResultsText = document.getElementById("searchResultsText");

    let currentPage = 1;
    let totalPages = 1;
    let ordersData = [];
    let allOrdersData = [];
    let currentSearchTerms = { orderId: '', namaKet: '' };
    let popupTimeout;
    let itemsPerPage = calculateItemsPerPage();

    // Admin list mapping
    const adminList = {
        1001: "Vinka",
        1002: "INA", 
        1003: "Indy"
    };

    // Calculate items per page based on screen size
    function calculateItemsPerPage() {
        return window.innerWidth <= 480 ? 5 : 10;
    }

    // Update items per page when window resizes
    window.addEventListener('resize', debounce(function() {
        const newItemsPerPage = calculateItemsPerPage();
        if (newItemsPerPage !== itemsPerPage) {
            itemsPerPage = newItemsPerPage;
            updatePagination();
            renderTable();
        }
    }, 250));

    // Debounce function to limit function calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Sort data by id_input (newest first) - optimized sorting
    function sortDataByNewest(data) {
        return data.sort((a, b) => {
            // Convert id_input to numbers for proper numeric sorting
            const idA = parseInt(a.id_input) || 0;
            const idB = parseInt(b.id_input) || 0;
            return idB - idA; // Descending order (newest first)
        });
    }

    // Update pagination info
    function updatePagination() {
        totalPages = Math.ceil(ordersData.length / itemsPerPage);
        if (currentPage > totalPages) {
            currentPage = totalPages || 1;
        }
    }

    // Show temporary popup with improved UX
    function showTemporaryPopup(message, type = 'info') {
        if (popupTimeout) {
            clearTimeout(popupTimeout);
        }

        searchResultsText.innerHTML = message;
        searchResultsPopup.className = `search-results-popup show ${type}`;

        // Auto-hide after 2.5 seconds
        popupTimeout = setTimeout(() => {
            searchResultsPopup.classList.remove('show');
        }, 2500);
    }

    // Optimized fetch with better error handling
    async function fetchOrders() {
        // Show loading indicator
        ordersTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 20px; color: var(--primary-color);"></i>
                    <div style="margin-top: 10px;">Memuat data...</div>
                </td>
            </tr>
        `;
        
        fetch("http://100.117.80.112:5000/api/get-input-table")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    allOrdersData = data.data;
                    ordersData = [...allOrdersData];
                    totalPages = Math.ceil(ordersData.length / itemsPerPage);
                    renderTable();
                    showTemporaryPopup("Data berhasil dimuat", 'success');
                } else {
                    throw new Error("Failed to fetch data");
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                ordersTable.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; color: #e74c3c; padding: 20px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                            <div style="margin-top: 10px;">Gagal memuat data. Silakan coba lagi.</div>
                        </td>
                    </tr>
                `;
                showTemporaryPopup("Gagal mengambil data. Silakan coba lagi.", 'error');
            });
    }

    // Optimized text highlighting
    function highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text || "";
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    }

    // Optimized table rendering with virtual scrolling concept
    function renderTable() {
        ordersTable.innerHTML = "";
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedOrders = ordersData.slice(start, end);

        if (paginatedOrders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #888; padding: 20px;">
                        <i class="fas fa-search" style="font-size: 24px; opacity: 0.5;"></i>
                        <div style="margin-top: 10px;">Tidak ada data yang ditemukan</div>
                    </td>
                </tr>
            `;
            if (currentSearchTerms.orderId || currentSearchTerms.namaKet) {
                showTemporaryPopup("Tidak ada data yang ditemukan untuk pencarian ini", 'warning');
            }
        } else {
            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();
            
            paginatedOrders.forEach(order => {
                const platformClass = order.Platform ? 
                    order.Platform.toLowerCase().replace(/\s/g, '') : '';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.TimeTemp || ''}</td>
                    <td>${highlightText(order.id_input || '', currentSearchTerms.orderId)}</td>
                    <td>${highlightText(order.id_pesanan || '', currentSearchTerms.orderId)}</td>
                    <td>${adminList[order.id_admin] || order.id_admin || ''}</td>
                    <td class="platform-${platformClass}">${order.Platform || ''}</td>
                    <td>${order.qty || '0'}</td>
                    <td>${highlightText(order.nama_ket || '', currentSearchTerms.namaKet)}</td>
                    <td>${formatTimestamp(order.Deadline)}</td>
                `;
                fragment.appendChild(row);
            });
            
            ordersTable.appendChild(fragment);
        }

        // Update page info
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1} (${ordersData.length} total)`;
        
        // Update pagination buttons
        document.getElementById("prevPage").disabled = currentPage === 1;
        document.getElementById("nextPage").disabled = currentPage === totalPages || totalPages === 0;
    }

    // Optimized timestamp formatting
    function formatTimestamp(timestamp) {
        if (!timestamp) return "";

        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return timestamp;
            }

            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");

            return `${hours}:${minutes} / ${day}-${month}`;
        } catch (e) {
            console.error("Error formatting date:", e);
            return timestamp;
        }
    }

    // Optimized search with debouncing
    const debouncedSearch = debounce(function(type) {
        performSearch();
    }, 300);

    function performSearch() {
        const searchOrderIdValue = searchOrderIdInput.value.trim().toLowerCase();
        const searchNamaKetValue = searchNamaKetInput.value.trim().toLowerCase();

        // Store search terms for highlighting
        currentSearchTerms = {
            orderId: searchOrderIdValue,
            namaKet: searchNamaKetValue
        };

        // Filter data based on both search criteria
        ordersData = allOrdersData.filter(order => {
            const matchOrderId = !searchOrderIdValue || 
                (order.id_pesanan && order.id_pesanan.toLowerCase().includes(searchOrderIdValue)) ||
                (order.id_input && order.id_input.toLowerCase().includes(searchOrderIdValue));
            
            const matchNamaKet = !searchNamaKetValue || 
                (order.nama_ket && order.nama_ket.toLowerCase().includes(searchNamaKetValue));
            
            return matchOrderId && matchNamaKet;
        });

        // Sort filtered results by newest first
        ordersData = sortDataByNewest(ordersData);

        currentPage = 1;
        updatePagination();
        renderTable();

        // Show search results count
        const resultsFound = ordersData.length;
        if (resultsFound > 0) {
            showTemporaryPopup(`Ditemukan ${resultsFound} hasil pencarian (diurutkan terbaru)`, 'success');
        } else {
            showTemporaryPopup("Tidak ada hasil yang ditemukan", 'warning');
        }
    }

    // Pagination event listeners
    document.getElementById("prevPage").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("nextPage").addEventListener("click", function () {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // Search event listeners with debouncing
    searchOrderIdBtn.addEventListener("click", () => performSearch());
    searchNamaKetBtn.addEventListener("click", () => performSearch());

    // Real-time search on input with debouncing
    searchOrderIdInput.addEventListener("input", () => debouncedSearch('orderId'));
    searchNamaKetInput.addEventListener("input", () => debouncedSearch('namaKet'));

    // Search on Enter key
    searchOrderIdInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            performSearch();
            event.preventDefault();
        }
    });
    
    searchNamaKetInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            performSearch();
            event.preventDefault();
        }
    });

    // Refresh button with improved functionality
    document.getElementById("refreshBtn").addEventListener("click", function () {
        // Clear search inputs
        searchOrderIdInput.value = "";
        searchNamaKetInput.value = "";
        document.getElementById("platformFilter").value = "all";
        
        // Reset data and sort by newest
        ordersData = sortDataByNewest([...allOrdersData]);
        currentPage = 1;
        currentSearchTerms = { orderId: '', namaKet: '' };
        
        updatePagination();
        renderTable();
        showTemporaryPopup("Data berhasil direset dan diurutkan", 'info');
    });

    // Platform filter with sorting
    document.getElementById("platformFilter").addEventListener("change", function () {
        const selectedPlatform = this.value;
        
        if (selectedPlatform === "all") {
            ordersData = [...allOrdersData];
        } else {
            ordersData = allOrdersData.filter(order => order.Platform === selectedPlatform);
        }
        
        // Sort filtered data by newest
        ordersData = sortDataByNewest(ordersData);
        
        currentPage = 1;
        updatePagination();
        renderTable();
        
        const platformMessage = selectedPlatform === 'all' 
            ? 'Menampilkan semua platform (diurutkan terbaru)' 
            : `Menampilkan platform ${selectedPlatform} (diurutkan terbaru)`;
        showTemporaryPopup(platformMessage, 'info');
    });

    // Network status handling
    window.addEventListener('online', function() {
        showTemporaryPopup("Anda kembali online! Memuat ulang data...", 'success');
        setTimeout(fetchOrders, 1000);
    });
    
    window.addEventListener('offline', function() {
        showTemporaryPopup("Anda sedang offline. Menampilkan data cache.", 'warning');
    });

    // Enhanced cache management
    function loadFromCache() {
        const cachedData = sessionStorage.getItem('ordersData');
        const cacheTimestamp = sessionStorage.getItem('cacheTimestamp');
        
        if (cachedData && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp);
            const maxAge = 10 * 60 * 1000; // 10 minutes
            
            if (cacheAge < maxAge) {
                try {
                    allOrdersData = sortDataByNewest(JSON.parse(cachedData));
                    ordersData = [...allOrdersData];
                    updatePagination();
                    renderTable();
                    showTemporaryPopup("Data dimuat dari cache (diurutkan terbaru)", 'info');
                    return true;
                } catch(e) {
                    console.error("Error loading from cache:", e);
                    sessionStorage.removeItem('ordersData');
                    sessionStorage.removeItem('cacheTimestamp');
                }
            } else {
                // Cache expired
                sessionStorage.removeItem('ordersData');
                sessionStorage.removeItem('cacheTimestamp');
            }
        }
        return false;
    }

    // Initialize application
    function init() {
        // Try to load from cache first, if not available or expired, fetch fresh data
        if (!loadFromCache()) {
            fetchOrders();
        } else {
            // Fetch fresh data in background to update cache
            setTimeout(fetchOrders, 2000);
        }
    }

    // Start the application
    init();
});