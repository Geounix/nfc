/**
 * Cerca NFC - Landing Page
 */

import { motion } from "motion/react";
import { 
  ShoppingCart, 
  UserCheck, 
  Tag, 
  Undo2, 
  Lock, 
  Smartphone, 
  PawPrint, 
  LayoutGrid,
  Menu,
  CheckCircle2,
  History,
  Zap,
  ShieldCheck,
  Radar,
  ChevronRight,
  Luggage,
  Download
} from "lucide-react";

// Usamos la imagen mascotas.png del proyecto NFC (en la carpeta public)
const HERO_IMAGE = "/mascotas.png";

const Navbar = () => (
  <nav className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto w-full bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
    <a href="/" className="flex items-center gap-2">
      <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
        <PawPrint className="text-white w-5 h-5" />
      </div>
      <span className="text-2xl font-bold text-indigo-900 tracking-tight font-display">Cerca</span>
    </a>
    
    <div className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-gray-700">
      <a href="#como-funciona" className="hover:text-indigo-600 transition-colors">¿Cómo funciona?</a>
      <a href="#usos" className="hover:text-indigo-600 transition-colors">Equipaje & Mascotas</a>
      <div className="flex items-center gap-3 ml-4">
        <a href="../login.html" className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          Iniciar sesión
        </a>
        <a href="../register.html" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]">
          Comenzar gratis
        </a>
      </div>
    </div>
    
    <button className="md:hidden p-2 text-gray-600">
      <Menu />
    </button>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-indigo-50/30 to-orange-50/20">
    {/* Warm, sentimental gradient background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50/40 via-white to-indigo-50/30 -z-10"></div>
    
    {/* Decorative soft circles for a more organic feel */}
    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-100/30 blur-[120px] rounded-full -z-10 animate-pulse"></div>
    <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-100/20 blur-[100px] rounded-full -z-10"></div>

    <div className="max-w-7xl mx-auto px-6 md:px-8 w-full grid lg:grid-cols-2 gap-12 items-center py-16">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center lg:text-left order-2 lg:order-1"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-8 text-indigo-600 text-xs font-bold uppercase tracking-widest shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          Protección con corazón
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tight font-display">
          Vuelve a casa,<br />
          <span className="text-indigo-600 relative inline-block">
            vuelve con ellos.
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-200/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 10 Q 50 0 100 10" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
          Sabemos lo mucho que significan para ti. Por eso creamos una forma <span className="text-slate-900 font-bold italic">invisible pero poderosa</span> de mantenerlos siempre cerca, pase lo que pase.
        </p>
        
        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
          <a href="../register.html" className="group relative px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] hover:-translate-y-1 inline-flex items-center gap-3">
            <span className="relative z-10 flex items-center gap-3">
              <PawPrint className="w-5 h-5 animate-pulse" />
              Proteger mi mundo
            </span>
          </a>
          <a href="#como-funciona" className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
            Ver cómo funcionamos
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
        
        <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-slate-400">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Usuario feliz" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold italic text-slate-500">Más de 5,000 familias tranquilas</span>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative flex justify-center lg:justify-end order-1 lg:order-2"
      >
        <div className="relative w-full max-w-xl group">
          {/* Main Hero Image - Using mascotas.png from NFC project */}
          <div className="relative rounded-[40px] overflow-hidden shadow-2xl transform transition-transform duration-700 group-hover:scale-[1.02]">
            <img 
              src={HERO_IMAGE}
              alt="Mascotas protegidas con Cerca NFC" 
              className="w-full h-auto object-cover aspect-[4/5]"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            {/* Soft overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 via-transparent to-transparent"></div>
          </div>
          
          {/* Floating NFC Tag focus */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[40%] -left-4 md:-left-12 bg-white p-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] flex items-center gap-3 border border-indigo-50 z-20"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg relative">
              <Radar className="w-6 h-6 animate-ping absolute opacity-50" />
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Encontrado</p>
              <p className="text-sm font-bold text-slate-400">Escaneando...</p>
            </div>
          </motion.div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white transform rotate-12 z-10">
            <span className="text-xs md:text-sm font-black uppercase tracking-tighter">Sin Cuotas</span>
            <span className="text-2xl md:text-3xl font-black">De por vida</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const TrustBar = () => (
  <div className="bg-white border-y border-indigo-100 py-8">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          Sin apps necesarias
        </div>
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-600" />
          </div>
          Privacidad total
        </div>
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          Contacto en segundos
        </div>
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Radar className="w-5 h-5 text-blue-600" />
          </div>
          Funciona en cualquier teléfono
        </div>
      </div>
    </div>
  </div>
);

const ProcessSection = () => (
  <section id="como-funciona" className="bg-[#1a1c3d] py-20 px-6 flex flex-col items-center justify-center border-b border-indigo-900/50">
    <div className="max-w-7xl mx-auto w-full text-center">
      <span className="inline-block px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-black tracking-widest rounded-full mb-4 uppercase">
        Proceso simple
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight font-display">Funciona en 4 pasos</h2>
      <p className="text-indigo-300 text-sm mb-16 opacity-80 font-medium italic">Desde que recibes el chip hasta que recuperas lo perdido</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative max-w-4xl mx-auto">
        {/* Progress line */}
        <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-indigo-800/60 -z-0"></div>
        
        <StepItem number={1} icon={ShoppingCart} label="Compra tu chip" desc="Recibes un chip NFC con ID único" />
        <StepItem number={2} icon={UserCheck} label="Regístrate" desc="Crea tu cuenta y enlaza el chip" />
        <StepItem number={3} icon={Tag} label="Coloca el chip" desc="En tu mochila o collar de mascota" />
        <StepItem number={4} icon={Undo2} label="¡Te devuelven!" desc="Quien lo encuentra te contacta" />
      </div>
    </div>
  </section>
);

const UseCases = () => (
  <section id="usos" className="py-24 bg-gradient-to-b from-white to-indigo-50/20 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black tracking-widest rounded-full mb-6 uppercase">
          Casos de uso
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight font-display">
          Protege lo que más quieres
        </h2>
        <p className="text-slate-500 font-medium italic">Un mismo chip, dos mundos de protección para lo más importante</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        {/* Travel Card */}
        <div className="bg-[#f0f4ff] border border-indigo-100 rounded-[32px] p-8 md:p-12 flex flex-col gap-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-[#ff4b81] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <Luggage className="text-white w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-indigo-800 mb-4 tracking-tight font-display">Equipaje de viaje</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-6">
              Viaja sin miedo a perder tus maletas, mochilas o maletines. El chip NFC permite que cualquier persona que las encuentre pueda contactarte sin ver tus datos personales.
            </p>
            <ul className="grid grid-cols-1 gap-3">
              {['Mochilas de montaña y senderismo', 'Maletas de cabina y bodega', 'Maletines de trabajo y laptops', 'Cámaras, drones y equipo fotográfico'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
                  <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pets Card */}
        <div className="bg-[#fff8f4] border border-orange-100 rounded-[32px] p-8 md:p-12 flex flex-col gap-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex gap-2 mb-2 transform rotate-6">
            <PawPrint className="text-slate-700 w-10 h-10" />
            <PawPrint className="text-slate-700 w-6 h-6 mt-4 opacity-50" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-orange-600 mb-4 tracking-tight font-display">Mascotas</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-6">
              Tu perro, gato o conejo con un collar Cerca. Si se escapa, quien lo encuentre ve su nombre, especie, raza, color e información médica importante.
            </p>
            <ul className="grid grid-cols-1 gap-3">
              {['Perros y gatos domésticos', 'Animales con alegrías o medicamentos', 'Mascotas con historial médico relevante', 'Cualquier animal con dueño identificado'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FeaturesGrid = () => (
  <section className="py-24 bg-slate-50/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-black tracking-widest rounded-full mb-6 uppercase">
          Características
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight font-display">
          Todo lo que necesitas
        </h2>
        <p className="text-slate-500 font-medium italic">Simple para quien lo encuentra, seguro para el dueño</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Privacy Card (Wide) */}
        <div className="md:col-span-2 bg-white p-8 md:p-10 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center hover:shadow-md transition-shadow group">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Lock className="text-orange-500 w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Privacidad total garantizada</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Tu teléfono y email nunca se muestran en texto plano. Solo botones de contacto seguros: WhatsApp, llamada o email. La persona que te encuentra puede contactarte sin ver tus datos reales.
            </p>
          </div>
        </div>

        {/* Gradient Featured Card */}
        <div className="bg-gradient-to-br from-[#6389ff] to-[#4b71ef] p-8 md:p-10 rounded-[32px] text-white flex flex-col justify-between shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
            <Radar className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">Sin apps necesarias</h3>
            <p className="text-indigo-50 text-sm font-medium leading-relaxed opacity-90">
              Cualquier iPhone o Android moderno escanea el chip directamente. Sin descargas, sin cuentas.
            </p>
          </div>
        </div>

        {/* Pet Module */}
        <DetailedFeatureCard 
          icon={PawPrint} 
          iconColor="bg-orange-50 text-orange-400"
          title="Módulo para mascotas" 
          desc="Muestra especie, raza, color, edad e información médica al que encuentre a tu mascota."
        />

        {/* History */}
        <DetailedFeatureCard 
          icon={History} 
          iconColor="bg-indigo-50 text-indigo-400"
          title="Historial de escaneos" 
          desc="Sabe cuándo y desde dónde fue escaneado tu chip. Registro completo con país y ciudad."
        />

        {/* Multi-object */}
        <DetailedFeatureCard 
          icon={LayoutGrid} 
          iconColor="bg-blue-50 text-blue-400"
          title="Múltiples objetos y mascotas" 
          desc="Registra tantos chips como quieras. Mezcla objetos y mascotas en un mismo panel."
        />

        {/* Instant Update */}
        <DetailedFeatureCard 
          icon={Zap} 
          iconColor="bg-green-50 text-green-400"
          title="Actualización instantánea" 
          desc="¿Cambiaste de número? Actualiza tus datos y el chip lo refleja al instante, sin reprogramarlo."
        />
      </div>
    </div>
  </section>
);

const AppCTA = () => (
  <section className="py-20 bg-white border-t border-indigo-100">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-600 text-[10px] font-black tracking-widest rounded-full mb-6 uppercase">
        App Móvil
      </span>
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight font-display">
        Gestiona desde tu celular
      </h2>
      <p className="text-slate-500 font-medium italic mb-12">Disponible próximamente en tu tienda de apps favorita</p>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white flex flex-col items-center gap-4 shadow-xl">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">App Store</h3>
            <p className="text-slate-400 text-sm">Disponible para iPhone y iPad</p>
          </div>
          <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-semibold mt-2">Próximamente</span>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl text-white flex flex-col items-center gap-4 shadow-xl">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Google Play</h3>
            <p className="text-slate-400 text-sm">Disponible para Android</p>
          </div>
          <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-semibold mt-2">Próximamente</span>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-24 bg-gradient-to-br from-[#1a1c3d] via-indigo-950 to-[#0f0a2e] relative overflow-hidden">
    {/* Decorative glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/30 blur-[120px] rounded-full"></div>
    
    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight font-display">
        Todo lo que amas<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">siempre tiene forma de volver.</span>
      </h2>
      
      <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
        Protege tu equipaje de viaje y tus mascotas hoy mismo. Es gratis y toma menos de 2 minutos.
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        <a href="../register.html" className="group px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1 inline-flex items-center gap-3">
          <Tag className="w-5 h-5" />
          Crear mi cuenta gratis
        </a>
        <a href="../login.html" className="px-10 py-5 bg-transparent border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all inline-flex items-center gap-3">
          <Download className="w-5 h-5" />
          Ya tengo cuenta
        </a>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#0f0a2e] py-8 text-center border-t border-indigo-900/30">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          <PawPrint className="text-white w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Cerca</span>
      </div>
      <p className="text-indigo-300/50 text-sm">© 2025 Cerca NFC Tracker. Todos los derechos reservados.</p>
      <div className="flex gap-6 text-sm text-indigo-300 font-medium">
        <a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a>
        <a href="#" className="hover:text-white transition-colors">Términos y condiciones</a>
      </div>
    </div>
  </footer>
);

// Helper Components
const StepItem = ({ number, icon: Icon, label, desc }: { number: number, icon: any, label: string, desc: string }) => (
  <div className="flex flex-col items-center gap-4 group">
    <div className="relative">
      <div className="w-[80px] h-[80px] md:w-[88px] md:h-[88px] bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
        <Icon className="w-9 h-9 md:w-10 md:h-10 text-indigo-900" strokeWidth={1.5} />
      </div>
      <div className="absolute -top-1 -left-1 w-7 h-7 md:w-8 md:h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black ring-4 ring-[#1a1c3d]">
        {number}
      </div>
    </div>
    <span className="text-white font-bold text-sm leading-tight max-w-[100px] text-center">{label}</span>
    <span className="text-indigo-300/70 text-xs text-center max-w-[120px] hidden md:block">{desc}</span>
  </div>
);

const DetailedFeatureCard = ({ icon: Icon, title, desc, iconColor }: { icon: any, title: string, desc: string, iconColor: string }) => (
  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-5 hover:shadow-md transition-all group">
    <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" strokeWidth={2.5} />
    </div>
    <div>
      <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ProcessSection />
        <UseCases />
        <FeaturesGrid />
        <AppCTA />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
