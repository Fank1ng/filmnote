import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app/App.vue';
import { bootstrapVueApp, showBootstrapError } from './app/bootstrap.js';

function ensureVueRoot(): HTMLElement {
  let root = document.getElementById('filmnoteVueRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'filmnoteVueRoot';
    document.body.appendChild(root);
  }
  return root;
}

const app = createApp(App);

try {
  bootstrapVueApp();
  app.use(createPinia());
  app.mount(ensureVueRoot());
} catch (error) {
  showBootstrapError(error);
}
