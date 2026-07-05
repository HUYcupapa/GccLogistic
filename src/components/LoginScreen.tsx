import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Leaf, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* Background decorations - vibrant fruit-inspired colors */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
      
      {/* Decorative tomatoes */}
      <motion.img 
        initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
        animate={{ opacity: 0.9, scale: 1, rotate: -10 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600" 
        alt="Tomato" 
        className="absolute top-20 -left-20 w-80 h-80 object-cover rounded-full shadow-2xl opacity-80 blur-[2px]"
      />
      <motion.img 
        initial={{ opacity: 0, scale: 0.8, rotate: 20 }}
        animate={{ opacity: 0.9, scale: 1, rotate: 10 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Tomato.jpg" 
        alt="Tomato" 
        className="absolute -bottom-10 -right-20 w-96 h-96 object-cover rounded-full shadow-2xl opacity-80 mix-blend-multiply"
      />
      <motion.img 
        initial={{ opacity: 0, scale: 0.8, rotate: -40 }}
        animate={{ opacity: 0.6, scale: 1, rotate: -20 }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
        src="https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg" 
        alt="Tomato" 
        className="absolute top-40 right-10 w-48 h-48 object-cover rounded-full shadow-2xl blur-[4px] mix-blend-multiply"
      />
      <motion.img 
        initial={{ opacity: 0, scale: 0.8, rotate: 40 }}
        animate={{ opacity: 0.7, scale: 1, rotate: 20 }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
        src="https://upload.wikimedia.org/wikipedia/commons/d/da/Red_capsicum_and_cross_section.jpg" 
        alt="Red Pepper" 
        className="absolute bottom-20 left-10 w-64 h-64 object-cover rounded-full shadow-2xl blur-[3px]"
      />

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl shadow-red-500/10 border border-white"
      >
        <div className="flex flex-col items-center text-center gap-6">
          
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transform rotate-3">
            <Leaf className="w-10 h-10 text-white transform -rotate-3" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">FreshConnect</h1>
            <p className="text-slate-500 text-sm leading-relaxed px-4">
              The premier B2B cold chain platform for sourcing premium fresh produce worldwide.
            </p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

          <button
            onClick={onLogin}
            className="w-full relative group overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all duration-300 p-4 shadow-sm hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-emerald-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
              <span className="font-bold text-slate-700 group-hover:text-emerald-800 transition-colors">Continue with Google</span>
            </div>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure, authenticated access</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
