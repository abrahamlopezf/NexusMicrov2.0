import { useState } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      // El backend devuelve la estructura { status: 'success', data: { user, token } }
      login(res.data.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex font-sans bg-[#F5F5F5] selection:bg-[#C9A14A] selection:text-white">
      {/* LADO IZQUIERDO (BRANDING) */}
      <div className="hidden md:flex w-1/2 bg-[#0A0A0A] text-white flex-col justify-center items-center p-10 relative overflow-hidden">
        {/* Destello elegante de lujo en el fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A14A] rounded-full blur-[140px] opacity-[0.15] pointer-events-none"></div>
        
        <h1 className="text-5xl font-bold tracking-wide mb-4">
          NexusMicro
        </h1>

        <p className="text-lg text-gray-300 text-center max-w-md">
          Sistema inteligente de gestión para{" "}
          <span className="text-[#C9A14A] font-semibold">
            Hekka Sastrería
          </span>
        </p>

        <div className="mt-10 border-t border-gray-800 w-40"></div>

        <p className="mt-6 text-sm text-[#E5C97B] font-medium tracking-widest uppercase">
          Precisión. Control. Elegancia.
        </p>
      </div>

      {/* LADO DERECHO (FORMULARIO) */}
      <div className="flex flex-1 justify-center items-center relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 md:p-14 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] m-4 relative group"
        >
          {/* Borde superior decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A14A] to-transparent opacity-50"></div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-[#0A0A0A] mb-3 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-gray-500 text-[15px]">Por favor, ingresa tus credenciales</p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 text-red-600 text-sm text-center p-4 rounded-xl flex items-center justify-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block mb-2.5 text-[15px] font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 focus:border-[#C9A14A] focus:bg-white transition-all duration-300 text-gray-800 text-lg placeholder-gray-400"
              required
            />
          </div>

          <div className="mb-10">
            <label className="block mb-2.5 text-[15px] font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 focus:border-[#C9A14A] focus:bg-white transition-all duration-300 text-gray-800 text-xl tracking-wider placeholder-gray-400 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C9A14A] transition-colors focus:outline-none p-2 rounded-lg hover:bg-gray-100"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] text-white py-4 rounded-xl hover:bg-black hover:shadow-lg hover:shadow-black/10 focus:ring-4 focus:ring-black/5 transition-all duration-300 font-medium text-[17px] flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verificando credenciales...
                </span>
              ) : (
                "Entrar al sistema"
              )}
            </button>
          </div>

          <p className="text-sm text-gray-400 text-center mt-10 font-medium">
            © NexusMicro <span className="mx-2 text-gray-300">|</span> Hekka Sastrería
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
