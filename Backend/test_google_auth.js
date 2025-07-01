// Archivo de prueba para verificar la configuración de Google OAuth
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

console.log("✅ Express:", !!express);
console.log("✅ Session:", !!session);
console.log("✅ Passport:", !!passport);
console.log("✅ GoogleStrategy:", !!GoogleStrategy);

const app = express();

// Configuración básica
app.use(session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Serialización básica
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configurar estrategia de Google
passport.use(new GoogleStrategy({
  clientID: "355316018621-3lhs9of0a3cgl7osov8rjp2jc0gagj0v.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3001/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  console.log("🎯 Callback de Google ejecutado");
  console.log("📧 Email:", profile.emails?.[0]?.value);
  console.log("👤 Nombre:", profile.displayName);
  return done(null, {
    googleId: profile.id,
    nombre: profile.displayName,
    correo: profile.emails?.[0]?.value
  });
}));

// Rutas de prueba
app.get("/", (req, res) => {
  res.send(`
    <h1>Test Google OAuth</h1>
    <a href="/auth/google">Iniciar sesión con Google</a>
  `);
});

app.get("/auth/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("✅ Callback exitoso:", req.user);
    res.send(`
      <h1>¡Autenticación exitosa!</h1>
      <p>Usuario: ${req.user.nombre}</p>
      <p>Email: ${req.user.correo}</p>
    `);
  }
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba ejecutándose en http://localhost:${PORT}`);
  console.log(`🔗 Enlace de Google: http://localhost:${PORT}/auth/google`);
});
