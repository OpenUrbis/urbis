import { Mosaico } from '../components/home/Mosaico'
import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-[#E8E6EB] min-h-screen">
      <Mosaico />
      
      <Link 
        to="/ajuda" 
        className="fixed bottom-5 left-5 w-[50px] h-[50px] bg-[#007bff] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-[#0056b3] transition-colors z-[1000]"
        aria-label="Ajuda"
      >
        ?
      </Link>
    </div>
  )
}
