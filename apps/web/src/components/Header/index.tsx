import { signal } from "@preact/signals";
import { Button, IconButton } from "rmwc";

import "./style.scss";

const isMenuOpenSignal = signal(false);

const toggleMenu = () => {
  isMenuOpenSignal.value = !isMenuOpenSignal.value;
};

const Header = () => {
  return (
    <header className="header sticky-header mat-elevation-z4">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div
          className="d-flex w-100 align-items-center"
          style={{ justifyContent: "flex-start" }}
        >
          <div className="d-flex align-items-center">
            <a className="navbar-brand" href="/">
              <img
                fetchPriority="high"
                src="https://urbis.sampa.br/assets/images/logo.webp"
                width="auto"
                height="36px"
                alt="Urbis"
              />
            </a>
          </div>
          <div
            className={`collapse navbar-collapse flex-grow-1 ${isMenuOpenSignal.value ? "show" : ""}`}
            id="navbarNavAltMarkup"
          >
            <div className="navbar-nav nav-links">
              <a className="nav-item nav-link" href="https://urbis.sampa.br">
                Início
              </a>
              <a className="nav-item nav-link nav-chip active" rel="noopener">
                Mapa
              </a>
              <a
                className="nav-item nav-link"
                href="https://viabiliza.urbis.sampa.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Viabiliza
              </a>
              <a
                className="nav-item nav-link"
                href="https://dadosabertos.urbis.sampa.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dados Abertos
              </a>
              <a
                className="nav-item nav-link"
                href="https://github.com/OpenUrbis"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                className="nav-item nav-link"
                href="https://docs.urbis.sampa.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentação
              </a>
            </div>
          </div>
          <IconButton
            className="navbar-toggler ms-2"
            onClick={toggleMenu}
            aria-expanded={isMenuOpenSignal.value}
            aria-controls="navbarNavAltMarkup"
            aria-label="Toggle navigation"
            icon="menu"
            style={{ minWidth: 0, padding: 8 }}
          />
          <div className="d-flex align-items-center" style={{ gap: "8px" }}>
            <Button
              tag="a"
              href="https://mapa.slui.dev"
              className="button-action"
              style={{ textDecoration: "none" }}
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
