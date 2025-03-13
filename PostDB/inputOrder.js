document.addEventListener('DOMContentLoaded', function() {
    // Mapping nama admin
    const adminNames = {
        '1001': 'Lilis',
        '1002': 'Ina',
        '1003': 'Indy'
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
        { id_produk: 47008, nama_produk: "Kawai", id_bahan: 46001 },
        { id_produk: 47009, nama_produk: "Mini Sling", id_bahan: 46001 },
        { id_produk: 47010, nama_produk: "Medium Sling", id_bahan: 46001 },
        { id_produk: 47011, nama_produk: "Gym Bag", id_bahan: 46001 },
        { id_produk: 47012, nama_produk: "Darla", id_bahan: 46001 },
        { id_produk: 47013, nama_produk: "Bolster", id_bahan: 46001 },
        { id_produk: 47014, nama_produk: "Indie Bag", id_bahan: 46001 },
        { id_produk: 47015, nama_produk: "Mobile Bag", id_bahan: 46001 },
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
        { id_produk: 47031, nama_produk: "Marsoto", id_bahan: 46004 }
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
    const platformRadios = document.querySelectorAll('input[name="platform"]'); // Added this line
    
    let selectedMaterial = null;
    let selectedProductId = null;
    let selectedType = null;

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
        
        // Update keterangan text with product name
        const namaKet = document.getElementById('nama_ket');
        if (namaKet) {
            const typeText = selectedType === '45001' ? 'RS' : 'Non-RS';
            const lines = namaKet.value.split('\n');
            const nameIndex = lines.findIndex(line => line.trim().startsWith('Produk'));
            const typeIndex = lines.findIndex(line => line.trim().startsWith('Type'));
            
            if (nameIndex !== -1) {
                lines[nameIndex] = ` Produk                  : ${productName}`;
            }
            
            if (typeIndex !== -1) {
                lines[typeIndex] = ` Type                    : ${typeText}`;
            }
            
            namaKet.value = lines.join('\n');
        }
    }

    // Handle clipboard paste events (for screenshots)
    document.addEventListener('paste', function(event) {
        if (!previewImage) return;
        
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // Create a blob URL for the pasted image
                    const imageUrl = URL.createObjectURL(file);
                    
                    // Update the preview image
                    previewImage.src = imageUrl;
                    previewImage.style.display = 'block';
                    
                    // Handle the image file
                    handleImageUpload(file);
                    
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
                // Create a blob URL for the selected file
                const imageUrl = URL.createObjectURL(file);
                
                // Update the preview image
                previewImage.src = imageUrl;
                previewImage.style.display = 'block';
                
                // Handle the image file
                handleImageUpload(file);
            }
        });
    }

    // Function to handle the image (works for both uploaded and pasted images)
    function handleImageUpload(file) {
        // You can implement image upload to server here
        // For now, we'll just display the image
        console.log('Image file:', file);
        
        // If you want to clear the file input
        if (imageUpload) {
            imageUpload.value = '';
        }
    }

    // Inisialisasi nilai default untuk nama_ket jika kosong
    const namaKet = document.getElementById('nama_ket');
    if (namaKet && !namaKet.value.trim()) {
        namaKet.value = ` Nama                  : \n Type                    : \n Warna                 : \n Note                    : `;
    }
    
    // Handle form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (submitBtn) {
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
            const namaKetValue = document.getElementById('nama_ket')?.value || '';
            const link = document.getElementById('link')?.value || '';
            
            // Create JSON data object
            const formData = {
                id_pesanan: idPesanan,
                id_admin: currentAdminId,
                Platform: platformValue,  // Use the selected platform value
                qty: qty,
                Deadline: deadline,
                id_produk: parseInt(selectedProductId),
                id_type: parseInt(selectedType),
                nama_ket: namaKetValue,
                link: link
            };
            
            console.log("Sending data:", formData);
            
            // Send the data to the API as JSON
            fetch('http://100.117.80.112:5000/api/input-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
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
            })
            .then(data => {
                if (responseMessage) {
                    if (data.status === 'success') {
                        responseMessage.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                        // Reset form on success
                        orderForm.reset();
                        selectedProductId = null;
                        selectedType = null;
                        selectedMaterial = null;
                        
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
                        }
                        
                        // Reset keterangan
                        if (namaKet) {
                            namaKet.value = ` Nama                  : \n Type                    : \n Motif/Kode         : \n Keterangan       : \n Note : DESAIN KIRIM ADMIN DULU`;
                        }
                    } else {
                        responseMessage.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
                    }
                    responseMessage.style.display = 'block';
                    
                    // Scroll to message
                    responseMessage.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (responseMessage) {
                    responseMessage.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan saat mengirim data: ${error.message}</div>`;
                    responseMessage.style.display = 'block';
                }
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false; // Re-enable button
                }
            });
        });
    }
});