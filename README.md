# Cápsula de Memórias

Plataforma *open-source* para criação, gerenciamento e compartilhamento de presentes digitais imersivos e experiências interativas para casais. A aplicação permite a elaboração de envelopes digitais personalizados com linhas do tempo multimídia, trilha sonora emulada via toca-fitas retrô, projeção astronômica de cartas celestes e cartas interativas com lacre virtual de cera.

---

## Arquitetura e Stack Tecnológico

A aplicação foi estruturada sobre uma arquitetura Jamstack moderna, com renderização híbrida e comunicação direta com serviços em nuvem gerenciados:

- **Core Framework:** [Next.js](https://nextjs.org/) (React 18 + TypeScript) utilizando Pages Router e geração estática exportável (`next export`).
- **Estilização e Design System:** [Tailwind CSS](https://tailwindcss.com/) com paleta estendida em Dark Glassmorphism, efeitos de iluminação difusa (*ambient glows*) e tipografia balanceada entre serifas clássicas e caligrafia manuscrita.
- **Ícones e Assets Vetoriais:** [Lucide React](https://lucide.dev/).
- **Animações e Efeitos:** CSS Animations nativas, Canvas Confetti e transições tridimensionais com CSS Perspective.
- **Suíte Firebase:**
  - **Firebase Authentication:** Gestão de identidade e autenticação para criadores (suporte a e-mail/senha e Google OAuth).
  - **Cloud Firestore:** Banco de dados NoSQL distribuído para persistência dos dados dos presentes, configurações de layout e relacionamentos atrelados ao identificador único do usuário (`userId`).
  - **Firebase Hosting:** Hospedagem estática de alta performance com CDN global e regras de reescrita para Single-Page Applications (SPA).

---

## Features Principais

- **Timeline Dinâmica e Álbum 3D Flipbook:** Visualizador duplo com suporte a linha do tempo vertical sequencial e livro de memórias tridimensional com transição realista de virada de páginas.
- **Proteção de Rotas com Firebase Auth:** Contexto global de autenticação (`useAuth`) protegendo o painel de controle (`/dashboard`) e o editor de criação (`/editor`), redirecionando acessos anônimos para `/login`.
- **CRUD de Presentes Vinculado ao UID do Criador:** Controle de acesso granular onde apenas o usuário autenticado que gerou o documento possui privilégios de leitura, edição e exclusão no painel administrativo.
- **Renderização Pública para Recebedores:** Rota pública e desacoplada (`/gift/[id]`), permitindo que recebedores abram a experiência interativa em qualquer dispositivo sem necessidade de cadastro ou login.
- **Portão de Interação de Áudio (*Interaction Gate*):** Camada de abertura que desbloqueia a reprodução de áudio/música (HTML5 Audio e YouTube IFrame API) sincronizada com o clique do usuário, contornando de forma determinística as políticas de bloqueio de autoplay de navegadores mobile (iOS Safari e Google Chrome).
- **Cartografia Celeste em SVG:** Renderização paramétrica de constelações com base na data do marco e coordenadas geográficas pré-configuradas.
- **UI Baseada em Dark Glassmorphism:** Painéis semitransparentes com efeito de desfoque de fundo (`backdrop-blur`), bordas sutis e paleta pastel contrastando com o fundo em tons de obsidiana profunda (`#07070c`).

---

## Pré-requisitos e Setup Local

### Requisitos

- Node.js (versão 18.x ou superior recomendada)
- Gerenciador de pacotes npm (versão 9.x ou superior)
- Projeto ativo no Firebase Console com **Authentication** e **Cloud Firestore** habilitados.

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/HighestCoder/Capsula-De-Memorias.git
   cd Capsula-De-Memorias
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com base no modelo `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```
   Preencha as variáveis públicas com as credenciais do seu projeto Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

4. **Executar em Ambiente de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em `http://localhost:3000`.

---

## Instruções de Deploy (Firebase Hosting)

Para publicar a aplicação em produção utilizando o Firebase Hosting:

1. **Instalar o Firebase CLI globalmente (caso ainda não possua):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Autenticar no Firebase:**
   ```bash
   firebase login
   ```

3. **Vincular o Projeto:**
   Caso seja a primeira configuração em um novo ambiente:
   ```bash
   firebase use --add
   ```
   Selecione o ID do projeto Firebase desejado.

4. **Gerar o Build de Produção:**
   ```bash
   npm run build
   ```
   O Next.js compilará os arquivos e gerará os ativos estáticos no diretório `out/`.

5. **Realizar o Deploy:**
   ```bash
   firebase deploy --only hosting
   ```
   Caso queira sincronizar as regras de segurança do Firestore simultaneamente:
   ```bash
   firebase deploy
   ```

---

## Regras de Segurança do Firestore

O arquivo `firestore.rules` já acompanha o repositório configurado para proteger os dados sensíveis:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gifts/{giftId} {
      // Leitura pública irrestrita para visualização dos presentes por recebedores
      allow read: if true;

      // Criação permitida apenas para usuários autenticados, vinculando o UID
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

      // Atualização e exclusão restritas estritamente ao criador do documento
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Créditos e Licença

Desenvolvido por Iago Leonardo | Discord: HighestCoder
