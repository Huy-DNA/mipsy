<template>
  <div ref='editorRef' class='w-full h-full p-1'></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from 'vue';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&inline';
import { initialCode } from './initialCode.ts';
import { lex } from '@/core/mips/lex.ts';
import { parse } from '@/core/mips/parse.ts';
import { validate } from '@/core/mips/validate.ts';
import type { Error } from '@/core/mips/types.ts';

const emit = defineEmits<{
  (e: 'errorsChange', errors: Error[]): void,
}>();

const editorWorker = new EditorWorker();

(window as any).MonacoEnvironment = {
  getWorker() {
    return editorWorker;
  },
};

const editorRef = ref(null);
let model: monaco.editor.IModel;
let uri: monaco.Uri;
const source = ref(initialCode);
const errors: Ref<Error[]> = ref([]);

onMounted(() => {
  uri = new monaco.Uri();
  model = monaco.editor.createModel(initialCode, 'mips', uri);

  monaco.editor.create(editorRef.value, {
    language: 'mips',
    value: initialCode,
    automaticLayout: true,
    model: model,
  });

  model.onDidChangeContent(() => {
    source.value = model.getValue();
  })
});

watch(source, () => {
  const tokenResult = lex(source.value);
  const nodeResult = parse(source.value, tokenResult.result);
  const validateResult = validate(source.value, tokenResult.result, nodeResult.result);
  errors.value = [...tokenResult.errors, ...nodeResult.errors, ...validateResult.errors];
  emit('errorsChange', errors.value);
});
</script>
