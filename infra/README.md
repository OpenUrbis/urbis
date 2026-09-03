# 🗺️ Urbis Map - Infraestrutura em Código (Helm Charts / Kubernetes)

Este repositório contém a definição de infraestrutura como código (IaC) para o deploy do ecossistema **Urbis Map** no Kubernetes (Azure AKS / AWS EKS / On-Premise).

---

## 🏛️ Arquitetura dos Componentes

O chart `urbis-map` é composto por subcharts modulares:

- **`base`**: Emissores de certificados ACME (Let's Encrypt / cert-manager) e Secrets de autenticação para Registry de Imagens (`urbis-docker-hub`).
- **`components-apps`**:
  - **`urbis-map-api`**: Backend NestJS de alta performance (4 réplicas com HPA para até 8, probes de liveness/readiness/startup, graceful shutdown e pod anti-affinity).
  - **`urbis-map-storage`**: Camada de compatibilidade S3Proxy (`andrewgaul/s3proxy`) fazendo ponte entre API S3 e Azure Blob Storage ou bucket compatível.
- **`components-api-gateway`**: Ingress Nginx com afinidade de sessão por cookie, suporte a uploads de grande porte (`proxy-body-size: 2g`), reescrita por regex e roteamento para `/storage` e `/`.
- **`ingress-nginx`** & **`cert-manager`**: Dependências padrão da comunidade gerenciadas via Helm.

---

## 📋 Pré-requisitos

1. Cluster Kubernetes (1.24+) com `kubectl` configurado.
2. Helm 3.8+.
3. Cert-Manager instalado ou CRDs aplicadas:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.crds.yaml
   ```
4. Ingress Controller (Nginx) com ingressClass `nginx-map` (ou ingress default).

---

## 🔐 Configuração de Segredos (`secrets.yaml`)

Antes do deploy, crie o arquivo de segredos a partir do template de exemplo:

```bash
cp infra/secrets.yaml.example infra/secrets.yaml
```

Preencha os seguintes valores no `secrets.yaml`:
- **PostgreSQL**: Senha e usuário de banco de dados.
- **Redis**: Senha do cluster/instância Redis.
- **JWT & 2FA**: Chaves secretas para assinatura de tokens e 2FA TOTP.
- **OIDC Gov.br**: Client Secret da autoridade externa.
- **GeoServer**: Token Bearer ou credenciais de acesso às camadas WFS/WMS.
- **Azure Communication Services / SendGrid**: String de conexão para envio de e-mails.
- **Maxar / Google Gemini / reCAPTCHA**: Chaves de API de satélite e IA.
- **S3Proxy / Azure Blob**: Chaves de acesso ao Storage Account da nuvem.
- **DockerHub**: Credenciais do container registry para pull da imagem privada `openurbis/urbis-map`.

> ⚠️ **Nota de Segurança:** O arquivo `secrets.yaml` está no `.gitignore` e **NUNCA** deve ser comitado.

---

## 🚀 Instalação e Atualização

### 1. Atualizar Dependências do Helm:
```bash
helm dependency update ./infra
```

### 2. Instalação Inicial:
```bash
helm install urbis-map ./infra \
  --namespace urbis-map \
  --create-namespace \
  -f ./infra/values.yaml \
  -f ./infra/secrets.yaml
```

### 3. Atualização (Upgrade):
```bash
helm upgrade urbis-map ./infra \
  --namespace urbis-map \
  -f ./infra/values.yaml \
  -f ./infra/secrets.yaml
```

---

## 🔍 Diagnóstico e Verificação

```bash
# Verificar status dos pods
kubectl get pods -n urbis-map -o wide

# Inspecionar logs da API
kubectl logs -f deployment/urbis-map-api -n urbis-map

# Inspecionar HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n urbis-map

# Inspecionar Ingress e Certificados TLS
kubectl get ingress,certificate -n urbis-map
```
