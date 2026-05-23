import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app/App.vue';
import { bootstrapLegacyApp, showBootstrapError } from './app/bootstrap.js';

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
app.use(createPinia());
app.mount(ensureVueRoot());

bootstrapLegacyApp().catch(showBootstrapError);
