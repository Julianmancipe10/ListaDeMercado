import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../Reportes/Reportes.css";

export const Reportes = () => {
    const [user, setUser] = useState(null);
    const [listaCompras, setListaCompras] = useState([]);
    const [reporteResumen, setReporteResumen] = useState({
        totalGastado: 0,
        categoriasMasCompradas: [],
        promedioGastoPorCompra: 0,
        comprasPorMes: {}
    });
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
        }
    }, [listaCompras]);


    

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
        const promedioGastoPorCompra = listaCompras.length > 0 
            ? totalGastado / listaCompras.length 
            : 0;

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

    return (
        <div className="contenedor-reportes">
            <h1>Reportes de Compras</h1>
            {user && <p>Bienvenido, {user.email}</p>}

            <section className="resumen-economico">
                <h2>Resumen Económico</h2>
                <div className="tarjeta-resumen">
                    <p>Total Gastado: ${reporteResumen.totalGastado.toFixed(2)}</p>
                    <p>Promedio por Compra: ${reporteResumen.promedioGastoPorCompra.toFixed(2)}</p>
                </div>
            </section>

            <section className="categorias-mas-compradas">
                <h2>Top 3 Categorías más Compradas</h2>
                {reporteResumen.categoriasMasCompradas.length > 0 ? (
                    <ul>
                        {reporteResumen.categoriasMasCompradas.map((item, index) => (
                            <li key={index}>
                                {item.categoria}: {item.cantidad} compras
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No hay categorías para mostrar</p>
                )}
            </section>

            <section className="gastos-por-mes">
                <h2>Gastos por Mes</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Mes/Año</th>
                            <th>Total Gastado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(reporteResumen.comprasPorMes).length > 0 ? (
                            Object.entries(reporteResumen.comprasPorMes).map(([mesAño, total]) => (
                                <tr key={mesAño}>
                                    <td>{mesAño}</td>
                                    <td>${total.toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2">No hay gastos registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="historial-compras">
                <h2>Historial de Compras</h2>
                {listaCompras.length > 0 ? (
                    listaCompras.map((lista, index) => (
                        <div key={lista.id} className="tarjeta-compra">
                            <h3>{lista.store || 'Sin nombre'} - {lista.createdAt ? new Date(lista.createdAt.toDate()).toLocaleDateString() : 'Fecha no disponible'}</h3>
                            <p>Total: ${(lista.total || 0).toFixed(2)}</p>
                            {lista.products && lista.products.length > 0 ? (
                                <ul>
                                    {lista.products.map((producto, idx) => (
                                        <li key={idx}>
                                            {producto.name} - ${producto.price.toFixed(2)} - {producto.category}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No hay productos en esta lista</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No hay compras registradas</p>
                )}
            </section>

            <div className="botones-navegacion">
                <button onClick={() => navigate("/lista")}>Volver a Lista de Compras</button>
            </div>
        </div>
    );
};

export default Reportes;