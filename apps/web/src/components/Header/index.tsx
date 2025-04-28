import { h } from 'preact';
import { signal } from '@preact/signals';
import { Button  } from "rmwc";

import './style.scss';

const isMenuOpenSignal = signal(false);

const toggleMenu = () => {
  isMenuOpenSignal.value = !isMenuOpenSignal.value;
};

const Header = () => {
  return (
    <header class="header sticky-header mat-elevation-z4">
      <nav class="navbar navbar-expand-lg navbar-light">
        <div class="d-flex w-100 align-items-center" style={{ justifyContent: 'flex-start' }}>
          <div class="d-flex align-items-center">
            <a class="navbar-brand" href="/">
              <img fetchpriority="high" src="https://urbis.sampa.br/assets/images/logo.webp" width="auto" height="36px" alt="Urbis" />
            </a>
          </div>
          <div class={`collapse navbar-collapse flex-grow-1 ${isMenuOpenSignal.value ? 'show' : ''}`} id="navbarNavAltMarkup">
            <div class="navbar-nav nav-links">
              <a class="nav-item nav-link" href="https://urbis.sampa.br">Início</a>
              <a class="nav-item nav-link nav-chip active" rel="noopener">Mapa</a>
              <a class="nav-item nav-link" href="https://viabiliza.urbis.sampa.br" target="_blank" rel="noopener">Viabiliza</a>
              <a class="nav-item nav-link" href="https://dadosabertos.urbis.sampa.br" target="_blank" rel="noopener">Dados Abertos</a>
              <a class="nav-item nav-link" href="https://github.com/OpenUrbis" target="_blank" rel="noopener">GitHub</a>
              <a class="nav-item nav-link" href="https://docs.urbis.sampa.br" target="_blank" rel="noopener">Documentação</a>
            </div>
          </div>
          <Button
            className="navbar-toggler ms-2"
            onClick={toggleMenu}
            aria-expanded={isMenuOpenSignal.value}
            aria-controls="navbarNavAltMarkup"
            aria-label="Toggle navigation"
            icon="menu"
            style={{ minWidth: 0, padding: 8 }}
          />
          <div class="d-flex align-items-center" style={{ gap: '8px' }}>
            <Button
              tag="a"
              href="https://mapa.slui.dev"
              className="button-action"
              style={{ textDecoration: 'none' }}
              icon="arrow_forward"
            >
              Entrar
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;