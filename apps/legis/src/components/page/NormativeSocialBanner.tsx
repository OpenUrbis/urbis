import React from 'react';
import { OriginalNormativo, Authority } from '../../domain/entities';
import { NORMATIVE_TYPES } from '../../data/normative-types';
import { Badge } from '@open-urbis/map-ui';
import { Quote, Landmark, Calendar, Share2, Download, X, Copy } from 'lucide-react';

interface NormativeSocialBannerProps {
    data: Partial<OriginalNormativo>;
    authority?: Authority;
    onClose?: () => void;
}

export function NormativeSocialBanner({ data, authority, onClose }: NormativeSocialBannerProps) {
    const typeLabel = data.normativeType ? NORMATIVE_TYPES[data.normativeType] : 'Normativa';
    const date = data.actDate || data.publicationDate || 'Data desconhecida';
    
    // Modern gradient
    const bgPattern = `radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.2) 0%, rgba(0,0,0,0) 50%), 
                       radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.2) 0%, rgba(0,0,0,0) 50%)`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors z-[110]"
            >
                <X className="w-6 h-6 text-foreground" />
            </button>

            <div className="group relative w-full max-w-4xl mx-auto overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 ring-1 ring-white/10 hover:ring-white/20">
                {/* Action Overlay - Only shows when hovering specifically over the card */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-4 backdrop-blur-[4px] pointer-events-none group-hover:pointer-events-auto">
                    <button className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-xl hover:bg-zinc-100 hover:scale-105 active:scale-95">
                        <Download className="w-5 h-5" /> Baixar Imagem
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-100 cubic-bezier(0.16, 1, 0.3, 1) shadow-xl hover:bg-blue-500 hover:scale-105 active:scale-95">
                        <Share2 className="w-5 h-5" /> Compartilhar
                    </button>
                </div>

                {/* Main Card */}
                <div className="bg-zinc-950 text-white p-10 md:p-14 relative aspect-[16/10] md:aspect-video flex flex-col justify-between select-none">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0" style={{ backgroundImage: bgPattern }} />
                    
                    {/* Abstract shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    
                    {/* Grid Pattern overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                    {/* Header */}
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex gap-5 items-center">
                            <div className="p-3.5 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
                                <Landmark className="w-10 h-10 text-blue-400" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xs font-bold tracking-[0.2em] text-blue-400/80 uppercase">
                                    {authority?.commonRefAbbr || 'BRASIL'}
                                </h2>
                                <h1 className="text-xl md:text-2xl font-semibold text-white/95 tracking-tight">
                                    {authority?.complementFull || authority?.commonRefFull || 'Autoridade Pública'}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-xs font-bold tracking-widest text-white/90 uppercase">Legis Urbis</span>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="relative z-10 my-10 space-y-10 flex-1 flex flex-col justify-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 text-blue-300 text-xs font-bold tracking-widest uppercase border border-white/10 backdrop-blur-sm">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                {date}
                            </div>
                            <h3 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] group-hover:scale-[1.01] transition-transform duration-700">
                                {typeLabel} <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                    nº {data.number || '---'}
                                </span>
                            </h3>
                        </div>

                        <div className="relative pl-10 border-l-[6px] border-gradient-to-b from-blue-500 to-purple-500 max-w-4xl py-2">
                            <p className="text-2xl md:text-3xl text-zinc-300 font-medium leading-tight tracking-tight line-clamp-3">
                                {data.ementa || 'Ementa da norma...'}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 border-t border-white/10 pt-10 flex justify-between items-end">
                        <div className="flex gap-12">
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Plataforma</p>
                                <p className="font-black text-white text-xl tracking-tighter">
                                    Legis.Urbis
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">ID Digital</p>
                                <p className="font-mono text-zinc-300 text-sm flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/id">
                                    {data.id ? data.id.toUpperCase() : 'LEI_LPUO'}
                                    <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover/id:text-blue-400 transition-colors" />
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="text-right space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Acesso Imediato</p>
                                <p className="text-xs text-zinc-400 font-bold leading-tight">Escaneie para ver o<br/>documento completo</p>
                            </div>
                            <div className="w-20 h-20 bg-white rounded-[1.25rem] p-2 shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                                 <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-zinc-100">
                                     <div className="grid grid-cols-2 gap-1 p-2">
                                         <div className="w-3 h-3 bg-white rounded-sm" />
                                         <div className="w-3 h-3 bg-white rounded-sm" />
                                         <div className="w-3 h-3 bg-white rounded-sm" />
                                         <div className="w-3 h-3 bg-blue-500 rounded-sm animate-pulse" />
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
