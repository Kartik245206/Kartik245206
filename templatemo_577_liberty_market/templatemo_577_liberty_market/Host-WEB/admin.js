// Product Management Functions
function saveProduct() {
    const productImage = document.getElementById('productImage').files[0];
    if (!productImage) {
        alert('Please select an image');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const newProduct = {
            id: Date.now(),
            image: `assets/images/products/${productImage.name}`, // Store base64 directly
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: document.getElementById('productPricePerDay').value,
            total: document.getElementById('productTotalAmount').value,
            plans: document.getElementById('productName').value + ' Plan', // Add plans field for MongoDB
            categoryClass: getCategoryClass(document.getElementById('productCategory').value)
        };

        // Save to localStorage for local display
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));

        // Add to main website
        updateMainWebsiteProducts(newProduct);

        // Save to MongoDB via API
        saveProductToServer(newProduct);

        // Reset form and close modal
        document.getElementById('addProductForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();

        // Reload admin product table
        loadProducts();
    };
    
    // Add file upload logic
    uploadImage(productImage).then(() => {
        reader.readAsDataURL(productImage);
    });
}



function getCategoryClass(category) {
    const classMap = {
        'iPhone': 'msc',
        'Smartwatch': 'dig',
        'Earphone': 'blc',
        'Laptops': 'vtr'
    };
    return classMap[category] || '';
}


function updateMainWebsiteProducts(product) {
    const marketContainer = document.querySelector('.currently-market .row.grid');
    if (!marketContainer) return;

    const productHTML = `
        <div class="col-lg-6 currently-market-item all ${product.categoryClass}">
            <div class="item">
                <div class="left-image">
                    <img src="${product.image}" alt="${product.name}" style="border-radius: 40px; min-width: 295px;">
                </div>
                <div class="right-content">
                    <h4>${product.name}</h4>
                    <span class="author"><h2>${product.Plans || ''}</h2></span>
                    <div class="line-dec"></div>
                    <span class="bid">
                        Amount/Day<br><strong>₹${product.price || product.pricePerDay}/day</strong><br><em>(₹${product.total || product.totalAmount})</em>
                    </span>
                    <span class="ends">
                        Ends In<br><strong>100 Days</strong>
                    </span>
                    <div class="text-button">
                        <a href="details.html?id=${product.id}">View Item Details</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    marketContainer.insertAdjacentHTML('beforeend', productHTML);
}

// Function to save product to server via API
function saveProductToServer(product) {
    // Get API base URL based on environment
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://liberty-market.onrender.com';
    
    // Get admin secret for authentication
    const adminSecret = localStorage.getItem('ADMIN_SECRET');
    if (!adminSecret) {
        alert('Admin secret not found. Please login again.');
        return;
    }
    
    // Prepare product data for server
    const serverProduct = {
        name: product.name,
        plans: product.plans,
        category: product.category,
        price: parseFloat(product.price),
        total: parseFloat(product.total),
        image: product.imageData // Use base64 image data
    };
    
    // Send to server
    fetch(`${API_BASE}/api/admin/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer true',
            'x-admin-secret': adminSecret
        },
        body: JSON.stringify(serverProduct)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Product saved to server:', data);
        // Update the product in localStorage with server ID
        updateProductWithServerId(product.id, data._id);
    })
    .catch(error => {
        console.error('Error saving product to server:', error);
        alert('Failed to save product to server. Check console for details.');
    });
}

// Function to update product with server ID
function updateProductWithServerId(localId, serverId) {
    let products = JSON.parse(localStorage.getItem('products') || '[]');
    const index = products.findIndex(p => p.id === localId);
    
    if (index !== -1) {
        products[index].serverId = serverId;
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Function to delete product
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        // Delete from localStorage
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        const productToDelete = products.find(p => p.id === id);
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        
        // Delete from server if it has a server ID
        if (productToDelete && productToDelete.serverId) {
            deleteProductFromServer(productToDelete.serverId);
        }
        
        // Reload products table
        loadProducts();
        
        // Trigger storage event to update main page
        localStorage.setItem('productsUpdated', Date.now().toString());
    }
}

// Function to delete product from server
function deleteProductFromServer(serverId) {
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://liberty-market.onrender.com';
    
    const adminSecret = localStorage.getItem('ADMIN_SECRET');
    if (!adminSecret) return;
    
    fetch(`${API_BASE}/api/admin/products/${serverId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer true',
            'x-admin-secret': adminSecret
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Product deleted from server:', data);
    })
    .catch(error => {
        console.error('Error deleting product from server:', error);
    });
}

function loadProducts() {
    // Try to load products from server first
    loadProductsFromServer();
    
    // Also display products from localStorage for immediate feedback
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productTableBody');
    
    if (!tbody) return;

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${product.price || product.pricePerDay}/day</td>
            <td>₹${product.total || product.totalAmount}</td>
            <td>
                <button class="btn btn-sm btn-warning me-2" onclick='openEditModal(${JSON.stringify(product)})'>
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    // Trigger storage event to update main page
    localStorage.setItem('productsUpdated', Date.now().toString());
}

// Function to load products from server
function loadProductsFromServer() {
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://liberty-market.onrender.com';
    
    const adminSecret = localStorage.getItem('ADMIN_SECRET');
    if (!adminSecret) return;
    
    fetch(`${API_BASE}/api/admin/products`, {
        headers: {
            'Authorization': 'Bearer true',
            'x-admin-secret': adminSecret
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.products && Array.isArray(data.products)) {
            // Convert server products to local format and merge with local products
            mergeServerProducts(data.products);
        }
    })
    .catch(error => {
        console.error('Error loading products from server:', error);
    });
}

// Function to merge server products with local products
function mergeServerProducts(serverProducts) {
    let localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Map server products to local format
    const mappedServerProducts = serverProducts.map(p => ({
        id: Date.now() + Math.floor(Math.random() * 1000), // Generate a unique local ID
        serverId: p._id,
        image: p.image,
        name: p.name,
        category: p.category,
        price: p.price,
        total: p.total,
        plans: p.plans,
        categoryClass: getCategoryClass(p.category)
    }));
    
    // Filter out local products that already have server IDs matching the server products
    const serverIds = serverProducts.map(p => p._id);
    localProducts = localProducts.filter(p => !p.serverId || !serverIds.includes(p.serverId));
    
    // Combine local and server products
    const combinedProducts = [...localProducts, ...mappedServerProducts];
    
    // Save combined products to localStorage
    localStorage.setItem('products', JSON.stringify(combinedProducts));
    
    // Refresh the product table
    const tbody = document.getElementById('productTableBody');
    if (tbody) {
        tbody.innerHTML = combinedProducts.map(product => `
            <tr>
                <td>${product.serverId || product.id}</td>
                <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₹${product.price}/day</td>
                <td>₹${product.total}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick='openEditModal(${JSON.stringify(product)})'>
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
}