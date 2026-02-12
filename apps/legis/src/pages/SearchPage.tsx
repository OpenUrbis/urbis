import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
    Search, FileText, ArrowRight, Filter, Calendar as CalendarIcon, Tag, SlidersHorizontal, 
    MoreHorizontal, Download, Trash2, Copy, Check 
} from 'lucide-react';
import { 
    Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Badge, Tabs, TabsList, TabsTrigger, TabsContent,
    Separator,
    Checkbox
} from '@open-urbis/map-ui';
import { CommandMenu } from '../components/layout/command-menu';

// Mock Data for Files
const MOCK_FILES = [
    { id: '1', name: 'Anexo I - Mapa de Zoneamento.pdf', size: '2.4 MB', date: '15/01/2024', type: 'PDF', url: 'https://example.com/file1.pdf' },
    { id: '2', name: 'Tabela de Índices Urbanísticos.xlsx', size: '156 KB', date: '16/01/2024', type: 'Excel', url: 'https://example.com/file2.xlsx' },
    { id: '3', name: 'Decreto 59.123 - Texto Original.docx', size: '45 KB', date: '08/01/2020', type: 'Word', url: 'https://example.com/file3.docx' },
    { id: '4', name: 'Imagem Ilustrativa Recuos.png', size: '1.2 MB', date: '10/02/2024', type: 'Image', url: 'https://example.com/file4.png' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('legislation');
  const [results, setResults] = useState<any[]>([]);
  const [files, setFiles] = useState(MOCK_FILES);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with Command Menu logic if needed, currently standalone but visually integrated
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    // Mock results for Legislation
    setResults([
        { id: '18080', type: 'Lei', number: '18.080/2024', tags: ['Zoneamento', 'Obras'], ementa: 'Institui, a partir do sistema de coordenadas geográficas, a possibilidade de fixação de placas para a identificação de imóveis...', date: '16/01/2024' },
        { id: '32154', type: 'Resolução', number: '18/1871', tags: ['Histórico', 'Posturas'], ementa: 'MANDA PUBLICAR E EXECUTAR CINCO ARTIGOS DE POSTURAS DA CÂMARA MUNICIPAL DESTA CAPITAL', date: '09/03/1871' },
        { id: 'mock3', type: 'Decreto', number: '59.123/2020', tags: ['Edificações', 'Regularização'], ementa: 'Regulamenta a Lei nº 17.202, de 16 de outubro de 2019, que dispõe sobre a regularização de edificações...', date: '08/01/2020' },
    ]);
  };

  const copyUrl = (id: string, url: string) => {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteFile = (id: string) => {
      setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pesquisa Integrada</h1>
            <p className="text-muted-foreground mt-1">
                Busque por legislação, conceitos e arquivos da biblioteca.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-muted-foreground">
                <span className="text-xs">Atalho Global</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        </div>
      </div>

      {/* Main Search Bar */}
      <Card className="border-2 border-primary/10 shadow-md">
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Busque por termo, número, ano, ementa ou nome do arquivo..." 
                        className="pl-10 h-11 text-base shadow-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="h-11 px-4 gap-2" title="Filtros Avançados">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden md:inline">Filtros</span>
                    </Button>
                    <Button type="submit" className="h-11 px-8 text-base font-semibold shadow-sm">
                        Pesquisar
                    </Button>
                </div>
            </form>
            
            {/* Quick Tags */}
            <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs text-muted-foreground self-center mr-2">Sugestões:</span>
                {['Plano Diretor', 'Zoneamento', 'Código de Obras', 'Recuos', 'Taxa de Ocupação'].map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                        {tag}
                    </Badge>
                ))}
            </div>
          </CardContent>
      </Card>

      <Tabs defaultValue="legislation" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center border-b pb-1">
            <TabsList className="bg-transparent h-10 p-0 gap-6">
                <TabsTrigger 
                    value="legislation" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-full font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
                >
                    Legislação & Conceitos
                </TabsTrigger>
                <TabsTrigger 
                    value="files" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-full font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
                >
                    Biblioteca de Arquivos
                </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground hidden md:block">
                {activeTab === 'legislation' ? `${results.length} normas encontradas` : `${files.length} arquivos listados`}
            </div>
        </div>

        {/* Legislation Tab */}
        <TabsContent value="legislation" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Faceted Filters Sidebar */}
                <aside className="w-full md:w-64 space-y-6 shrink-0">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Tipo Normativo
                            </h3>
                            <div className="grid gap-2">
                                {['Leis', 'Decretos', 'Resoluções', 'Portarias'].map(type => (
                                    <div key={type} className="flex items-center gap-2">
                                        <Checkbox id={type} />
                                        <label htmlFor={type} className="text-sm text-muted-foreground cursor-pointer select-none leading-none">{type}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" /> Período
                            </h3>
                            <div className="flex gap-2 items-center">
                                <Input placeholder="Ano" className="h-8 text-sm" />
                                <span className="text-muted-foreground">-</span>
                                <Input placeholder="Ano" className="h-8 text-sm" />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-1">
                                {['Urbanismo', 'Meio Ambiente', 'Tributário', 'Administrativo'].map(tag => (
                                    <Badge key={tag} variant="outline" className="cursor-pointer hover:border-primary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Results Grid */}
                <div className="flex-1 space-y-4">
                    {searched ? (
                        results.length > 0 ? (
                            <div className="grid gap-4">
                                {results.map((result) => (
                                    <Link key={result.id} href={`/view/${result.id}`} className="block group">
                                        <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-bold">
                                                            {result.type} {result.number}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3" /> {result.date}
                                                        </span>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                                </div>
                                                <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors mb-2">
                                                    {result.ementa}
                                                </h3>
                                                <div className="flex gap-2 mt-3">
                                                    {result.tags?.map((tag: string) => (
                                                        <span key={tag} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                                <p className="text-sm">Tente ajustar os filtros ou termos de busca.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/5 border-dashed">
                            <p className="text-sm">Realize uma busca para ver os resultados aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
            <div className="grid md:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Arquivos Recentes</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" /> Filtros
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {files.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                        {file.type.substring(0,3).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate pr-4">{file.name}</p>
                                        <p className="text-xs text-muted-foreground flex gap-3">
                                            <span>{file.size}</span>
                                            <span>•</span>
                                            <span>{file.date}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" size="icon" className="h-8 w-8"
                                        onClick={() => copyUrl(file.id, file.url)}
                                        title="Copiar URL"
                                    >
                                        {copiedId === file.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteFile(file.id)} title="Excluir">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gerenciamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border border-dashed rounded-lg text-center bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer">
                            <p className="text-sm font-medium text-primary">Upload de Arquivo</p>
                            <p className="text-xs text-muted-foreground mt-1">Arraste ou clique para enviar</p>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-2">
                            <p>• Arquivos não utilizados há mais de 30 dias são marcados.</p>
                            <Button variant="link" className="px-0 h-auto text-xs text-destructive">Limpar arquivos órfãos</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
