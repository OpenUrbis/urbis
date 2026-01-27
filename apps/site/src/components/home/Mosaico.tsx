import { Search, Rss, ChevronDown, FileText, ExternalLink, Github, BookOpen } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@open-urbis/map-ui/ui/card'
import { Input } from '@open-urbis/map-ui/ui/input'
import { Button } from '@open-urbis/map-ui/ui/button'

export function Mosaico() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();

  const query = searchTerm.trim();
  if (!query) return;

  const url = `https://mapa.urbis.sampa.br/?search=${encodeURIComponent(query)}`;

  window.open(url, "_blank");
};
  return (
    <div className="container mx-auto px-4 xl:px-8 py-8 font-sans">
      <div className="relative mb-8 pb-4 w-full">
        <h1 className="font-sans text-5xl md:text-6xl font-bold text-primary tracking-tight m-0 leading-tight">
          Urbis
        </h1>
        <div className="absolute bottom-0 left-0 h-2 bg-primary w-[60%] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Main Content: 7/12 */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          
          {/* Search Card - No Border */}
          <Card 
            className="bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow rounded-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
            style={{ animationDelay: '0ms' }}
          >
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex flex-col gap-3">
  <label className="font-semibold text-xl block text-foreground">
    Busca Direta:
  </label>

  <div className="relative w-full">
    <div className="flex gap-2">
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Ex: Paulista, SQL, coordenadas..."
        className="flex-1 h-11 text-base rounded-sm"
        required
      />

      <Button
        type="submit"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-sm"
        aria-label="Pesquisar no Mapa Urbis"
      >
        <Search className="h-5 w-5" />
      </Button>
    </div>

    <div className="mt-1 text-xs text-muted-foreground">
      Av. Paulista, 1578 (exemplo)
    </div>
  </div>

  <div className="text-sm text-muted-foreground leading-relaxed">
    Pesquise por endereço, código tributário do imóvel, coordenadas ou nº de documento. <br />
    <span className="block mt-1">
      <strong>Obs:</strong> para buscas georreferenciadas, acesse o{" "}
      <a
        href="https://mapa.urbis.sampa.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
      >
        Mapa.Urbis <ExternalLink className="h-3.5 w-3.5" />
      </a>.
    </span>
  </div>
</form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
             {/* Left Column of Inner Grid */}
            <div className="flex flex-col gap-2">
               {/* Viabiliza - With Border (Increased) */}
              <a href="https://viabiliza.urbis.sampa.br" className="group block no-underline h-full">
                <Card 
                  className="h-full bg-white dark:bg-card hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: '100ms' }}
                >
                    <CardContent className="p-4">
                        <h2 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            Viabiliza
                        </h2>
                        <p className="text-muted-foreground text-sm leading-snug">
                        Licenciamentos edilícios, de atividades e ambientais.
                        </p>
                    </CardContent>
                </Card>
              </a>

              {/* Dados Abertos - With Border */}
              <a href="https://dadosabertos.urbis.sampa.br" className="group block no-underline h-full">
                <Card 
                  className="h-full bg-white dark:bg-card hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: '150ms' }}
                >
                    <CardContent className="p-4">
                        <h3 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors">Dados Abertos</h3>
                        <p className="text-muted-foreground text-sm leading-snug">
                        Acesse uma vasta gama de dados urbanos abertos, incluindo informações sobre zoneamento, licenças e muito mais.
                        </p>
                    </CardContent>
                </Card>
              </a>

              {/* OpenUrbis - With Border */}
               <a href="https://github.com/OpenUrbis" target="_blank" rel="noopener noreferrer" className="group block no-underline h-full relative">
                <Card 
                  className="h-full bg-white dark:bg-card hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: '200ms' }}
                >
                     <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors">OpenUrbis</h3>
                             <div className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-sm font-bold flex items-center gap-0.5">
                                <Github className="h-3.5 w-3.5" /> GitHub
                             </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-snug">
                        Contribua com nosso open-source.
                        </p>
                    </CardContent>
                </Card>
              </a>

              {/* Docs Urbis - With Border */}
              <Link to="/doc-tecnica" className="group block no-underline h-full">
                 <Card 
                   className="h-full bg-white dark:bg-card hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                   style={{ animationDelay: '250ms' }}
                 >
                     <CardContent className="p-4">
                        <h3 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            Docs.Urbis <BookOpen className="h-4 w-4 opacity-50" />
                        </h3>
                        <p className="text-muted-foreground text-sm leading-snug">
                        Documentação técnica para devs e usuários.
                        </p>
                    </CardContent>
                </Card>
              </Link>
            </div>

            {/* Right Column of Inner Grid - With Border */}
            <div className="flex flex-col gap-2 h-full">
              
              {/* Carta de Serviços */}
              <Link to="/carta-servicos" className="group flex flex-col flex-1 no-underline h-full">
                 <Card 
                   className="h-full bg-white dark:bg-card flex flex-col justify-center hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                   style={{ animationDelay: '100ms' }}
                 >
                    <CardContent className="p-4 flex gap-4 items-center">
                       <div className="text-primary shrink-0">
                           <FileText className="h-8 w-8" />
                       </div>
                       <div>
                         <h3 className="text-lg font-bold mb-0.5 text-foreground group-hover:text-primary transition-colors leading-tight">Carta de Serviços urbanísticos, ambientais e culturais</h3>
                         <p className="text-muted-foreground text-sm leading-snug">Veja onde solicitar autorizações, licenças, certidões etc.</p>
                       </div>
                    </CardContent>
                 </Card>
              </Link>

              {/* Legislação */}
              <Link to="/info-urbis" className="group flex flex-col flex-1 no-underline h-full">
                 <Card 
                   className="h-full bg-white dark:bg-card flex flex-col justify-center hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                   style={{ animationDelay: '150ms' }}
                 >
                    <CardContent className="p-4 flex gap-4 items-center">
                       <div className="text-primary shrink-0">
                           <BookOpen className="h-8 w-8" />
                       </div>
                       <div>
                         <h3 className="text-lg font-bold mb-0.5 text-foreground group-hover:text-primary transition-colors leading-tight">Legislação urbanística:</h3>
                         <ul className="text-muted-foreground text-sm list-disc pl-4 space-y-0.5 leading-snug">
                           <li>Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS</li>
                           <li>Código de Obras e Edificações - COE</li>
                           <li>+informações sobre legislação urbanística - +info.Urbis</li>
                         </ul>
                       </div>
                    </CardContent>
                 </Card>
              </Link>

               {/* Licenças */}
              <Link to="/licencas" className="group flex flex-col flex-1 no-underline h-full">
                 <Card 
                   className="h-full bg-white dark:bg-card flex flex-col justify-center hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                   style={{ animationDelay: '200ms' }}
                 >
                    <CardContent className="p-4 flex gap-4 items-center">
                       <div className="text-primary shrink-0">
                           <FileText className="h-8 w-8" />
                       </div>
                       <div>
                         <h3 className="text-lg font-bold mb-0.5 text-foreground group-hover:text-primary transition-colors leading-tight">Informações sobre licenças emitidas e denúncias</h3>
                         <p className="text-muted-foreground text-sm leading-snug">Veja onde encontrar informações sobre autorizações, licenças etc. e denunciar irregularidades.</p>
                       </div>
                    </CardContent>
                 </Card>
              </Link>

            </div>
          </div>
        </div>

         {/* Side Content: 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-2">
           {/* Mapa Urbis - No Border */}
           <a 
             href="https://mapa.urbis.sampa.br" 
             className="block relative rounded-sm bg-white dark:bg-card overflow-hidden group border border-border shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
             style={{ animationDelay: '100ms' }}
           >
             <div className="relative aspect-video bg-muted flex items-center justify-center">
                 <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur text-primary text-sm px-3 py-1 rounded-sm font-bold shadow-sm z-10 flex items-center gap-1 border border-border">
                   Mapa.urbis <ExternalLink className="h-3.5 w-3.5" />
                 </div>
                 <img
                   src="/sp-here-map.webp"
                   alt="Mapa Urbano"
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                   loading="lazy"
                   width="800"
                   height="450"
                 />
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <span className="sr-only">Acessar Mapa</span>
                 </div>
             </div>
           </a>

           {/* Data Lake - With Border */}
           <a href="https://datalake.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="group block no-underline">
                <Card 
                  className="bg-white dark:bg-card hover:shadow-md transition-all duration-200 rounded-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: '200ms' }}
                >
                    <CardContent className="p-4">
                         <h3 className="text-xl font-bold mb-0.5 text-foreground group-hover:text-primary transition-colors">Data lake</h3>
                        <p className="text-muted-foreground text-sm leading-snug">
                          Acesse o nosso datalake (apenas uso interno)
                        </p>
                    </CardContent>
                </Card>
           </a>
        </div>
      </div>

      {/* Bottom Section: FAQ & Novidades (FAQ First) - No Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
         {/* FAQ - No Border */}
         <Card 
           className="bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow rounded-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
           style={{ animationDelay: '300ms' }}
         >
            <CardContent className="p-4">
                <h4 className="text-xl font-bold mb-3 text-foreground">Perguntas Frequentes</h4>
                
                <Accordion.Root type="multiple" className="space-y-1">
                  <Accordion.Item value="item-1" className="border-b border-border last:border-0">
                    <Accordion.Header>
                      <Accordion.Trigger className="flex items-center justify-between w-full py-2 text-left font-medium text-foreground hover:text-primary transition-colors group text-sm">
                        O que é o Data Urbs?
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="text-muted-foreground pb-2 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      O Data Urbs é um projeto de software open source focado em urbanismo para a cidade de São Paulo.
                    </Accordion.Content>
                  </Accordion.Item>

                  <Accordion.Item value="item-2" className="border-b border-border last:border-0">
                    <Accordion.Header>
                      <Accordion.Trigger className="flex items-center justify-between w-full py-2 text-left font-medium text-foreground hover:text-primary transition-colors group text-sm">
                        Como posso contribuir?
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="text-muted-foreground pb-2 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      Você pode contribuir reportando bugs, sugerindo funcionalidades ou desenvolvendo código no GitHub.
                    </Accordion.Content>
                  </Accordion.Item>

                  <Accordion.Item value="item-3" className="border-b border-border last:border-0">
                    <Accordion.Header>
                      <Accordion.Trigger className="flex items-center justify-between w-full py-2 text-left font-medium text-foreground hover:text-primary transition-colors group text-sm">
                        Mais dados sobre urbanismo?
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="text-muted-foreground pb-2 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      Além do Data Urbs, consulte o Plano Diretor, o Código de Obras e o site da Prefeitura de São Paulo.
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
            </CardContent>
         </Card>

         {/* Novidades - No Border */}
         <Card 
           className="bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow rounded-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
           style={{ animationDelay: '350ms' }}
         >
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                   <Rss className="text-primary h-5 w-5" />
                   <h4 className="text-xl font-bold text-foreground">Novidades</h4>
                </div>
                <div className="flex flex-col gap-2">
                   <div className="group block bg-muted/30 rounded-sm border-l-2 border-l-muted-foreground p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <h3 className="text-sm font-bold mb-0.5 text-foreground group-hover:text-primary transition-colors">Atualizações do Data Urbs</h3>
                      <p className="text-xs text-muted-foreground leading-tight">
                        Fique por dentro das últimas novidades e melhorias no projeto Data Urbs.
                      </p>
                   </div>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
