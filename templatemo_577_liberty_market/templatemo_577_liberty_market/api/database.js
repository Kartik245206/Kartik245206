const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.productsFile = path.join(this.dataDir, 'products.json');
        this.usersFile = path.join(this.dataDir, 'users.json');
        this.transactionsFile = path.join(this.dataDir, 'transactions.json');
        this.initialize();
    }

    initialize() {
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // Initialize files if they don't exist
        this.initializeFile(this.productsFile, []);
        this.initializeFile(this.usersFile, []);
        this.initializeFile(this.transactionsFile, []);
    }

    initializeFile(filePath, defaultData) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    // Product Management Methods
    async getProducts() {
        try {
            const data = await fs.promises.readFile(this.productsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading products:', error);
            return [];
        }
    }

    async addProduct(product) {
        try {
            const products = await this.getProducts();
            product.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            products.push(product);
            await fs.promises.writeFile(this.productsFile, JSON.stringify(products, null, 2));
            return product;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const products = await this.getProducts();
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
                products[index] = { ...products[index], ...updatedProduct };
                await fs.promises.writeFile(this.productsFile, JSON.stringify(products, null, 2));
                return products[index];
            }
            throw new Error('Product not found');
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const products = await this.getProducts();
            const filteredProducts = products.filter(p => p.id !== id);
            await fs.promises.writeFile(this.productsFile, JSON.stringify(filteredProducts, null, 2));
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Function to clear the database
    async clearDatabase() {
        try {
        // Define empty data structures
        const emptyProducts = [];
        const emptyUsers = [];
        const emptyTransactions = [];

        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write empty data to files
        await Promise.all([
            fs.promises.writeFile(productsFile, JSON.stringify(emptyProducts, null, 2)),
            fs.promises.writeFile(usersFile, JSON.stringify(emptyUsers, null, 2)),
            fs.promises.writeFile(transactionsFile, JSON.stringify(emptyTransactions, null, 2))
        ]);

        return true;
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
}

}

module.exports = Database;