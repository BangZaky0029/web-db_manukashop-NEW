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

    // Calculate items per page based on screen size
    function calculateItemsPerPage() {
        return window.innerWidth <= 480 ? 5 : 10;
    }

    // Update items per page when window resizes
    window.addEventListener('resize', function() {
        const newItemsPerPage = calculateItemsPerPage();
        if (newItemsPerPage !== itemsPerPage) {
            itemsPerPage = newItemsPerPage;
            totalPages = Math.ceil(ordersData.length / itemsPerPage);
            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }
            renderTable();
        }
    });

    function showTemporaryPopup(message, type = 'info') {
        // Clear any existing timeout
        if (popupTimeout) {
            clearTimeout(popupTimeout);
        }

        // Set popup content and class
        searchResultsText.innerHTML = message;
        searchResultsPopup.className = `search-results-popup show ${type}`;

        // Automatically hide after 3 seconds
        popupTimeout = setTimeout(() => {
            searchResultsPopup.classList.remove('show');
        }, 2000);
    }

    function fetchOrders() {
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

    let adminList = {
        1001: "Vinka",
        1002: "INA",
        1003: "Indy"
    };

    function highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text || "";
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    }

    function truncateText(text, maxLength = 15) {
        if (!text) return "";
        return text.length > maxLength ? 
            `${text.substring(0, maxLength)}...` : 
            text;
    }

    function addImageButtonListeners() {
        document.querySelectorAll('.show-image-btn').forEach(button => {
            button.addEventListener('click', function() {
                const imageUrl = this.getAttribute('data-image-url');
                const thumbnailDiv = this.nextElementSibling;
                const img = thumbnailDiv.querySelector('img');
                
                if (thumbnailDiv.style.display === 'none') {
                    img.src = img.getAttribute('data-src');
                    thumbnailDiv.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    this.title = 'Sembunyikan Foto';
                } else {
                    thumbnailDiv.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-camera"></i>';
                    this.title = 'Tampilkan Foto';
                }
            });
        });
    }

    // Call this after rendering the table
    function renderTable() {
        ordersTable.innerHTML = "";
        let start = (currentPage - 1) * itemsPerPage;
        let end = start + itemsPerPage;
        let paginatedOrders = ordersData.slice(start, end);

        if (paginatedOrders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #888; padding: 20px;">
                        <i class="fas fa-search" style="font-size: 24px; opacity: 0.5;"></i>
                        <div style="margin-top: 10px;">Tidak ada data yang ditemukan</div>
                    </td>
                </tr>
            `;
            showTemporaryPopup("Tidak ada data yang ditemukan", 'warning');
        } else {
            // Check if we're on a small screen
            const isMobile = window.innerWidth <= 768;
            
            paginatedOrders.forEach(order => {
                let platformClass = order.Platform ? order.Platform.toLowerCase().replace(/\s/g, '') : '';
                
                // For mobile, truncate long text to save space
                const namaKet = order.nama_ket;

                
                let row = `<tr>
                    <td>${order.TimeTemp || ''}</td>
                    <td>${highlightText(order.id_input || '', currentSearchTerms.orderId)}</td>
                    <td>${highlightText(order.id_pesanan || '', currentSearchTerms.orderId)}</td>
                    <td>${adminList[order.id_admin] || order.id_admin || ''}</td>
                    <td class="platform-${platformClass}">${order.Platform || ''}</td>
                    <td>${order.qty || '0'}</td>
                    <td>
                        ${order.link ? 
                            `<div class="d-flex flex-column align-items-center">
                                <button class="btn show-image-btn" 
                                        data-image-url="${order.link}"
                                        title="Tampilkan Foto">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <div class="image-thumbnail" style="display: none;">
                                    <img data-src="${order.link}" alt="Order Image" 
                                         onclick="window.open('${order.link}', '_blank')"
                                         onerror="this.onerror=null; this.src='path/to/fallback-image.png';">
                                </div>
                            </div>` 
                            : ''}
                    </td>
                    <td>${highlightText(namaKet, currentSearchTerms.namaKet)}</td>
                    <td>${formatTimestamp(order.Deadline)}</td>
                </tr>`;
                ordersTable.innerHTML += row;
            });
        }

        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
        
        document.getElementById("prevPage").disabled = currentPage === 1;
        document.getElementById("nextPage").disabled = currentPage === totalPages || totalPages === 0;
        
        // Add at the end of renderTable function
        addImageButtonListeners();
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return "";
    
        try {
            let date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return timestamp; // Return original if invalid date
            }
        
            let hours = String(date.getHours()).padStart(2, "0");
            let minutes = String(date.getMinutes()).padStart(2, "0");
        
            let day = String(date.getDate()).padStart(2, "0");
            let month = String(date.getMonth() + 1).padStart(2, "0");
        
            return `${hours}:${minutes} / ${day}-${month}`;
        } catch (e) {
            console.error("Error formatting date:", e);
            return timestamp;
        }
    }

    function searchData(type) {
        const searchOrderIdValue = searchOrderIdInput.value.trim().toLowerCase();
        const searchNamaKetValue = searchNamaKetInput.value.trim().toLowerCase();

        // Store search terms for highlighting
        currentSearchTerms = {
            orderId: searchOrderIdValue,
            namaKet: searchNamaKetValue
        };

        // Combine both search inputs
        ordersData = allOrdersData.filter(order => {
            const matchOrderId = searchOrderIdValue === '' || 
                ((order.id_pesanan && order.id_pesanan.toLowerCase().includes(searchOrderIdValue)) ||
                 (order.id_input && order.id_input.toLowerCase().includes(searchOrderIdValue)));
            
            const matchNamaKet = searchNamaKetValue === '' || 
                (order.nama_ket && order.nama_ket.toLowerCase().includes(searchNamaKetValue));
            
            return matchOrderId && matchNamaKet;
        });

        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / itemsPerPage);
        renderTable();

        // Show total results found
        const resultsFound = ordersData.length;
        if (resultsFound > 0) {
            showTemporaryPopup(`Ditemukan ${resultsFound} hasil pencarian`, 'success');
        } else {
            showTemporaryPopup("Tidak ada hasil yang ditemukan", 'warning');
        }
    }

    // Pagination Listeners
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

    // Search Listeners
    searchOrderIdBtn.addEventListener("click", () => searchData('orderId'));
    searchNamaKetBtn.addEventListener("click", () => searchData('namaKet'));

    // Search on Enter key
    searchOrderIdInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchData('orderId');
            event.preventDefault(); // Prevent form submission if in a form
        }
    });
    
    searchNamaKetInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchData('namaKet');
            event.preventDefault(); // Prevent form submission if in a form
        }
    });

    // Refresh Button Listener
    document.getElementById("refreshBtn").addEventListener("click", function () {
        searchOrderIdInput.value = "";
        searchNamaKetInput.value = "";
        document.getElementById("platformFilter").value = "all";
        ordersData = [...allOrdersData];
        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / itemsPerPage);
        currentSearchTerms = { orderId: '', namaKet: '' };
        renderTable();
        showTemporaryPopup("Data berhasil direset", 'info');
    });

    // Platform Filter Listener
    document.getElementById("platformFilter").addEventListener("change", function () {
        let selectedPlatform = this.value;
        if (selectedPlatform === "all") {
            ordersData = [...allOrdersData];
        } else {
            ordersData = allOrdersData.filter(order => order.Platform === selectedPlatform);
        }
        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / itemsPerPage);
        renderTable();
        
        const platformMessage = selectedPlatform === 'all' 
            ? 'Menampilkan semua platform' 
            : `Menampilkan platform ${selectedPlatform}`;
        showTemporaryPopup(platformMessage, 'info');
    });

    // Handle network connectivity issues
    window.addEventListener('online', function() {
        showTemporaryPopup("Anda kembali online! Memuat ulang data...", 'success');
        setTimeout(fetchOrders, 1000);
    });
    
    window.addEventListener('offline', function() {
        showTemporaryPopup("Anda sedang offline. Beberapa fitur mungkin tidak berfungsi.", 'warning');
    });

    // Check if we have cached data in sessionStorage
    const loadFromCache = () => {
        const cachedData = sessionStorage.getItem('ordersData');
        if (cachedData) {
            try {
                allOrdersData = JSON.parse(cachedData);
                ordersData = [...allOrdersData];
                totalPages = Math.ceil(ordersData.length / itemsPerPage);
                renderTable();
                showTemporaryPopup("Data dimuat dari cache", 'info');
                return true;
            } catch(e) {
                console.error("Error loading from cache:", e);
                return false;
            }
        }
        return false;
    };

    // If no cached data or loading from cache fails, fetch fresh data
    if (!loadFromCache()) {
        fetchOrders();
    }
});