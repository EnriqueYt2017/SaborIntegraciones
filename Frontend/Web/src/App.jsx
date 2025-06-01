import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home/Home";
import Login from "./Components/Login-Register/login";
import Register from "./Components/Login-Register/Register";
import Perfil from "./Components/Home/Perfil";
import Contactenos from "./Components/Home/Contactenos";
import Servicios from "./Components/Home/Servicios";
import Productos from "./Components/Productos/Productos";
import Inicio from "./Components/Dashboard/Inicio";
import Carrito from "./Components/Carrito/carrito";
import Return from "./Components/Carrito/Return";
import Seguimiento from "./Components/Pedidos/Seguimiento";
import Reserva from "./Components/Productos/Reserva";

const App = () => {


    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/contactenos" element={<Contactenos />} />
                <Route path="/carrito" element={<Carrito/>} />
                <Route path="/return" element={<Return />} />
                <Route path="/seguimiento" element={<Seguimiento />} />
                {/* 🔹 Rutas de productos y servicios */}
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/reserva" element={<Reserva />} />
                {/* 🔹 Dashboard */}
                <Route path="/dashboard/inicio" element={<Inicio />} />
                
                {/* 🔹 Rutas protegidas */}
                {/* 🔹 Página no encontrada */}
                <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
            </Routes>
        </Router>
    );
};

export default App;