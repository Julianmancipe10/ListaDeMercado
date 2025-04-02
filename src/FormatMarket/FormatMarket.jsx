import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import Reportes from "../Reportes/Reportes"
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRef } from "react";

// Componente principal para gestionar listas de compras
export const FormatMarket = () => {
    // Estados para los datos del formulario y la aplicación
    const [storeName, setStoreName] = useState(''); // Nombre de la tienda
    const [nameProduct, setNameProduct] = useState(''); // Nombre del producto
    const [priceProduct, setPriceProduct] = useState(0); // Precio del producto
    const [dateProduct, setDateProduct] = useState(''); // Fecha de compra
    const [weightProduct, setWeightProduct] = useState(0); // Peso del producto en kg
    const [categoryProduct, setCategoryProduct] = useState(''); // Categoría del producto
    const [listProduct, setListProduct] = useState([]); // Lista actual de productos
    const [total, setTotal] = useState(0); // Total de la lista actual
    const [savedLists, setSavedLists] = useState([]); // Listas guardadas por el usuario
    const [user, setUser] = useState(null); // Usuario autenticado actual
    const [editingProduct, setEditingProduct] = useState(null); // Índice del producto en edición
    const navigate = useNavigate(); // Hook para navegación
    const [weightUnit, setWeightUnit] = useState('kg');

    // Categorías de productos disponibles
    const productCategories = [
        'Frutas y Verduras', 
        'Carnes', 
        'Lácteos', 
        'Granos', 
        'Limpieza', 
        'Hogar', 
        'Otros'
    ];

    // Referencia para controlar que los datos se cargan solo una vez
    const hasFetchedData = useRef(false);
    
    // Efecto para verificar la autenticación y cargar datos del usuario
    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/"); // Redirecciona al inicio si no hay usuario autenticado
            } else {
                setUser(currentUser);
                
                // Carga las listas guardadas solo una vez
                if (!hasFetchedData.current) {
                    hasFetchedData.current = true; 
    
                    // Consulta las listas del usuario actual en Firestore
                    const q = query(collection(db, "listas"), where("userId", "==", currentUser.uid));
                    const querySnapshot = await getDocs(q);
                    
                    // Transforma los datos de Firestore
                    const userLists = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
    
                    setSavedLists(userLists);
                }
            }
        });
    }, [navigate]);

    // Función para cerrar sesión
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/")
        } catch(error) {
            console.error("Error al cerrar sesion", error);
        }
    }

    // Función para agregar un nuevo producto a la lista
    const handleAddProduct = (e) => {
        e.preventDefault();

        // Validación de datos del formulario
        if (!storeName || !nameProduct || priceProduct <= 0 || !dateProduct || weightProduct <= 0 || !categoryProduct) {
            alert('Completa todos los campos correctamente.');
            return;
        }

        // Crea el objeto del nuevo producto
        const newProduct = {
            store: storeName,
            name: nameProduct,
            price: parseFloat(priceProduct),
            date: dateProduct,
            weight: parseFloat(weightProduct),
            weightUnit: weightUnit,
            category: categoryProduct,
            active: true, // Por defecto el producto está activo
        };

        // Actualiza la lista de productos
        const updatedList = [...listProduct, newProduct];
        setListProduct(updatedList);
        sumPrice(updatedList);

        // Limpia el formulario
        setNameProduct('');
        setPriceProduct(0);
        setDateProduct('');
        setWeightProduct(0);
        setCategoryProduct('');
    };

    // Función para iniciar la edición de un producto
    const handleEditProduct = (index) => {
        const productToEdit = listProduct[index];
        setEditingProduct(index);
        
        // Establece los valores del formulario con los datos del producto seleccionado
        setNameProduct(productToEdit.name);
        setPriceProduct(productToEdit.price);
        setDateProduct(productToEdit.date);
        setWeightProduct(productToEdit.weight);
        setWeightUnit(productToEdit.weightUnit || 'kg'); 
        setCategoryProduct(productToEdit.category);
    };

    // Función para seleccionar una lista guardada y cargarla en la lista de productos
    const handleSelectSavedList = (list) => {
        setStoreName(list.store);
        setListProduct(list.products);
        sumPrice(list.products); // Recalcular el total basado en productos activos
    };

    // Función para actualizar una lista guardada en Firestore
    const handleUpdateList = async () => {
        if (listProduct.length === 0) {
            alert('No hay productos en la lista para actualizar.');
            return;
        }

        try {
            const listToUpdate = savedLists.find(list => list.store === storeName);
            
            if (listToUpdate) {
                await updateDoc(doc(db, "listas", listToUpdate.id), {
                    products: listProduct,
                    total: total,
                    updatedAt: new Date(),
                });

                alert("Lista actualizada correctamente");

                // Actualiza la lista local de listas guardadas
                const updatedLists = savedLists.map(list => 
                    list.id === listToUpdate.id ? { ...list, products: listProduct, total } : list
                );
                setSavedLists(updatedLists);
            }
        } catch (error) {
            console.error("Error actualizando la lista:", error);
            alert("Hubo un error al actualizar la lista.");
        }
    };

    // Función para filtrar productos por categoría
    const [filteredProducts, setFilteredProducts] = useState([]);

    const handleFilterByCategory = (category) => {
        if (category === "") {
            setFilteredProducts([]);
            return;
        }
        // Solo muestra productos activos en la categoría seleccionada
        const filtered = listProduct.filter(product => 
            product.category === category && product.active !== false
        );
        setFilteredProducts(filtered);
    };

    // Función para actualizar un producto existente
    const handleUpdateProduct = () => {
        // Validación de datos del formulario
        if (!nameProduct || priceProduct <= 0 || !dateProduct || weightProduct <= 0 || !categoryProduct) {
            alert('Completa todos los campos correctamente.');
            return;
        }

        // Actualiza el producto en la lista
        const updatedList = [...listProduct];
        updatedList[editingProduct] = {
            store: storeName,
            name: nameProduct,
            price: parseFloat(priceProduct),
            date: dateProduct,
            weight: parseFloat(weightProduct),
            weightUnit: weightUnit,
            category: categoryProduct,
            // Mantener el estado activo/inactivo del producto original
            active: updatedList[editingProduct].active
        };

        setListProduct(updatedList);
        sumPrice(updatedList);

        // Limpia el formulario y el estado de edición
        setNameProduct('');
        setPriceProduct(0);
        setDateProduct('');
        setWeightProduct(0);
        setCategoryProduct('');
        setEditingProduct(null);
    };

    // Función para calcular el precio total de la lista de productos
    const sumPrice = (products) => {
        // Solo suma los productos activos
        const totalSum = products
            .filter(product => product.active !== false)
            .reduce((sum, product) => sum + parseFloat(product.price), 0);
        setTotal(totalSum);
    };

    // Función para guardar la lista actual en Firestore
    const handleSaveList = async () => {
        if (listProduct.length === 0) {
            alert('No hay productos en la lista para guardar.');
            return;
        }
    
        try {
            // Añade la lista a Firestore
            await addDoc(collection(db, "listas"), {
                userId: user.uid,
                store: storeName,
                products: listProduct,
                total: total,
                createdAt: new Date()
            });
    
            // Actualiza el estado local
            setSavedLists([...savedLists, { store: storeName, products: listProduct, total }]);
            setListProduct([]);
            setTotal(0);
            alert("Lista guardada correctamente");
        } catch (error) {
            console.error("Error guardando la lista:", error);
            alert("Hubo un error al guardar la lista.");
        }
    };

    // Función para activar/desactivar un producto
    const toggleProductStatus = (index, newStatus) => {
        const updatedList = [...listProduct];
        updatedList[index] = { ...updatedList[index], active: newStatus };
        setListProduct(updatedList);
        sumPrice(updatedList); // Recalcular el total
    };

    // No renderiza nada si no hay usuario autenticado
    if (!user) {
        return null;
    }

    // Filtrar productos activos para mostrar
    const activeProducts = listProduct.filter(product => product.active !== false);

    // Renderizado de la interfaz de usuario
    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
            {/* Sección de cabecera con información del usuario y botones de navegación */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user.email}</h1>
              <div className="space-x-3">
                <button 
                  className="btn-LogOut bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
                <button 
                  onClick={() => navigate("/reportes")}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  📊 Ver Reportes
                </button>
              </div>
            </div>
    
            {/* Formulario para agregar o editar productos */}
            <form 
              onSubmit={handleAddProduct} 
              className="grid grid-cols-2 gap-4 bg-gray-100 p-6 rounded-lg mb-6"
            >
              <div className="col-span-2">
                <h2 className="text-xl font-semibold mb-4">
                  {editingProduct !== null ? 'Actualizar Producto' : 'Agregar Producto'}
                </h2>
              </div>
    
              {/* Campos de entrada del formulario - Columna izquierda */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nombre de la Tienda</p>
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    type="text"
                    placeholder="Nombre de la tienda"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
    
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nombre Producto</p>
                  <input
                    value={nameProduct}
                    onChange={(e) => setNameProduct(e.target.value)}
                    type="text"
                    placeholder="Nombre del producto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
    
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Precio</p>
                  <input
                    value={priceProduct}
                    onChange={(e) => setPriceProduct(e.target.value)}
                    type="number"
                    placeholder="Precio del producto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
    
              {/* Campos de entrada del formulario - Columna derecha */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Fecha compra</p>
                  <input
                    value={dateProduct}
                    onChange={(e) => setDateProduct(e.target.value)}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
    
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Cantidad y Unidad</p>
                  <div className="flex space-x-2">
                    <input
                      value={weightProduct}
                      onChange={(e) => setWeightProduct(e.target.value)}
                      type="number"
                      placeholder="Cantidad"
                      className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kg">Kg</option>
                      <option value="gr">Gr</option>
                      <option value="unidad">Unidad</option>
                    </select>
                  </div>
                </div>
    
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Categoría</p>
                  <select
                    value={categoryProduct}
                    onChange={(e) => setCategoryProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una categoría</option>
                    {productCategories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
    
              {/* Botones del formulario */}
              <div className="col-span-2 flex space-x-4 mt-4">
                {editingProduct !== null ? (
                  <button 
                    type="button" 
                    onClick={handleUpdateProduct}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Actualizar Producto
                  </button>
                ) : (
                  <button 
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Agregar a la lista
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleSaveList}
                  className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition-colors"
                >
                  Guardar lista
                </button>
              </div>
            </form>
    
            {/* Sección de la lista de productos actual - SOLO MUESTRA PRODUCTOS ACTIVOS */}
            <section className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Lista de Productos ({activeProducts.length})</h2>
              {activeProducts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {activeProducts.map((product, index) => {
                    // Encuentra el índice real en la lista completa para editar correctamente
                    const originalIndex = listProduct.findIndex(p => 
                      p.name === product.name && 
                      p.date === product.date && 
                      p.price === product.price
                    );
                    
                    return (
                      <li key={index} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="text-gray-800">
                            {product.store} - {product.name}: 
                            <span className="font-semibold text-green-600 ml-2">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="ml-2 text-gray-500">
                              - {product.weight}{product.weightUnit} - {product.date} - Categoría: {product.category}
                            </span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditProduct(originalIndex)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => toggleProductStatus(originalIndex, false)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                          >
                            Desactivar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay productos activos en la lista</p>
              )}
              <h2 className="text-xl font-bold text-right mt-4">Total: ${total.toFixed(2)}</h2>
            </section>
    
            {/* Sección de listas guardadas */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Listas Guardadas</h2>
              {savedLists.map((list, index) => {
                // Filtrar para mostrar solo productos activos en listas guardadas
                const activeListProducts = list.products ? 
                  list.products.filter(product => product.active !== false) : [];
                
                return (
                  <div key={index} className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">
                        {list.store} - Lista {index + 1} - Total: ${list.total.toFixed(2)}
                      </h3>
                      <div className="space-x-2">
                        <button 
                          onClick={() => handleSelectSavedList(list)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          Seleccionar
                        </button>
                        <button 
                          onClick={handleUpdateList}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                          Actualizar Lista
                        </button>
                      </div>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {activeListProducts.map((product, i) => (
                        <li key={i} className="py-2">
                          {product.name}: ${product.price.toFixed(2)} - {product.weight}{product.weightUnit || 'kg'} - {product.date} - Categoría: {product.category}
                        </li>
                      ))}
                    </ul>
                    {activeListProducts.length === 0 && (
                      <p className="text-gray-500 text-center py-2">No hay productos activos en esta lista</p>
                    )}
                  </div>
                );
              })}
              {savedLists.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay listas guardadas</p>
              )}
            </div>
    
            {/* Sección de filtrado por categoría */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Buscar por Categoría</p>
                <select 
                  onChange={(e) => handleFilterByCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {productCategories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
    
              <h2 className="text-xl font-semibold mb-4">Productos Filtrados</h2>
              <ul className="divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <li key={index} className="py-2">
                      {product.name}: ${product.price.toFixed(2)} - {product.weight}{product.weightUnit || 'kg'} - {product.date} - Categoría: {product.category}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No hay productos en esta categoría.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      );
};

export default FormatMarket;