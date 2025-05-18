<template>
  <div ref='editorRef' class='w-full h-full p-1'></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&inline';
import { initialCode } from './initialCode.ts';

const editorWorker = new EditorWorker();

(window as any).MonacoEnvironment = {
  getWorker() {
    return editorWorker;
  },
};

const editorRef = ref(null);

onMounted(() => {
  monaco.editor.create(editorRef.value, {
    language: 'dbml',
    value: initialCode,
    automaticLayout: true,
  });
});
</script>
