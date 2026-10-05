# Engenharia e verificação

## Decisões de engenharia

`metro.config.js` resolve `three` para seu módulo ESM, inclusive quando o renderizador nativo o importa por CommonJS. O wrapper CommonJS do Three r186 chama `process.emitWarning`, API de Node ausente no Hermes, e causava falha antes de registrar o app. Os testes de inicialização verificam essa resolução e carregam o módulo com essa função ausente, sem executar o aplicativo.

`src/lib` contém a integração HTTP e a normalização independente da interface. Respostas são filtradas por tipo de mídia, URLs HTTPS e identificadores únicos. As consultas têm timeout, cancelamento ao abandonar a busca, cache em memória e uma nova tentativa automática.

`src/hooks/useExpedition.ts` recupera o armazenamento antes de habilitar alterações e serializa gravações para evitar inversão de ordem. Uma falha de leitura não autoriza sobrescrever os dados existentes. Falhas de gravação são informadas na tela Expedição.

`src/components/PlanetScene.tsx` concentra o renderizador. Cinco superfícies usam o mesmo shader, uma leitura de textura por pixel, geometria de 40 × 28 segmentos e sem ruído procedural, pós-processamento ou sombras. Apenas o mapa selecionado permanece no renderizador; texturas substituídas são liberadas. Saturno usa uma única malha de anéis. Gestos atualizam referências em vez de causar renderizações React a cada movimento. A renderização é pausada quando o app está em segundo plano ou um modal está aberto. A cena parada não mantém um loop de desenho. Durante movimentos há um limite de até 40 quadros por segundo, sujeito à capacidade e à taxa de atualização do aparelho. Trocas de quantidade de dedos recalibram a origem do gesto para evitar saltos entre arraste e pinça. Falhas capturadas da cena não bloqueiam o acervo.

Listas do Atlas e Expedição são virtualizadas. Imagens utilizam cache do `expo-image`. Preferências do sistema, controles com rótulos acessíveis e zoom com botões fazem parte do fluxo.

## Avisos do renderizador nativo

`src/lib/expoGl.ts` adapta somente contextos Expo GL. Preserva orientação e alinhamento das texturas e evita duas chamadas desativadas de parâmetros de navegador que o EXGL já ignora. Ao desmontar, o renderizador continua liberando seus recursos; a tentativa de perder o contexto via `WEBGL_lose_context` ocorre apenas se a extensão existir. No nativo, o `GLView` gerencia a liberação do contexto. Não há filtro global de mensagens.

React Three Fiber 9.8.1 ainda espera o contrato de `Clock`. O resolver do Metro usa um facade ESM (`src/lib/three-runtime.mjs`) que preserva as classes do Three e fornece um adaptador baseado em `THREE.Timer`. O adaptador mantém início automático, pausa, delta em segundos e `elapsedTime` editável para avanço manual do R3F. Assim, o renderizador não instancia o relógio depreciado. Nenhuma mensagem de console é filtrada e nenhuma dependência em `node_modules` é modificada.

## Verificação e limites

Os testes cobrem normalização, duplicatas, favoritos, armazenamento corrompido, codificação de busca, cancelamento HTTP e resposta 429, transições de um para dois dedos, rotação completa nos dois eixos, centralização pela orientação mais próxima e limites de zoom, além da inicialização do Three sem APIs de Node e existência dos assets do manifesto. A verificação TypeScript confere os tipos do app. Essas verificações não substituem avaliação visual e testes de gestos, shaders, memória ou desempenho em aparelhos reais.

O `npm audit` reportou avisos nas dependências transitivas do ecossistema Expo/Metro. Nesta instalação, a resolução automática sugeria regressar para Expo 44 e React Native 0.72; essa regressão não foi aplicada porque quebraria a compatibilidade do projeto. Reavaliar os avisos e versões corrigidas antes de distribuir uma build de produção. O lockfile preserva as versões verificadas.

## Roteiro para a primeira avaliação no celular

1. Girar 360° na horizontal e vertical, aproximar cada planeta e centralizar após várias voltas, incluindo Saturno.
2. Conferir a rotação automática ao abrir e trocar planetas, tocar para manipulá-los, soltá-los para retomar, pausá-la pelo botão e verificar movimento reduzido.
3. Trocar entre arraste e pinça; rolar a home a partir do texto, alternar as coleções NASA, abrir os detalhes do planeta e retornar à cena.
4. Buscar um termo, filtrar por época, abrir uma foto, ampliar em versão maior, restaurar e compartilhar.
5. Salvar uma descoberta, fechar e reabrir o app, confirmar a expedição e remover a descoberta.
6. Avaliar falhas de rede, uma busca sem resultados, tamanho de fonte maior e leitor de tela.
7. Conferir uso de memória e fluidez em um Android intermediário e um iPhone.
