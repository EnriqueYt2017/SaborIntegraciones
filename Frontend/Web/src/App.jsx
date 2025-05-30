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
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios" element={<Servicios />} />
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