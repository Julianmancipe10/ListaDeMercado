import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const Reportes = () => {
    const [user, setUser] = useState(null);
    const [listaCompras, setListaCompras] = useState([]);
    const [reporteResumen, setReporteResumen] = useState({
        totalGastado: 0,
        categoriasMasCompradas: [],
        promedioGastoPorCompra: 0,
        comprasPorMes: {}
    });
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        brand: '',
        category: '',
        minPrice: '',
        maxPrice: ''
    });
    const [productsComparison, setProductsComparison] = useState({});
    const [selectedProduct, setSelectedProduct] = useState('');
    const [uniqueCategories, setUniqueCategories] = useState([]);
    const [uniqueBrands, setUniqueBrands] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/");
            } else {
                setUser(currentUser);
                await cargarListasCompras(currentUser.uid);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (listaCompras.length > 0) {
            generarReporteResumen();
            extractAllProducts();
        }
    }, [listaCompras]);

    useEffect(() => {
        applyFilters();
    }, [filters, allProducts]);

    useEffect(() => {
        if (selectedProduct) {
            generateProductComparison(selectedProduct);
        }
    }, [selectedProduct, allProducts]);

    const cargarListasCompras = async (userId) => {
        try {
            const q = query(collection(db, "listas"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            
            const compras = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setListaCompras(compras);
        } catch (error) {
            console.error("Error cargando listas de compras:", error);
        }
    };

    const generarReporteResumen = () => {
        // Calcular total gastado
        const totalGastado = listaCompras.reduce((total, lista) => total + (lista.total || 0), 0);

        // Recopilar todas las categorías
        const todasCategorias = listaCompras.flatMap(lista => 
            lista.products ? lista.products.map(producto => producto.category) : []
        );

        // Contar categorías más compradas
        const contadorCategorias = todasCategorias.reduce((contador, categoria) => {
            contador[categoria] = (contador[categoria] || 0) + 1;
            return contador;
        }, {});

        const categoriasMasCompradas = Object.entries(contadorCategorias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([categoria, cantidad]) => ({ categoria, cantidad }));

        // Calcular promedio de gasto por compra
        const promedioGastoPorCompra = listaCompras.length > 0 ? totalGastado / listaCompras.length : 0;

        // Calcular gastos por mes
        const comprasPorMes = listaCompras.reduce((gastosMes, lista) => {
            if (lista.createdAt) {
                const fecha = lista.createdAt.toDate ? lista.createdAt.toDate() : new Date(lista.createdAt);
                const mesAño = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
                
                gastosMes[mesAño] = (gastosMes[mesAño] || 0) + (lista.total || 0);
            }
            return gastosMes;
        }, {});

        setReporteResumen({
            totalGastado,
            categoriasMasCompradas,
            promedioGastoPorCompra,
            comprasPorMes
        });
    };

    // Extraer todos los productos y preparar para filtrado
    const extractAllProducts = () => {
        const products = [];
        const categories = new Set();
        const brands = new Set();
        
        listaCompras.forEach(lista => {
            if (lista.products && lista.products.length > 0) {
                lista.products.forEach(producto => {
                    const date = lista.createdAt ? 
                        (lista.createdAt.toDate ? lista.createdAt.toDate() : new Date(lista.createdAt)) : 
                        new Date();
                    
                    const mesAño = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    
                    products.push({
                        ...producto,
                        purchaseDate: date,
                        monthYear: mesAño,
                        listId: lista.id,
                        store: lista.store
                    });
                    
                    if (producto.category) categories.add(producto.category);
                    if (producto.brand) brands.add(producto.brand);
                });
            }
        });
        
        setAllProducts(products);
        setFilteredProducts(products);
        setUniqueCategories([...categories]);
        setUniqueBrands([...brands]);
    };

    // Aplicar filtros a los productos
    const applyFilters = () => {
        const filtered = allProducts.filter(product => {
            // Filtrar por nombre
            if (filters.name && !product.name?.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            
            // Filtrar por marca
            if (filters.brand && product.brand?.toLowerCase() !== filters.brand.toLowerCase()) {
                return false;
            }
            
            // Filtrar por categoría
            if (filters.category && product.category !== filters.category) {
                return false;
            }
            
            // Filtrar por precio mínimo
            if (filters.minPrice && product.price < parseFloat(filters.minPrice)) {
                return false;
            }
            
            // Filtrar por precio máximo
            if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) {
                return false;
            }
            
            // El producto pasó todos los filtros
            return true;
        });
        
        setFilteredProducts(filtered);
    };

    // Manejar cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            name: '',
            brand: '',
            category: '',
            minPrice: '',
            maxPrice: ''
        });
    };

    // Generar comparación de precios por mes para un producto
    const generateProductComparison = (productName) => {
        const pricesByMonth = {};
        
        allProducts.forEach(product => {
            if (product.name === productName) {
                if (!pricesByMonth[product.monthYear]) {
                    pricesByMonth[product.monthYear] = [];
                }
                pricesByMonth[product.monthYear].push(product.price);
            }
        });
        
        // Calcular precio promedio por mes
        const averagePriceByMonth = {};
        for (const month in pricesByMonth) {
            const prices = pricesByMonth[month];
            const sum = prices.reduce((total, price) => total + price, 0);
            averagePriceByMonth[month] = sum / prices.length;
        }
        
        setProductsComparison(averagePriceByMonth);
    };

    // Cambiar el estado de un producto (activar/desactivar)
    const toggleProductStatus = async (productId, listId, newStatus) => {
        try {
            // Localizar la lista que contiene el producto
            const listaRef = doc(db, "listas", listId);
            const listaActual = listaCompras.find(lista => lista.id === listId);
            
            if (listaActual && listaActual.products) {
                // Actualizar el estado del producto
                const productosActualizados = listaActual.products.map(p => 
                    p.id === productId ? { ...p, active: newStatus } : p
                );
                
                // Actualizar en Firestore
                await updateDoc(listaRef, {
                    products: productosActualizados
                });
                
                // Actualizar el estado local
                const comprasActualizadas = listaCompras.map(lista => 
                    lista.id === listId 
                        ? { ...lista, products: productosActualizados } 
                        : lista
                );
                
                setListaCompras(comprasActualizadas);
                
                // Actualizar productos filtrados
                extractAllProducts();
            }
        } catch (error) {
            console.error("Error al cambiar el estado del producto:", error);
        }
    };

    // Activar un producto
    const activateProduct = async (productId, listId) => {
        await toggleProductStatus(productId, listId, true);
    };

    // Desactivar un producto
    const deactivateProduct = async (productId, listId) => {
        await toggleProductStatus(productId, listId, false);
    };

    // Eliminar un producto
    const deleteProduct = async (productId, listId) => {
        try {
            // Localizar la lista que contiene el producto
            const listaRef = doc(db, "listas", listId);
            const listaActual = listaCompras.find(lista => lista.id === listId);
            
            if (listaActual && listaActual.products) {
                // Filtrar el producto a eliminar
                const productosActualizados = listaActual.products.filter(p => p.id !== productId);
                
                // Recalcular el total de la lista
                const nuevoTotal = productosActualizados.reduce(
                    (sum, product) => sum + (product.price || 0), 0
                );
                
                // Actualizar en Firestore
                await updateDoc(listaRef, {
                    products: productosActualizados,
                    total: nuevoTotal
                });
                
                // Actualizar el estado local
                const comprasActualizadas = listaCompras.map(lista => 
                    lista.id === listId 
                        ? { 
                            ...lista, 
                            products: productosActualizados,
                            total: nuevoTotal
                        } 
                        : lista
                );
                
                setListaCompras(comprasActualizadas);
                
                // Actualizar productos filtrados
                extractAllProducts();
            }
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
        }
    };

    // Obtener lista de productos únicos para la comparación
    const getUniqueProductNames = () => {
        const names = new Set(allProducts.map(product => product.name));
        return [...names];
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Reportes de Compras</h1>
                    {user && (
                        <p className="text-gray-600 text-sm">
                            Bienvenido, <span className="font-semibold">{user.email}</span>
                        </p>
                    )}
                </div>

                {/* Economic Summary */}
                <section className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Económico</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-gray-600">Total Gastado</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${reporteResumen.totalGastado.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-gray-600">Promedio por Compra</p>
                            <p className="text-2xl font-bold text-blue-600">
                                ${reporteResumen.promedioGastoPorCompra.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Expenses by Month */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Gastos por Mes</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 text-left text-gray-600">Mes/Año</th>
                                    <th className="p-4 text-right text-gray-600">Total Gastado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(reporteResumen.comprasPorMes).length > 0 ? (
                                    Object.entries(reporteResumen.comprasPorMes)
                                        .sort((a, b) => {
                                            const [monthA, yearA] = a[0].split('/');
                                            const [monthB, yearB] = b[0].split('/');
                                            return yearA === yearB ? monthA - monthB : yearA - yearB;
                                        })
                                        .map(([mesAño, total]) => (
                                            <tr 
                                                key={mesAño} 
                                                className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="p-4 text-gray-800">{mesAño}</td>
                                                <td className="p-4 text-right font-semibold text-green-600">
                                                    ${total.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-gray-500">
                                            No hay gastos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top 3 Categories */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Top 3 Categorías más Compradas
                    </h2>
                    {reporteResumen.categoriasMasCompradas.length > 0 ? (
                        <ul className="bg-white shadow rounded-lg divide-y divide-gray-200">
                            {reporteResumen.categoriasMasCompradas.map((item, index) => (
                                <li 
                                    key={index} 
                                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium">{item.categoria}</span>
                                    <span className="text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                                        {item.cantidad} compras
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 bg-white shadow rounded-lg p-4">
                            No hay categorías para mostrar
                        </p>
                    )}
                </section>

                {/* Product Filters */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrar Productos</h2>
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Nombre del Producto</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={filters.name}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre..."
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Marca</label>
                                <select
                                    name="brand"
                                    value={filters.brand}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todas las marcas</option>
                                    {uniqueBrands.map((brand, index) => (
                                        <option key={index} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Categoría</label>
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todas las categorías</option>
                                    {uniqueCategories.map((category, index) => (
                                        <option key={index} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Precio Mínimo</label>
                                <input
                                    type="number"
                                    name="minPrice"
                                    value={filters.minPrice}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Precio Máximo</label>
                                <input
                                    type="number"
                                    name="maxPrice"
                                    value={filters.maxPrice}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="100.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Product Listing with Activation/Deactivation */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Productos ({filteredProducts.length})
                    </h2>
                    {filteredProducts.length > 0 ? (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-left text-gray-600">Nombre</th>
                                        <th className="p-3 text-left text-gray-600">Categoría</th>
                                        <th className="p-3 text-left text-gray-600">Marca</th>
                                        <th className="p-3 text-right text-gray-600">Precio</th>
                                        <th className="p-3 text-center text-gray-600">Fecha</th>
                                        <th className="p-3 text-center text-gray-600">Tienda</th>
                                        <th className="p-3 text-center text-gray-600">Estado</th>
                                        <th className="p-3 text-center text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr 
                                            key={index} 
                                            className={`border-b hover:bg-gray-50 transition-colors ${product.active === false ? 'opacity-50' : ''}`}
                                        >
                                            <td className="p-3">{product.name}</td>
                                            <td className="p-3">{product.category}</td>
                                            <td className="p-3">{product.brand || 'N/A'}</td>
                                            <td className="p-3 text-right font-medium">${product.price.toFixed(2)}</td>
                                            <td className="p-3 text-center">{product.purchaseDate.toLocaleDateString()}</td>
                                            <td className="p-3 text-center">{product.store || 'N/A'}</td>
                                            <td className="p-3 text-center">
                                                {product.active === false ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                                                        Desactivado
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">
                                                        Activo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {product.active !== false ? (
                                                    <button
                                                        onClick={() => deactivateProduct(product.id, product.listId)}
                                                        className="text-red-500 hover:text-red-700 mx-1 px-2 py-1 rounded text-sm"
                                                        title="Desactivar Producto"
                                                    >
                                                        Desactivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => activateProduct(product.id, product.listId)}
                                                        className="text-green-500 hover:text-green-700 mx-1 px-2 py-1 rounded text-sm"
                                                        title="Activar Producto"
                                                    >
                                                        Activar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 bg-white shadow rounded-lg p-4 text-center">
                            No hay productos que coincidan con los filtros
                        </p>
                    )}
                </section>

                {/* Price Comparison */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Comparación de Precios por Mes
                    </h2>
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Seleccione un Producto</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Seleccione un producto</option>
                                {getUniqueProductNames().map((name, index) => (
                                    <option key={index} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedProduct && Object.keys(productsComparison).length > 0 ? (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-3">
                                    Precios de "{selectedProduct}" por Mes
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left py-2">Mes/Año</th>
                                                <th className="text-right py-2">Precio Promedio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(productsComparison)
                                                .sort((a, b) => {
                                                    const [monthA, yearA] = a[0].split('/');
                                                    const [monthB, yearB] = b[0].split('/');
                                                    return yearA === yearB ? monthA - monthB : yearA - yearB;
                                                })
                                                .map(([month, price]) => (
                                                    <tr key={month} className="border-t">
                                                        <td className="py-3">{month}</td>
                                                        <td className="py-3 text-right font-medium">
                                                            ${price.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : selectedProduct ? (
                            <p className="text-gray-500 mt-4">No hay datos suficientes para comparar este producto</p>
                        ) : (
                            <p className="text-gray-500 mt-4">Seleccione un producto para ver la comparación</p>
                        )}
                    </div>
                </section>

                {/* Purchase History */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Historial de Compras</h2>
                    {listaCompras.length > 0 ? (
                        <div className="space-y-4">
                            {listaCompras.map((lista) => (
                                <div 
                                    key={lista.id} 
                                    className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {lista.store || 'Sin nombre'} 
                                            <span className="text-gray-500 text-sm ml-2">
                                                {lista.createdAt ? new Date(lista.createdAt.toDate()).toLocaleDateString() : 'Fecha no disponible'}
                                            </span>
                                        </h3>
                                        <p className="text-green-600 font-bold">
                                            Total: ${(lista.total || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    {lista.products && lista.products.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {lista.products.map((producto, idx) => (
                                                <li 
                                                    key={idx} 
                                                    className={`py-2 flex justify-between items-center ${producto.active === false ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="font-medium">{producto.name}</span>
                                                        <span className="text-gray-500 ml-2">{producto.category}</span>
                                                        {producto.active === false ? (
                                                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                                Desactivado
                                                            </span>
                                                        ) : (
                                                            <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                                                Activo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-blue-600 font-semibold mr-3">
                                                            ${producto.price.toFixed(2)}
                                                        </span>
                                                        {producto.active === false ? (
                                                            <button
                                                                onClick={() => activateProduct(producto.id, lista.id)}
                                                                className="text-green-500 hover:text-green-700 text-sm"
                                                                title="Activar Producto"
                                                            >
                                                                Activar
                                                            </button>
                                                        ) : (
                                                            <button
                                                            onClick={() => deactivateProduct(producto.id, lista.id)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                            title="Desactivar Producto"
                                                        >
                                                            Desactivar
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">No hay productos en esta lista</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 bg-white shadow rounded-lg p-4 text-center">
                        No hay compras registradas
                    </p>
                )}
            </section>

            {/* Navigation Button */}
            <div className="flex justify-center mt-8">
                <button 
                    onClick={() => navigate("/lista")}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                >
                    Volver a Lista de Compras
                </button>
            </div>
        </div>
    </div>
);
};

export default Reportes;
