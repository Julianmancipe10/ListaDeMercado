import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import Reportes from "../Reportes/Reportes"
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useRef } from "react";

export const FormatMarket = () => {
    const [storeName, setStoreName] = useState('');
    const [nameProduct, setNameProduct] = useState('');
    const [priceProduct, setPriceProduct] = useState(0);
    const [dateProduct, setDateProduct] = useState('');
    const [weightProduct, setWeightProduct] = useState(0);
    const [categoryProduct, setCategoryProduct] = useState('');
    const [listProduct, setListProduct] = useState([]);
    const [total, setTotal] = useState(0);
    const [savedLists, setSavedLists] = useState([]);
    const [user, setUser] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const navigate = useNavigate();

    // Product Categories
    const productCategories = [
        'Frutas y Verduras', 
        'Carnes', 
        'Lácteos', 
        'Granos', 
        'Limpieza', 
        'Hogar', 
        'Otros'
    ];

    const hasFetchedData = useRef(false);
    
    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate("/"); 
            } else {
                setUser(currentUser);
                
                if (!hasFetchedData.current) {
                    hasFetchedData.current = true; 
    
                    const q = query(collection(db, "listas"), where("userId", "==", currentUser.uid));
                    const querySnapshot = await getDocs(q);
                    
                    const userLists = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
    
                    setSavedLists(userLists);
                }
            }
        });
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/")
        } catch(error) {
            console.error("Error al cerrar sesion", error);
        }
    }

    const handleAddProduct = (e) => {
        e.preventDefault();

        if (!storeName || !nameProduct || priceProduct <= 0 || !dateProduct || weightProduct <= 0 || !categoryProduct) {
            alert('Completa todos los campos correctamente.');
            return;
        }

        const newProduct = {
            store: storeName,
            name: nameProduct,
            price: parseFloat(priceProduct),
            date: dateProduct,
            weight: parseFloat(weightProduct),
            category: categoryProduct,
        };

        const updatedList = [...listProduct, newProduct];
        setListProduct(updatedList);
        sumPrice(updatedList);

        // Reset form
        setNameProduct('');
        setPriceProduct(0);
        setDateProduct('');
        setWeightProduct(0);
        setCategoryProduct('');
    };

    // New function to start editing a product
    const handleEditProduct = (index) => {
        const productToEdit = listProduct[index];
        setEditingProduct(index);
        
        // Set form values to the selected product
        setNameProduct(productToEdit.name);
        setPriceProduct(productToEdit.price);
        setDateProduct(productToEdit.date);
        setWeightProduct(productToEdit.weight);
        setCategoryProduct(productToEdit.category);
    };

    // Nueva función para seleccionar una lista guardada y cargarla en la lista de productos
const handleSelectSavedList = (list) => {
    setStoreName(list.store);
    setListProduct(list.products);
    setTotal(list.total);
};

// Nueva función para actualizar una lista guardada
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

            // Refrescar la lista de listas guardadas
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

// Nueva función para filtrar productos por categoría
const [filteredProducts, setFilteredProducts] = useState([]);

const handleFilterByCategory = (category) => {
    if (category === "") {
        setFilteredProducts([]);
        return;
    }
    const filtered = listProduct.filter(product => product.category === category);
    setFilteredProducts(filtered);
};

    // New function to update a product
    const handleUpdateProduct = () => {
        if (!nameProduct || priceProduct <= 0 || !dateProduct || weightProduct <= 0 || !categoryProduct) {
            alert('Completa todos los campos correctamente.');
            return;
        }

        const updatedList = [...listProduct];
        updatedList[editingProduct] = {
            store: storeName,
            name: nameProduct,
            price: parseFloat(priceProduct),
            date: dateProduct,
            weight: parseFloat(weightProduct),
            category: categoryProduct,
        };

        setListProduct(updatedList);
        sumPrice(updatedList);

        // Reset form and editing state
        setNameProduct('');
        setPriceProduct(0);
        setDateProduct('');
        setWeightProduct(0);
        setCategoryProduct('');
        setEditingProduct(null);
    };

    const sumPrice = (products) => {
        const totalSum = products.reduce((sum, product) => sum + parseFloat(product.price), 0);
        setTotal(totalSum);
    };

    const handleSaveList = async () => {
        if (listProduct.length === 0) {
            alert('No hay productos en la lista para guardar.');
            return;
        }
    
        try {
            await addDoc(collection(db, "listas"), {
                userId: user.uid,
                store: storeName,
                products: listProduct,
                total: total,
                createdAt: new Date()
            });
    
            setSavedLists([...savedLists, { store: storeName, products: listProduct, total }]);
            setListProduct([]);
            setTotal(0);
            alert("Lista guardada correctamente");
        } catch (error) {
            console.error("Error guardando la lista:", error);
            alert("Hubo un error al guardar la lista.");
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
            {/* Header Section */}
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
    
            {/* Product Form */}
            <form 
              onSubmit={handleAddProduct} 
              className="grid grid-cols-2 gap-4 bg-gray-100 p-6 rounded-lg mb-6"
            >
              <div className="col-span-2">
                <h2 className="text-xl font-semibold mb-4">
                  {editingProduct !== null ? 'Actualizar Producto' : 'Agregar Producto'}
                </h2>
              </div>
    
              {/* Form Inputs */}
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
                  <p className="text-sm font-medium text-gray-700 mb-1">Cantidad en Kg</p>
                  <input
                    value={weightProduct}
                    onChange={(e) => setWeightProduct(e.target.value)}
                    type="number"
                    placeholder="Peso en kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
    
              {/* Form Buttons */}
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
    
            {/* Product List */}
            <section className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Lista de Productos</h2>
              <ul className="divide-y divide-gray-200">
                {listProduct.map((product, index) => (
                  <li key={index} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">
                        {product.store} - {product.name}: 
                        <span className="font-semibold text-green-600 ml-2">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="ml-2 text-gray-500">
                          - {product.weight}kg - {product.date} - Categoría: {product.category}
                        </span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleEditProduct(index)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                    >
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
              <h2 className="text-xl font-bold text-right mt-4">Total: ${total.toFixed(2)}</h2>
            </section>
    
            {/* Saved Lists */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Listas Guardadas</h2>
              {savedLists.map((list, index) => (
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
                    {list.products.map((product, i) => (
                      <li key={i} className="py-2">
                        {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date} - Categoría: {product.category}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
    
            {/* Category Filter */}
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
                      {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date} - Categoría: {product.category}
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