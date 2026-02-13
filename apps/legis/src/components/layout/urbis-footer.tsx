import React from 'react';
import { Link } from 'wouter';
import { Button } from '@open-urbis/map-ui';

export function UrbisFooter() {
  return (
    <footer className="bg-primary text-primary-foreground pt-10 pb-10 font-sans mt-auto">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1
          className="text-transparent text-[9vw] lg:text-[120px] font-black leading-none m-0 px-3 h-auto select-none"
          style={{
            WebkitTextStroke: '2px hsl(var(--primary-foreground))',
          }}
        >
          URBIS'SP
        </h1>

        {/* INICIO */}
        <div className="flex justify-start mt-12 mb-6">
          <div className="text-left">
            <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-4">
              <a
                href="https://urbis.prefeitura.sp.gov.br/pt/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                INÍCIO
              </a>
            </h2>
            <div className="flex gap-3 flex-wrap justify-start">
              <a href="https://urbis.prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4"
                >
                  Home
                </Button>
              </a>
              <a
                href="https://viabiliza.urbis.prefeitura.sp.gov.br/sign-up"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4"
                >
                  Cadastro
                </Button>
              </a>
              <a
                href="mailto:codata@prefeitura.sp.gov.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4"
                >
                  Contato
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-2.5 mx-auto" />

        {/* MAPA.URBIS */}
        <div className="flex justify-start mt-3 mb-6">
          <div className="text-left">
            <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-2">
              <a
                href="https://mapa.urbis.prefeitura.sp.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                MAPA
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full" />
          </div>
        </div>
        <div className="px-1 mb-6 max-w-4xl">
          <p className="text-primary-foreground/90 text-base font-normal leading-6 tracking-wide mt-1">
            Mapa online que suporta pesquisas complexas com concatenação de critérios, desenho,
            edição ou arquivos de geometria, em bases totalmente personalizáveis.
          </p>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-8 mx-auto" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* DADOS ABERTOS */}
          <div>
            <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
              <a
                href="https://dadosabertos.urbis.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                DADOS ABERTOS
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              Repositório de metadados das bases do Urbis.
            </p>
          </div>

          {/* DOCS URBIS */}
          <div>
            <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
              <a
                href="https://docs.urbis.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                DOCS URBIS
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              Documentação técnica detalhada do ecossistema Urbis.
            </p>
          </div>

          {/* OPEN URBIS */}
          <div>
            <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
              <a
                href="https://github.com/OpenUrbis"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                OPEN URBIS
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              Projeto de código aberto.
            </p>
          </div>
        </div>

        {/* Prefeitura Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 border-t border-primary-foreground/30 pt-8 pb-6 text-primary-foreground/90 text-sm">
          <div>
            <h2 className="font-bold mb-2.5 text-lg text-primary-foreground">
              Prefeitura
            </h2>
            <ul className="space-y-1.5">
              <li><a href="https://capital.sp.gov.br/" className="hover:underline">Portal da Prefeitura</a></li>
              <li><a href="https://capital.sp.gov.br/secretarias" className="hover:underline">Secretarias</a></li>
              <li><a href="https://sp156.prefeitura.sp.gov.br/portal" className="hover:underline">SP156</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-foreground/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex items-center gap-6 self-center md:self-start">
             <div className="text-2xl font-bold">SP</div>
             <div className="h-12 w-px bg-primary-foreground/20" />
             <div className="text-xl font-bold">CODATA</div>
          </div>

          <div className="flex flex-col items-center justify-center text-center gap-1 w-full md:w-auto">
              <p className="text-lg font-bold">Município de São Paulo © 2024</p>
              <div className="text-xs opacity-80">Software Livre (AGPL v3) • Dados Abertos (CC BY-SA 4.0)</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
