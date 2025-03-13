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
        }, 1000);
    }

    function fetchOrders() {
        fetch("http://100.117.80.112:5000/api/get-input-table")
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    allOrdersData = data.data;
                    ordersData = [...allOrdersData];
                    totalPages = Math.ceil(ordersData.length / 10);
                    renderTable();
                    showTemporaryPopup("Data berhasil dimuat", 'success');
                } else {
                    throw new Error("Failed to fetch data");
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                showTemporaryPopup("Gagal mengambil data. Silakan coba lagi.", 'error');
            });
    }

    let adminList = {
        1001: "LILIS",
        1002: "INA"
    };

    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    }

    function renderTable() {
        ordersTable.innerHTML = "";
        let start = (currentPage - 1) * 10;
        let end = start + 10;
        let paginatedOrders = ordersData.slice(start, end);

        if (paginatedOrders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #888;">
                        Tidak ada data yang ditemukan
                    </td>
                </tr>
            `;
            showTemporaryPopup("Tidak ada data yang ditemukan", 'warning');
        } else {
            paginatedOrders.forEach(order => {
                let platformClass = order.Platform.toLowerCase().replace(/\s/g, '');
                
                let row = `<tr>
                    <td>${order.TimeTemp}</td>
                    <td>${highlightText(order.id_input, currentSearchTerms.orderId)}</td>
                    <td>${highlightText(order.id_pesanan, currentSearchTerms.orderId)}</td>
                    <td>${adminList[order.id_admin] || order.id_admin}</td>
                    <td class="platform-${platformClass}">${order.Platform}</td>
                    <td>${order.qty}</td>
                    <td>${highlightText(order.nama_ket, currentSearchTerms.namaKet)}</td>
                    <td>${formatTimestamp(order.Deadline)}</td>
                </tr>`;
                ordersTable.innerHTML += row;
            });
        }

        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        
        document.getElementById("prevPage").disabled = currentPage === 1;
        document.getElementById("nextPage").disabled = currentPage === totalPages;
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return "";
    
        let date = new Date(timestamp);
    
        let hours = String(date.getHours()).padStart(2, "0");
        let minutes = String(date.getMinutes()).padStart(2, "0");
    
        let day = String(date.getDate()).padStart(2, "0");
        let month = String(date.getMonth() + 1).padStart(2, "0");
    
        return `${hours}:${minutes} / ${day}-${month}`;
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
                (order.id_pesanan.toLowerCase().includes(searchOrderIdValue) ||
                 order.id_input.toLowerCase().includes(searchOrderIdValue));
            
            const matchNamaKet = searchNamaKetValue === '' || 
                order.nama_ket.toLowerCase().includes(searchNamaKetValue);
            
            return matchOrderId && matchNamaKet;
        });

        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / 10);
        renderTable();

        // Show total results found
        const resultsFound = ordersData.length;
        if (resultsFound > 0) {
            showTemporaryPopup(`Ditemukan ${resultsFound} hasil pencarian`, 'success');
        } else {
            showTemporaryPopup("Tidak ada hasil yang ditemukan", 'warning');
        }
    }

    function updateData() {
        fetch("/api/update-print-status-layout", { method: "PUT" })
            .then(response => response.json())
            .then(data => {
                console.log("Update sukses:", data);
                showTemporaryPopup("Data berhasil diperbarui", 'success');
            })
            .catch(error => {
                console.error("Update gagal:", error);
                showTemporaryPopup("Gagal memperbarui data", 'error');
            });
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
        }
    });
    searchNamaKetInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchData('namaKet');
        }
    });

    // Refresh Button Listener
    document.getElementById("refreshBtn").addEventListener("click", function () {
        searchOrderIdInput.value = "";
        searchNamaKetInput.value = "";
        document.getElementById("platformFilter").value = "all";
        ordersData = [...allOrdersData];
        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / 10);
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
        totalPages = Math.ceil(ordersData.length / 10);
        renderTable();
        
        const platformMessage = selectedPlatform === 'all' 
            ? 'Menampilkan semua platform' 
            : `Menampilkan platform ${selectedPlatform}`;
        showTemporaryPopup(platformMessage, 'info');
    });

    // Auto Refresh Data
    // setInterval(updateData, 5000);  // Update setiap 5 detik

    fetchOrders();
});