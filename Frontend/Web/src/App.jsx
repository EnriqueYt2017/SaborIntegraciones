import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home/Home";
import Login from "./Components/Login-Register/login";
import Register from "./Components/Login-Register/Register";
import Perfil from "./Components/Home/Perfil";
import Vermas from "./Components/Home/Vermas";
import Contactenos from "./Components/Home/Contactenos";
import Servicios from "./Components/Home/Servicios";
import Productos from "./Components/Productos/Productos";
import Inicio from "./Components/Dashboard/Inicio";
import Carrito from "./Components/Carrito/carrito";
import Return from "./Components/Carrito/Return";
import Seguimiento from "./Components/Pedidos/Seguimiento";
import Reserva from "./Components/Productos/Reserva";
import VerDetalleProducto from "./Components/Productos/VerDetalleProducto";
import GoogleSuccess from "./Components/Login-Register/google-success";
//Planes
import Entrenamiento from "./Components/Planes/Entrenamiento"
import Nutricion from "./Components/Planes/Nutricion";
// FOROS
import Foro_entrenamiento from "./Components/Planes/Foro_entrenamiento";

const App = () => {


    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/vermas" element={<Vermas />} />
                <Route path="/contactenos" element={<Contactenos />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/return" element={<Return />} />
                <Route path="/seguimiento" element={<Seguimiento />} />
                <Route path="/productos/:id" element={<VerDetalleProducto />} />
                {/* 🔹 Rutas de productos y servicios */}
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/reserva" element={<Reserva />} />
                {/* 🔹 Dashboard */}
                <Route path="/dashboard/inicio" element={<Inicio />} />
                {/* 🔹 Planes */}
                <Route path="/planes/entrenamiento" element={<Entrenamiento />} />
                <Route path="/planes/nutricion" element={<Nutricion />} />
                <Route path="/planes/foros" element={<Foro_entrenamiento />} />

                {/* 🔹 Rutas de administración */}

                {/* 🔹 Rutas protegidas */}
                <Route path="/google-success" element={<GoogleSuccess />} />

                {/* 🔹 Rutas de error */}
                {/* 🔹 Página no encontrada */}
                <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
            </Routes>
        </Router>
    );
};

export default App;