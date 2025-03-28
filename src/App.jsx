import React from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";
import FormatMarket from "./FormatMarket/FormatMarket";
import { createBrowserRouter,RouterProvider} from "react-router-dom";
import InicioSesion from "./InicioSesion/InicioSesion";
import Home from "./Pages/Home";
import InicioSesion2 from "./InicioSesion2/InicioSesion2";
import Reportes from "./Reportes/Reportes";


function App() {
   
    const routes=createBrowserRouter([
      {
        path:"/",
        element:<Home></Home>
      },
      {
        path:"/lista",
        element:<FormatMarket></FormatMarket>
      },
      
      {
        path:"/inicioSesion",
        element:<InicioSesion></InicioSesion>
      },

      {
        path:"/registrer",
        element:<InicioSesion2></InicioSesion2>
      },
      {
        path:"/reportes",
        element:<Reportes></Reportes>
      }

    ])


  return (
    <RouterProvider router={routes}>
    </RouterProvider>
  
  );
}

export default App;



