import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AjudaComponent } from './pages/home/ajuda/ajuda.component';
import { DocTecnicaComponent } from './pages/doc-tecnica/doc-tecnica.component';
import { InfoUrbisComponent } from './pages/info-urbis/info-urbis.component';
import { CartaServicosComponent } from './pages/carta-servicos/carta-servicos.component'
import { LicencaEDenunciasComponent } from './pages/licenca-e-denuncias/licenca-e-denuncias.component'

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'ajuda', component: AjudaComponent },
  { path: 'doc.tecnica', component: DocTecnicaComponent },
  { path: 'info.urbis', component: InfoUrbisComponent},
  { path: 'carta-servicos', component: CartaServicosComponent},
  { path: 'licencas', component: LicencaEDenunciasComponent},
  { path: '**', redirectTo: '' }
];
