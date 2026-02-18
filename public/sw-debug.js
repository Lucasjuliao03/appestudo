// Script para debug do Service Worker
// Execute no console do navegador para verificar o status do SW

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers registrados:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`SW ${index + 1}:`, {
        scope: reg.scope,
        active: reg.active?.scriptURL,
        installing: reg.installing?.scriptURL,
        waiting: reg.waiting?.scriptURL,
      });
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller mudou');
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Mensagem do Service Worker:', event.data);
  });
}

// Função para desregistrar todos os service workers
window.unregisterAllSW = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service Worker desregistrado:', registration.scope);
    }
    console.log('Todos os Service Workers foram desregistrados. Recarregue a página.');
  }
};

console.log('✅ Script de debug carregado. Use window.unregisterAllSW() para desregistrar todos os SWs.');

