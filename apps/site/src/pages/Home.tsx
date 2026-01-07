import { Mosaico } from '../components/home/Mosaico'
import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-muted/30 min-h-screen">
      <Mosaico />
      
      <Link 
        to="/ajuda" 
        className="fixed bottom-6 left-6 h-14 w-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200 z-50 ring-offset-2 ring-2 ring-transparent hover:ring-primary/50"
        aria-label="Ajuda"
      >
        <HelpCircle className="h-7 w-7" />
      </Link>
    </div>
  )
}
