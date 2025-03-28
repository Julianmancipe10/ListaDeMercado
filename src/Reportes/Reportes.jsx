import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
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
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">
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
                  Object.entries(reporteResumen.comprasPorMes).map(([mesAño, total]) => (
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
                          className="py-2 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{producto.name}</span>
                            <span className="text-gray-500 ml-2">{producto.category}</span>
                          </div>
                          <span className="text-blue-600 font-semibold">
                            ${producto.price.toFixed(2)}
                          </span>
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