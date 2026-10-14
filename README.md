# AprovaIF

MVP educacional independente para preparação para processos seletivos do IFTM. React + Vite + JavaScript, React Router, React Bootstrap, Bootstrap Icons, Axios, Recharts e DOMPurify. Desenvolvido por SunSale System; sem vínculo oficial com o IFTM.

## Executar

```sh
npm install
cp .env.example .env
npm run dev
npm test
npm run test:e2e
npm run build
npm run preview
```

No PowerShell, use `Copy-Item .env.example .env`. Para testes de navegador, execute antes `npx playwright install chromium`. Playwright inicia um servidor isolado na porta 5174 com configuração exclusiva de teste. O servidor de desenvolvimento normal usa a porta 5173.

## Configuração

| Variável                 | Uso                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `VITE_APP_NAME`          | Nome do aplicativo (AprovaIF)                                                                    |
| `VITE_QUESTOES_API_URL`  | Base da API pública; possui valor padrão real                                                    |
| `VITE_ECOMMERCE_WEB_URL` | Base do checkout DEV documentada no pedido                                                       |
| `VITE_ECOMMERCE_API_URL` | **Obrigatória para acesso.** Host da API de assinatura não informado; sem valor padrão inventado |
| `VITE_CONTACT_EMAIL`     | Canal opcional de contato; a página informa quando ausente                                       |

Edite `src/config/plans.js`: substitua cada `pin` e `offerCode` e configure `price` como número em reais. Os OfferCodes também podem ser definidos por `VITE_MONTHLY_OFFER_CODE`, `VITE_SEMIANNUAL_OFFER_CODE` e `VITE_ANNUAL_OFFER_CODE`. `null` mostra “Preço a definir”. Todos os planos oferecem o mesmo conteúdo e diferem apenas em duração. PINs e OfferCodes iniciais são placeholders deliberadamente bloqueados. Variáveis `VITE_*` são públicas no bundle; não coloque segredos nelas.

O pedido cita `DOCUMENTACAO_ASSINATURA.md` e `Texto colado(3).txt`, mas esses arquivos não estavam na raiz nem nos anexos disponíveis. A implementação usa os contratos fornecidos no pedido e respostas reais consultadas da API pública. A documentação original ainda precisa ser conferida quando disponibilizada, especialmente o contrato de assinatura e ofertas válidas.

## Funcionalidades e estrutura

Landing completa com catálogo real, benefícios, etapas, planos e FAQ; temas claro e escuro, navbar mobile, páginas institucionais e rodapé. Identificação por email normalizado, consulta sequencial de ofertas, checkout externo e retorno manual. Dashboard com indicadores locais e continuação da última prova. Catálogo paginado com busca, filtros de ano/local e ordenação.

Resolução em qualquer ordem, alternativas editáveis, navegação, retomada, conclusão confirmada, revisão e reinício confirmado. HTML sanitizado com tabelas e formatação educacional, placeholders associados aos anexos por índice, deduplicação e fallback de imagens. Anexos de alternativas também são suportados.

Desempenho filtrado por prova/matéria: cinco gráficos, oito indicadores, progresso geral e tabela. Estados de carregamento/erro/vazio, cancelamento de requisições, error boundary, teclado e redução de movimentos.

- `src/config/plans.js`: planos, hosts e validade da verificação.
- `src/services/subscriptionService.js`: status e checkout.
- `src/services/questoesService.js`: contratos reais, paginação e normalização.
- `src/services/storageService.js`: schema v1, gravação por prova e retomada.
- `src/context/StudentContext.jsx`: sessão, revalidação e histórico.
- `src/hooks/useResource.js`: carregamento cancelável e repetição manual.
- `src/components`: layout, proteção, feedback, confirmação e HTML sanitizado.
- `src/pages`: páginas públicas, área do aluno e resolução.
- `src/utils`: email, gabarito, anexos, datas e desempenho.
- `src/tests`: regras, imagens, sessão e proteção de rotas.
- `e2e`: fluxos Chromium com respostas controladas exclusivamente nos testes.

Rotas públicas: `/`, `/entrar`, `/planos`, `/assinatura/retorno`, `/sobre`, `/privacidade`, `/contato`. Protegidas: `/dashboard`, `/provas`, `/provas/:id`, `/desempenho`, `/minha-assinatura`. Configure fallback de SPA para `index.html` na hospedagem para acesso direto às rotas.

## Acesso

Somente `IsActive === true` confirma acesso. Status textual, vencimento e armazenamento não autorizam entrada. A API é consultada ao restaurar a sessão após reload e após cinco minutos de validade, inclusive ao navegar para uma rota protegida. Nenhum status ativo é restaurado do armazenamento. Sem email em nova sessão, o aluno precisa se identificar novamente. Sair preserva o histórico.

Consultas sequenciais param ao encontrar um plano ativo; HTTP 429 interrompe tentativas adicionais. Erro parcial sem confirmação ativa bloqueia acesso. HTTP 409 explica a limitação de renovação. Falhas de rede/configuração nunca liberam conteúdo. Confirmação de qualquer plano ativo libera acesso mesmo se outra oferta falhou.

O email **não é autenticação segura**. Este é um experimento sem senha, JWT ou backend próprio. A proteção de rotas restringe a interface; a API de questões é pública e dados locais podem ser alterados. Este mecanismo não oferece autorização segura para dados confidenciais.

O checkout navega para `/pin/{PIN}` sem email ou OfferCode na URL. O plano escolhido fica em sessionStorage. O retorno é manual em `/assinatura/retorno`, sem confirmação fictícia de pagamento nem polling de ativação. Não há cancelamento, alteração de cobrança ou promessa de renovação funcional.

## Histórico e resultados

Chave `aprovaif:v1:{emailNormalizado}`, com `version: 1`, email, provas, metadados das questões, respostas, posição e datas. Gravações leem o estado mais recente para preservar outras provas. Abas recebem eventos `storage`. Dados inválidos não são apagados nem sobrescritos silenciosamente. Falhas de armazenamento são exibidas e o aplicativo não afirma que salvou quando a gravação falha.

Histórico disponível apenas neste navegador e dispositivo. Não há sincronização nem múltiplas tentativas por prova. Reiniciar substitui respostas, datas e finalização daquela prova. Limpar os dados do site remove o histórico.

O gabarito é normalizado isoladamente em `src/utils/normalize.js`: exatamente um indicador positivo explícito (`true`, `1`, `'1'`, `'true'`, `'TRUE'`, `'S'` ou `'s'`) é necessário. Vazio, nenhum positivo ou múltiplos positivos produzem `unknown`. As convenções devem ser revisadas quando a fonte publicar o contrato de gabarito. Questões desconhecidas não contam como erros e não entram no denominador da taxa. Sem questões corrigíveis, a taxa aparece como “—”. Ao reabrir uma prova, a correção é recalculada conforme os dados recebidos.

Progresso geral e pendências abrangem provas iniciadas. Prova finalizada com pendências pode ter conclusão abaixo de 100%. A evolução usa a data da última resposta de cada questão, sem fabricar eventos anteriores.

## Integrações e limitações

Endpoints: `GET /provas-pagged`, `GET /GetQuestoes`, `POST /subscription/status`. A API real retornou 10 provas, questões sem gabarito na prova 137 e anexos `{ link, anexo }` na prova 167. O CORS da listagem permitiu `*` na requisição com origem local. Isso não garante disponibilidade permanente ou o comportamento de todos os endpoints em todas as hospedagens.

Se houver bloqueio de CORS, solicite liberação da origem do frontend na API correspondente. Não há proxy de produção nem contorno inseguro. A API de assinatura não pôde ser consultada sem host/códigos válidos; pagamento e ativação ponta a ponta dependem desses dados e do Ecommerce. Retorno automático não está documentado. Erros do checkout externo (incluindo 409) são controlados pelo Ecommerce e não podem ser interceptados após a navegação.

Sem mocks permanentes, backend, banco de dados ou cadastro local. A ilustração da landing é decorativa, feita em CSS, sem números fictícios de desempenho. Fontes Google Fonts com fallback local; Bootstrap Icons empacotados.

## Validação

`npm test` cobre ofertas, critérios de acesso, erros 409/429, cancelamento, email, persistência por aluno, retomada, finalização, ausência de gabarito, desempenho, filtros, sanitização, imagens e proteção de rotas. `npm run test:e2e` verifica navegação pública, mobile, identificação, revalidação após reload, retomada, revisão e desempenho em Chromium. Respostas controladas existem somente nos testes para validar a assinatura sem dados de contratação.

`npm run build` gera a produção em `dist/`. A área do aluno é carregada sob demanda para reduzir o bundle inicial.
