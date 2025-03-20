import { useState } from "react";
import "./FomatMarket.css";

export const FormatMarket = () => {
    const [storeName, setStoreName] = useState('');
    const [nameProduct, setNameProduct] = useState('');
    const [priceProduct, setPriceProduct] = useState(0);
    const [dateProduct, setDateProduct] = useState('');
    const [weightProduct, setWeightProduct] = useState(0);
    const [listProduct, setListProduct] = useState([]);
    const [total, setTotal] = useState(0);
    const [savedLists, setSavedLists] = useState([]);

    const handleAddProduct = (e) => {
        e.preventDefault();

        if (!storeName || !nameProduct || priceProduct <= 0 || !dateProduct || weightProduct <= 0) {
            alert('Completa todos los campos correctamente.');
            return;
        }

        const newProduct = {
            store: storeName,
            name: nameProduct,
            price: parseFloat(priceProduct),
            date: dateProduct,
            weight: parseFloat(weightProduct),
        };

        const updatedList = [...listProduct, newProduct];
        setListProduct(updatedList);
        sumPrice(updatedList);

        setNameProduct('');
        setPriceProduct(0);
        setDateProduct('');
        setWeightProduct(0);
    };

    const sumPrice = (products) => {
        const totalSum = products.reduce((sum, product) => sum + parseFloat(product.price), 0);
        setTotal(totalSum);
    };

    const handleSaveList = () => {
        if (listProduct.length === 0) {
            alert('No hay productos en la lista para guardar.');
            return;
        }

        setSavedLists([...savedLists, { store: storeName, products: listProduct, total }]);

        setListProduct([]);
        setTotal(0);
    };

    return (
        <div className="contenedor-lista">
            <form onSubmit={handleAddProduct} className="contenedor-central">
                <h2>Agregar producto</h2>
                
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

                <button type="submit">Agregar a la lista</button>
                <button type="button" onClick={handleSaveList}>Guardar lista</button>
            </form>

            <section>
                <h2>Lista de Productos</h2>
                <ul>
                    {listProduct.map((product, index) => (
                        <li key={index}>
                            <p>
                                {product.store} - {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date}
                            </p>
                        </li>
                    ))}
                </ul>
                <h2>Total: ${total.toFixed(2)}</h2>
            </section>

            <section>
                <h2>Listas Guardadas</h2>
                {savedLists.map((list, index) => (
                    <div key={index} className="saved-list">
                        <h3>{list.store} - Lista {index + 1} - Total: ${list.total.toFixed(2)}</h3>
                        <ul>
                            {list.products.map((product, i) => (
                                <li key={i}>
                                    {product.name}: ${product.price.toFixed(2)} - {product.weight}kg - {product.date}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default FormatMarket;
