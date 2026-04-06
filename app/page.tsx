'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from "@/app/context/LanguageContext";

export default function Home() {
  // Vi henter t, men setter en tom fallback for å unngå krasj 
  // hvis t.auth ikke er lastet inn i det første millisekundet.
  const { t, locale, setLocale } = useTranslation();
  const authT = t?.auth || {}; 

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('') 
  const [message, setMessage] = useState('')
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sjekk brukernavn
  useEffect(() => {
    if (!isSignUp || username.length < 3) {
      setIsUsernameAvailable(null)
      return
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase()) 
          .maybeSingle()
        setIsUsernameAvailable(!data) 
      } catch (e) {
        console.error(e)
      } finally {
        setIsCheckingUsername(false)
      }
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username, isSignUp])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        setMessage(authT.passwords_dont_match || "Passwords don't match")
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setMessage(authError.message)
      } else if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: authData.user.id, username: username }])
        
        if (profileError) setMessage("Profile error")
        else router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  // Hvis oversettelsen er helt tom (første render), vis en enkel spinner 
  // som IKKE blokkerer for lenge.
  if (!t) return <div className="min-h-screen bg-slate-950" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4 font-sans">
      
      {/* SPRÅKVELGER */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold"
          >
            <img src={locale === 'no' ? "https://flagcdn.com/w40/no.png" : "https://flagcdn.com/w40/gb.png"} className="w-4 h-auto rounded-sm" alt="flag" />
            <ChevronDown size={14} className={isLangOpen ? 'rotate-180' : ''} />
          </button>
          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-10">
              <button onClick={() => {setLocale('no'); setIsLangOpen(false)}} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 text-[10px] font-bold uppercase">
                Norsk {locale === 'no' && <Check size={12}/>}
              </button>
              <button onClick={() => {setLocale('en'); setIsLangOpen(false)}} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 text-[10px] font-bold uppercase">
                English {locale === 'en' && <Check size={12}/>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md p-8 bg-slate-900 rounded-[2.5rem] border border-fuchsia-500/20 shadow-[0_0_50px_-12px_rgba(217,70,239,0.2)] text-center relative overflow-hidden">
        
        <h1 className="text-4xl font-black italic mb-2 text-fuchsia-500 tracking-tighter uppercase leading-none">
          {authT.title || "GIG-TRACKER"}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 mb-8 italic font-bold">
          {authT.subtitle || "Live Archive"}
        </p>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left">
          
          {isSignUp && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 flex items-center gap-2">
                <User size={12}/> {authT.username || "Username"}
              </label>
              <input 
                type="text" 
                className={`w-full p-4 bg-slate-800 rounded-2xl border outline-none transition-all text-sm ${
                  isUsernameAvailable === true ? 'border-green-500/50' : isUsernameAvailable === false ? 'border-red-500/50' : 'border-slate-700 focus:border-fuchsia-500'
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 flex items-center gap-2">
              <Mail size={12}/> {authT.email || "Email"}
            </label>
            <input 
              type="email" 
              className="p-4 bg-slate-800 rounded-2xl border border-slate-700 outline-none focus:border-fuchsia-500 transition-all text-sm"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 flex items-center gap-2">
              <Lock size={12}/> {authT.password || "Password"}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-700 outline-none focus:border-fuchsia-500 transition-all text-sm"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 flex items-center gap-2">
                <Lock size={12}/> {authT.confirm_password || "Confirm Password"}
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  className={`w-full p-4 bg-slate-800 rounded-2xl border outline-none transition-all text-sm ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-slate-700 focus:border-fuchsia-500'
                  }`}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-4 mt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-fuchsia-600 p-4 rounded-2xl font-black uppercase tracking-widest text-white active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-fuchsia-600/20"
            >
              {loading ? (authT.loading || "...") : (isSignUp ? (authT.signup_btn || "Sign Up") : (authT.login_btn || "Log In"))}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-fuchsia-400 transition-colors"
            >
              {isSignUp ? (authT.toggle_login || "Back") : (authT.toggle_signup || "Join")}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-6 p-4 bg-slate-800/50 border border-fuchsia-500/20 rounded-2xl text-[10px] text-fuchsia-400 font-bold italic flex items-center justify-center gap-2">
            <AlertCircle size={14}/> {message}
          </div>
        )}
      </div>
    </main>
  )
}