'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { MessageSquare, Calendar, User, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Tilgang nektet eller feil:", error.message)
        router.push('/dashboard') // Sender deg tilbake hvis du ikke er admin
      } else {
        setFeedbacks(data || [])
      }
      setLoading(false)
    }

    fetchFeedback()
  }, [router])

  const deleteFeedback = async (id: string) => {
    if (window.confirm("Slette denne meldingen?")) {
      const { error } = await supabase.from('feedback').delete().eq('id', id)
      if (!error) setFeedbacks(feedbacks.filter(f => f.id !== id))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft size={16} /> Tilbake
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-black italic uppercase text-fuchsia-500 tracking-tighter">Admin Panel</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em]">User Feedback Archive</p>
          </div>
        </div>

        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-900 rounded-[2rem]">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Ingen meldinger ennå</p>
            </div>
          ) : (
            feedbacks.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-fuchsia-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-fuchsia-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm italic">{item.username || 'Anonym'}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        <Calendar size={12} />
                        {new Date(item.created_at).toLocaleString('nb-NO')}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteFeedback(item.id)}
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex gap-3">
                    <MessageSquare size={16} className="text-fuchsia-500 mt-1 shrink-0" />
                    <p className="text-slate-300 text-sm leading-relaxed">{item.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}