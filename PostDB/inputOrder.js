document.addEventListener('DOMContentLoaded', function() {
    // Mapping nama admin
    const adminNames = {
        '1001': 'Vinka',
        '1002': 'Ina',
        '1003': 'Indy',
        '1004': 'Untung',
        '1005': 'Ikbal'
    };

    // DB Data untuk Product
    const products = [
        { id_produk: 47001, nama_produk: "MNK-Large", id_bahan: 46001 },
        { id_produk: 47002, nama_produk: "MNK-Medium", id_bahan: 46001 },
        { id_produk: 47003, nama_produk: "MNK-Small", id_bahan: 46001 },
        { id_produk: 47004, nama_produk: "MNK-Mini", id_bahan: 46001 },
        { id_produk: 47005, nama_produk: "MNK-Middle", id_bahan: 46001 },
        { id_produk: 47006, nama_produk: "Travel Bag", id_bahan: 46001 },
        { id_produk: 47007, nama_produk: "ToteBag Large", id_bahan: 46001 },
        { id_produk: 47076, nama_produk: "ToteBag Large Pouch", id_bahan: 46001},
        { id_produk: 47008, nama_produk: "Kawai", id_bahan: 46001 },
        { id_produk: 47009, nama_produk: "Mini Sling", id_bahan: 46001 },
        { id_produk: 47010, nama_produk: "Medium Sling", id_bahan: 46001 },
        { id_produk: 47011, nama_produk: "Gym Bag", id_bahan: 46001 },
        { id_produk: 47012, nama_produk: "Darla", id_bahan: 46001 },
        { id_produk: 47013, nama_produk: "Bolster", id_bahan: 46001 },
        { id_produk: 47014, nama_produk: "Indie Bag", id_bahan: 46001 },
        { id_produk: 47015, nama_produk: "Mobile Bag", id_bahan: 46001 },
        { id_produk: 47044, nama_produk: "MNK-Paku", id_bahan: 46001 },
        { id_produk: 47045, nama_produk: "MNK-Kulit", id_bahan: 46002 },
        { id_produk: 47046, nama_produk: "Alana Ransel", id_bahan: 46001 },
        { id_produk: 47072, nama_produk: "Scarf", id_bahan: 46001 },
        { id_produk: 47016, nama_produk: "Dompet type-1", id_bahan: 46002 },
        { id_produk: 47017, nama_produk: "Card Holder", id_bahan: 46002 },
        { id_produk: 47018, nama_produk: "Lanyard", id_bahan: 46002 },
        { id_produk: 47019, nama_produk: "Anna Karenina", id_bahan: 46002 },
        { id_produk: 47020, nama_produk: "Lily Bag", id_bahan: 46002 },
        { id_produk: 47021, nama_produk: "Puffy Laptop Zipper", id_bahan: 46003 },
        { id_produk: 47022, nama_produk: "Puffy Laptop Handle", id_bahan: 46003 },
        { id_produk: 47023, nama_produk: "Puffy Laptop HandZip", id_bahan: 46003 },
        { id_produk: 47024, nama_produk: "Puffy Kanaya", id_bahan: 46003 },
        { id_produk: 47025, nama_produk: "Puffy Karissa", id_bahan: 46003 },
        { id_produk: 47026, nama_produk: "Puffy Kalandra", id_bahan: 46003 },
        { id_produk: 47027, nama_produk: "Puffy Kalia", id_bahan: 46003 },
        { id_produk: 47028, nama_produk: "Puffy Table", id_bahan: 46003 },
        { id_produk: 47029, nama_produk: "Puffy Loly Bag", id_bahan: 46003 },
        { id_produk: 47030, nama_produk: "Puffy Adel Rantai", id_bahan: 46003 },
        { id_produk: 47040, nama_produk: "Pouch Make-up Puffy", id_bahan: 46003 },
        { id_produk: 47041, nama_produk: "Pouch Make-up", id_bahan: 46003 },
        { id_produk: 47031, nama_produk: "Marsoto", id_bahan: 46004 },
        { id_produk: 47032, nama_produk: "Clutch", id_bahan: 46005 },
        { id_produk: 47033, nama_produk: "Pouch Sejadah", id_bahan: 46005 },
        { id_produk: 47034, nama_produk: "Sejadah Rumbai", id_bahan: 46005 },
        { id_produk: 47035, nama_produk: "Sejadah Rumbai Anti-Slip", id_bahan: 46005 },
        { id_produk: 47036, nama_produk: "Sejadah Biasa", id_bahan: 46005 },
        { id_produk: 47037, nama_produk: "Sejadah Biasa Anti-Slip", id_bahan: 46005 },
        { id_produk: 47038, nama_produk: "Sejadah Mini", id_bahan: 46005 },
        { id_produk: 47039, nama_produk: "Sejadah Mini Rumbai", id_bahan: 46005 },
        { id_produk: 47042, nama_produk: "Mukena Print", id_bahan: 46006 },
        { id_produk: 47043, nama_produk: "Mukena Polos", id_bahan: 46008 },
        { id_produk: 47047, nama_produk: "MNK-Velvet-L", id_bahan: 46009 },
        { id_produk: 47048, nama_produk: "MNK-Velvet-M", id_bahan: 46009 },
        { id_produk: 47049, nama_produk: "MNK-Velvet-S", id_bahan: 46009 },
        { id_produk: 47050, nama_produk: "MNK-Velvet-Middle", id_bahan: 46009 },
        { id_produk: 47051, nama_produk: "MNK-Velvet-Mini", id_bahan: 46009 },
        { id_produk: 47052, nama_produk: "ToteBag Large-Velvet", id_bahan: 46009 },
        { id_produk: 47053, nama_produk: "SJD-Velvet", id_bahan: 46009 },
        { id_produk: 47054, nama_produk: "SJD-Velvet-Rumbai", id_bahan: 46009 },
        { id_produk: 47055, nama_produk: "Clutch-Velvet", id_bahan: 46009 },
        { id_produk: 47056, nama_produk: "WaistBag", id_bahan: 46001 },
        { id_produk: 47057, nama_produk: "Brandon", id_bahan: 46001 },
        { id_produk: 47058, nama_produk: "Raine SlingBag", id_bahan: 46001 },
        { id_produk: 47059, nama_produk: "Laurent CrossBody Bag", id_bahan: 46001 },
        { id_produk: 47060, nama_produk: "SR.Cover Custom", id_bahan: 46001 },
        { id_produk: 47061, nama_produk: "SR.Cover XL (30 inch)", id_bahan: 46001 },
        { id_produk: 47062, nama_produk: "SR.Cover L (28 inch)", id_bahan: 46001 },
        { id_produk: 47063, nama_produk: "SR.Cover M (24 inch)", id_bahan: 46001 },
        { id_produk: 47064, nama_produk: "SR.Cover S (20 inch)", id_bahan: 46001 },
        { id_produk: 47065, nama_produk: "Cover Al Qur'an", id_bahan: 46001 },
        { id_produk: 47066, nama_produk: "MNK Medium 3D Edition", id_bahan: 46001 },
        { id_produk: 47067, nama_produk: "SR.Cover Custom-scuba", id_bahan: 46007 },
        { id_produk: 47068, nama_produk: "SR.Cover XL (30 inch)-scuba", id_bahan: 46007 },
        { id_produk: 47069, nama_produk: "SR.Cover L (28 inch)-scuba", id_bahan: 46007 },
        { id_produk: 47070, nama_produk: "SR.Cover M (24 inch)-scuba", id_bahan: 46007 },
        { id_produk: 47071, nama_produk: "SR.Cover S (20 inch)-scuba", id_bahan: 46007 },
        { id_produk: 47073, nama_produk: "Tas Koper Bu Ola", id_bahan: 46008},
        { id_produk: 47074, nama_produk: "Renata Bag", id_bahan: 46005},
        { id_produk: 47075, nama_produk: "Estelle Bag", id_bahan: 46001},
        { id_produk: 47077, nama_produk: "ARA BAG", id_bahan: 46001},
        { id_produk: 47078, nama_produk: "Miranda Bag", id_bahan: 46001},
        { id_produk: 47079, nama_produk: "Laurent Slingbag", id_bahan: 46001},
        { id_produk: 47080, nama_produk: "Tania", id_bahan: 46001},
        { id_produk: 47081, nama_produk: "Dalina", id_bahan: 46001}
    ];
    

    // Ambil admin yang sedang login dari localStorage
    const currentAdminId = localStorage.getItem('currentAdminId');
    if (!currentAdminId) {
        window.location.href = 'login.html'; // Redirect kalau belum login
        return;
    }

    // Tampilkan nama admin yang login
    const adminNameElement = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    if (adminNameElement) {
        adminNameElement.textContent = `Logged in as: ${adminNames[currentAdminId]}`;
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentAdminId');
            window.location.href = 'login.html';
        });
    }

    const orderForm = document.getElementById('orderForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitBtn = document.getElementById('submitBtn');
    const imageUpload = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const linkInput = document.getElementById('link');
    const materialButtons = document.querySelectorAll('.material-btn');
    const productModal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const productList = document.getElementById('productList');
    const closeModal = document.querySelector('.close-modal');
    const productSelectionGroup = document.getElementById('productSelectionGroup');
    const productSelect = document.getElementById('id_produk');
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const platformRadios = document.querySelectorAll('input[name="platform"]');
    
    let selectedMaterial = null;
    let selectedProductId = null;
    let selectedType = null;
    let selectedFile = null; // For storing the image file to upload

    // Setup Material Buttons
    materialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const materialId = this.getAttribute('data-material');
            const materialName = this.getAttribute('data-name');
            
            // Set selected material
            selectedMaterial = materialId;
            
            // Highlight the selected button
            materialButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Only show the modal if a type (RS/Non-RS) is selected
            if (selectedType) {
                showProductsByMaterial(materialId, materialName);
            } else {
                // Show a notification to select type first
                responseMessage.innerHTML = '<div class="alert alert-warning">Pilih tipe RS atau Non-RS terlebih dahulu</div>';
                responseMessage.style.display = 'block';
                
                // Auto hide after 3 seconds
                setTimeout(() => {
                    responseMessage.style.display = 'none';
                }, 3000);
            }
        });
    });

    // Setup Type Radios
    typeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            selectedType = this.value;
            
            // If material is already selected, show products
            if (selectedMaterial) {
                const selectedButton = document.querySelector(`.material-btn[data-material="${selectedMaterial}"]`);
                if (selectedButton) {
                    const materialName = selectedButton.getAttribute('data-name');
                    showProductsByMaterial(selectedMaterial, materialName);
                }
            }
        });
    });

    // Close modal when clicking X or outside the modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            productModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(event) {
        if (productModal && event.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Function to show products by material
    function showProductsByMaterial(materialId, materialName) {
        if (!modalTitle || !productList || !productModal) return;
        
        modalTitle.textContent = `Produk ${materialName} (${selectedType === '45001' ? 'RS' : 'Non-RS'})`;
        productList.innerHTML = '';
        
        // Filter products by selected material
        const filteredProducts = products.filter(product => product.id_bahan.toString() === materialId);
        
        // Create product items
        filteredProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.textContent = product.nama_produk;
            productItem.dataset.productId = product.id_produk;
            
            productItem.addEventListener('click', function() {
                selectProduct(product.id_produk, product.nama_produk);
                productModal.style.display = 'none';
            });
            
            productList.appendChild(productItem);
        });
        
        // Show modal
        productModal.style.display = 'block';
    }

    // Function to select a product
    function selectProduct(productId, productName) {
        selectedProductId = productId;
    
        // Update dropdown
        if (productSelect) {
            productSelect.innerHTML = `<option value="${productId}" selected>${productName}</option>`;
        }
    
        // Show the product selection group
        if (productSelectionGroup) {
            productSelectionGroup.style.display = 'block';
        }
    
        // Tampilkan opsi/penutup setelah produk dipilih
        if (opsiPenutupGroup) {
            opsiPenutupGroup.style.display = 'block';
        }
    
        // Reset opsi & penutup saat produk baru dipilih
        if (opsiSelect) opsiSelect.value = '';
        if (penutupSelect) penutupSelect.value = '';
    
        updateNamaKetProduk(productName);
    }
    
    // Helper untuk update baris Produk di Keterangan Orderan
    function updateNamaKetProduk(productName) {
        const namaKet = document.getElementById('nama_ket');
        if (namaKet) {
            const typeText = selectedType === '45001' ? 'RS' : 'Non-RS';
            const opsiText = opsiSelect && opsiSelect.value ? opsiSelect.value : '';
            const penutupText = penutupSelect && penutupSelect.value ? penutupSelect.value : '';
            let produkLine = productName;
            if (opsiText && penutupText) {
                produkLine = `${productName}, ${opsiText} ${penutupText}`;
            }
            const lines = namaKet.value.split('\n');
            const nameIndex = lines.findIndex(line => line.trim().startsWith('Produk'));
            const typeIndex = lines.findIndex(line => line.trim().startsWith('Type'));
    
            if (nameIndex !== -1) {
                lines[nameIndex] = ` Produk             : ${produkLine}`;
            }
    
            if (typeIndex !== -1) {
                lines[typeIndex] = ` Type               : ${typeText}`;
            }
    
            namaKet.value = lines.join('\n');
        }
    }
    
    // Event listener untuk opsi/penutup
    if (opsiSelect) {
        opsiSelect.addEventListener('change', function() {
            // Ambil nama produk dari dropdown
            const selectedOption = productSelect?.options[0]?.text || '';
            updateNamaKetProduk(selectedOption);
        });
    }
    if (penutupSelect) {
        penutupSelect.addEventListener('change', function() {
            const selectedOption = productSelect?.options[0]?.text || '';
            updateNamaKetProduk(selectedOption);
        });
    }

    // Handle clipboard paste events (for screenshots)
    document.addEventListener('paste', function(event) {
        if (!previewImage) return;
        
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    selectedFile = file;
                    
                    // Create a blob URL for the pasted image
                    const imageUrl = URL.createObjectURL(file);
                    
                    // Update the preview image
                    previewImage.src = imageUrl;
                    previewImage.style.display = 'block';
                    
                    // Prevent default paste behavior 
                    event.preventDefault();
                    break;
                }
            }
        }
    });

    // Handle image upload via file input
    if (imageUpload) {
        imageUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && previewImage) {
                selectedFile = file;
                
                // Update the preview image
                const imageUrl = URL.createObjectURL(file);
                previewImage.src = imageUrl;
                previewImage.style.display = 'block';
            }
        });
    }

    // Handle perubahan pada input link secara manual
    if (linkInput) {
        linkInput.addEventListener('input', function() {
            const linkValue = linkInput.value;
            // Kosongkan preview jika link diubah manual
            if (linkValue && !linkValue.startsWith('blob:')) {
                previewImage.style.display = 'none';
                previewImage.src = '';
                selectedFile = null;
            }
        });
    }

    // Inisialisasi nilai default untuk nama_ket jika kosong
    const namaKet = document.getElementById('nama_ket');
    if (namaKet && !namaKet.value.trim()) {
        namaKet.value = ` Nama                  : \n Type                    : \n Warna                 : \n Note                    : `;
    }
    
    // Handle form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            
            if (submitBtn) {
                event.preventDefault();
                submitBtn.disabled = true; // Disable button to prevent multiple submissions
            }
            
            // Get the selected platform value
            const platformRadio = document.querySelector('input[name="platform"]:checked');
            const platformValue = platformRadio ? platformRadio.value : '';

            // Validate form - check product, type and platform
            if (!selectedProductId || !selectedType) {
                if (responseMessage) {
                    responseMessage.innerHTML = '<div class="alert alert-danger">Pilih bahan, tipe, dan produk terlebih dahulu</div>';
                    responseMessage.style.display = 'block';
                }
                
                if (submitBtn) {
                    submitBtn.disabled = false; // Re-enable button
                }
                return;
            }
            
            // Validasi Platform (wajib diisi)
            if (!platformValue) {
                if (responseMessage) {
                    responseMessage.innerHTML = '<div class="alert alert-danger">Platform wajib diisi</div>';
                    responseMessage.style.display = 'block';
                }
                
                if (submitBtn) {
                    submitBtn.disabled = false; // Re-enable button
                }
                return;
            }
            
            // Get form values
            const idPesanan = document.getElementById('id_pesanan')?.value || '';
            const qtyInput = document.getElementById('qty')?.value || '0';
            const qty = parseInt(qtyInput);
            const deadline = document.getElementById('deadline')?.value || '';
            const namaKetValue = namaKet?.value || '';
            const link = linkInput?.value || '';
            
            // Prepare data for submission
            // If we have a file, use FormData, otherwise use JSON
            if (selectedFile) {
                const formData = new FormData();
                formData.append('id_pesanan', idPesanan);
                formData.append('id_admin', currentAdminId);
                formData.append('Platform', platformValue);
                formData.append('qty', qty);
                formData.append('Deadline', deadline);
                formData.append('id_produk', selectedProductId);
                formData.append('id_type', selectedType);
                formData.append('nama_ket', namaKetValue);
                formData.append('photo', selectedFile);
                
                // If link is provided manually, include it
                if (link && !link.startsWith('blob:')) {
                    formData.append('link', link);
                }
                
                // Send data with FormData (multipart/form-data)
                fetch('http://100.124.58.32:5000/api/input-order', {
                    method: 'POST',
                    body: formData
                })
                .then(handleResponse)
                .then(handleSuccess)
                .catch(handleError)
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false; // Re-enable button
                    }
                });
            } else {
                // Create JSON data object when no file is present
                const jsonData = {
                    id_pesanan: idPesanan,
                    id_admin: currentAdminId,
                    Platform: platformValue,
                    qty: qty,
                    Deadline: deadline,
                    id_produk: parseInt(selectedProductId),
                    id_type: parseInt(selectedType),
                    nama_ket: namaKetValue,
                    link: link
                };
                
                // Send data with JSON
                fetch('http://100.124.58.32:5000/api/input-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jsonData)
                })
                .then(handleResponse)
                .then(handleSuccess)
                .catch(handleError)
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false; // Re-enable button
                    }
                });
            }
        });
    }
    
    // Helper functions for fetch responses
    function handleResponse(response) {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(`Server error: ${errorData.message || text}`);
                } catch (e) {
                    throw new Error(`HTTP error! Status: ${response.status}, Body: ${text || 'No response body'}`);
                }
            });
        }
        return response.json();
    }
    
    function handleSuccess(data) {
        if (responseMessage) {
            if (data.status === 'success') {
                responseMessage.innerHTML = `
                    <div class="alert alert-success" style="
                        background-color: #d4edda;
                        color: #155724;
                        border-color: #c3e6cb;
                        padding: 15px;
                        border-radius: 4px;
                        margin-bottom: 20px;
                        font-weight: bold;
                    ">
                        ✅ ${data.message}
                    </div>`;
                // Reset form on success
                orderForm.reset();
                selectedProductId = null;
                selectedType = null;
                selectedMaterial = null;
                selectedFile = null;
                
                // Reset UI elements
                materialButtons.forEach(btn => btn.classList.remove('active'));
                typeRadios.forEach(radio => radio.checked = false);
                platformRadios.forEach(radio => radio.checked = false);
                
                if (productSelect) {
                    productSelect.innerHTML = '<option value="">-- Pilih Produk --</option>';
                }
                
                if (productSelectionGroup) {
                    productSelectionGroup.style.display = 'none';
                }
                
                if (previewImage) {
                    previewImage.style.display = 'none';
                    previewImage.src = '';
                }
                
                // Reset keterangan
                if (namaKet) {
                    namaKet.value = ` Nama                  : \n Type                    : \n Motif/Kode         : \n Keterangan       : \n Note : DESAIN KIRIM ADMIN DULU`;
                }
            } else {
                responseMessage.innerHTML = `
                    <div class="alert alert-warning" style="
                        background-color: #fff3cd;
                        color: #856404;
                        border-color: #ffeeba;
                        padding: 15px;
                        border-radius: 4px;
                        margin-bottom: 20px;
                        font-weight: bold;
                    ">
                        ⚠️ ${data.message}
                    </div>`;
            }
            responseMessage.style.display = 'block';
            
            // Scroll to message
            responseMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    function handleError(error) {
        console.error('Error:', error);
        if (responseMessage) {
            responseMessage.innerHTML = `
                <div class="alert alert-danger" style="
                    background-color: #f8d7da;
                    color: #721c24;
                    border-color: #f5c6cb;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    font-weight: bold;
                ">
                    ❌ Terjadi kesalahan saat mengirim data: ${error.message}
                </div>`;
            responseMessage.style.display = 'block';
        }
    }
});