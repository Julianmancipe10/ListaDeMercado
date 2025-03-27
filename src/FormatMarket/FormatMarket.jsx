import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "./FomatMarket.css";
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
        <div className="contenedor-lista">
            <h1>Bienvenido, {user.email}</h1>
            <button className="btn-LogOut" onClick={handleLogout}>Cerrar sesión</button>
            <button onClick={() =>navigate("/reportes")}>📊 Ver Reportes</button>

            <form onSubmit={handleAddProduct} className="contenedor-central">
                <h2>{editingProduct !== null ? 'Actualizar Producto' : 'Agregar Producto'}</h2>

                <p>Nombre de la Tienda</p>
                <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    type="text"
                    placeholder="Nombre de la tienda"
                />

                <p>Nombre Producto</p>
                <input
                    value={nameProduct}
                    onChange={(e) => setNameProduct(e.target.value)}
                    type="text"
                    placeholder="Nombre del producto"
                />

                <p>Precio</p>
                <input
                    value={priceProduct}
                    onChange={(e) => setPriceProduct(e.target.value)}
                    type="number"
                    placeholder="Precio del producto"
                />

                <p>Fecha compra</p>
                <input
                    value={dateProduct}
                    onChange={(e) => setDateProduct(e.target.value)}
                    type="date"
                />

                <p>Cantidad en Kg</p>
                <input
                    value={weightProduct}
                    onChange={(e) => setWeightProduct(e.target.value)}
                    type="number"
                    placeholder="Peso en kg"
                />

                <p>Categoría</p>
                <select
                    value={categoryProduct}
                    onChange={(e) => setCategoryProduct(e.target.value)}
                >
                    <option value="">Selecciona una categoría</option>
                    {productCategories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                    ))}
                </select>

                {editingProduct !== null ? (
                    <button type="button" onClick={handleUpdateProduct}>Actualizar Producto</button>
                ) : (
                    <button type="submit">Agregar a la lista</button>
                )}
                <button type="button" onClick={handleSaveList}>Guardar lista</button>
            </form>

            <section>
                <h2>Lista de Productos</h2>
                <ul>
                    {listProduct.map((product, index) => (
                        <li key={index}>
                            <p>
                                {product.store} - {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date} - Categoría: {product.category}
                                <button onClick={() => handleEditProduct(index)}>Editar</button>
                            </p>
                        </li>
                    ))}
                </ul>
                <h2>Total: ${total.toFixed(2)}</h2>
            </section>

            <h2>Listas Guardadas</h2>
{savedLists.map((list, index) => (
    <div key={index} className="saved-list">
        <h3>{list.store} - Lista {index + 1} - Total: ${list.total.toFixed(2)}</h3>
        <button onClick={() => handleSelectSavedList(list)}>Seleccionar</button>
        <button onClick={handleUpdateList}>Actualizar Lista</button>
        <ul>
            {list.products.map((product, i) => (
                <li key={i}>
                    {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date} - Categoría: {product.category}
                </li>
            ))}
        </ul>
    </div>
))}
<p>Buscar por Categoría</p>
<select onChange={(e) => handleFilterByCategory(e.target.value)}>
    <option value="">Todas</option>
    {productCategories.map((category, index) => (
        <option key={index} value={category}>{category}</option>
    ))}
</select>

<h2>Productos Filtrados</h2>
<ul>
    {filteredProducts.length > 0 ? (
        filteredProducts.map((product, index) => (
            <li key={index}>
                {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date} - Categoría: {product.category}
            </li>
        ))
    ) : (
        <p>No hay productos en esta categoría.</p>
    )}
</ul>

        </div>
    );
};

export default FormatMarket;